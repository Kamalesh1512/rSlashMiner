import {schedule, ScheduledTask} from "node-cron";
import { db } from "@/lib/db";
import { agents, scheduledRuns, runHistory, keywords } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { runAgent } from "@/lib/agents/redditAgent";
import { sendRunNotification } from "@/lib/notifications";

// Initialize the scheduler
let initialized = false;
const scheduledTasks: Record<string,ScheduledTask> = {};

/**
 * Initialize the scheduler
 */
export function initializeScheduler() {
  if (initialized) return;

  console.log("Initializing agent scheduler...");

  // Schedule job to check for agents that need to run every minute
  schedule("* * * * *", async () => {
    console.log("Running scheduler check...");
    await scheduleAgentRuns();
  });

  // Schedule job to process pending scheduled runs every minute
  schedule("* * * * *", async () => {
    console.log("Processing pending scheduled runs...");
    await processPendingRuns();
  });

  // Schedule daily job to reset schedules at midnight
  schedule("0 0 * * *", async () => {
    console.log("Resetting daily schedules...");
    await resetDailySchedules();
  });

  initialized = true;
}

/**
 * Schedule agent runs based on their configuration
 */
async function scheduleAgentRuns() {
  try {
    // Get all active agents
    const activeAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.isActive, true));

    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();

    for (const agent of activeAgents) {
      const config = agent.configuration as any;

      // Skip if agent doesn't have schedule configuration
      if (!config.scheduleRuns || !config.scheduleRuns.enabled) {
        continue;
      }

      let shouldRun = false;

      // Parse the scheduleTime to get the start time (e.g., "9:00AM" => 9:00)
      const scheduleTimeParts = config.scheduleRuns.scheduleTime.split(':');
      const scheduleStartHour = parseInt(scheduleTimeParts[0], 10);
      const scheduleStartMinute = parseInt(scheduleTimeParts[1], 10);

      // Check if the current time is after or equal to the scheduled time
      if (currentHour > scheduleStartHour || (currentHour === scheduleStartHour && currentMinute >= scheduleStartMinute)) {
        // Determine if the agent should run based on the interval
        if (config.scheduleRuns.interval === "15-min") {
          shouldRun = currentMinute % 15 === 0;
        } else if (config.scheduleRuns.interval === "30-min") {
          shouldRun = currentMinute % 30 === 0;
        } else if (config.scheduleRuns.interval === "Hour") {
          shouldRun = currentMinute === 0;
        } else if (config.scheduleRuns.interval === "every 2 hrs") {
          shouldRun = currentMinute === 0 && currentHour % 2 === 0;
        }
      }

      if (shouldRun) {
        // Check if there's already a pending run for this agent
        const existingRun = await db
          .select()
          .from(scheduledRuns)
          .where(
            and(
              eq(scheduledRuns.agentId, agent.id),
              eq(scheduledRuns.status, "pending"),
              gte(
                scheduledRuns.scheduledFor,
                new Date(now.setMinutes(currentMinute, 0, 0))
              ),
              lte(
                scheduledRuns.scheduledFor,
                new Date(now.setMinutes(currentMinute, 59, 999))
              )
            )
          )
          .limit(1);

        if (existingRun.length === 0) {
          // Schedule a new run
          await db.insert(scheduledRuns).values({
            id: createId(),
            agentId: agent.id,
            scheduledFor: new Date(),
            status: "pending",
            createdAt: new Date(),
          });

          console.log(`Scheduled run for agent ${agent.name} (${agent.id})`);
        }
      }
    }
  } catch (error) {
    console.error("Error scheduling agent runs:", error);
  }
}


/**
 * Process pending scheduled runs
 */
async function processPendingRuns() {
  try {
    // Get pending runs that are due
    const pendingRuns = await db
      .select()
      .from(scheduledRuns)
      .where(
        and(
          eq(scheduledRuns.status, "pending"),
          lte(scheduledRuns.scheduledFor, new Date())
        )
      )
      .limit(5); // Process 5 at a time to avoid overloading

    for (const run of pendingRuns) {
      // Mark as processing
      await db
        .update(scheduledRuns)
        .set({
          status: "processing",
          startedAt: new Date(),
        })
        .where(eq(scheduledRuns.id, run.id));

      try {
        // Get agent details
        const agent = await db
          .select()
          .from(agents)
          .where(eq(agents.id, run.agentId))
          .limit(1);

        if (!agent || agent.length === 0) {
          throw new Error(`Agent ${run.agentId} not found`);
        }

        // Get keywords for this agent
        const keywordsResult = await db
          .select({ name: keywords.keyword })
          .from(keywords)
          .where(eq(keywords.agentId, run.agentId));

        const keywordList = keywordsResult.map((key) => key.name);

        if (keywordList.length === 0) {
          throw new Error("Agent has no keywords configured");
        }

        // Create run history record
        const runHistoryId = createId();
        await db.insert(runHistory).values({
          id: runHistoryId,
          agentId: run.agentId,
          userId: agent[0].userId,
          startedAt: new Date(),
          isScheduled: true,
        });

        // Track results
        const results = [];
        const storedResultIds = [];
        const steps = [];
        const relevanceThreshold = JSON.parse(
          agent[0].configuration
        ).relevanceThreshold

        // Process each keyword
        for (const keyword of keywordList) {
          try {
            steps.push({
              type: "start",
              message: `Processing keyword "${keyword}"`,
              timestamp: new Date().toISOString(),
            });

            const result = await runAgent({
              agentId: run.agentId,
              query: keyword,
              relevanceThreshold,
              businessInterests: keywordList,
              businessDescription: agent[0].description || "",
              onProgress: (message) => {
                steps.push({
                  type: "progress",
                  message,
                  timestamp: new Date().toISOString(),
                });
              },
            });

            if (result.storedResult && result.storedResult.success) {
              results.push({
                keyword,
                resultId: result.storedResult.resultId,
                success: true,
              });
              storedResultIds.push(result.storedResult.resultId);
            }

            steps.push({
              type: "complete",
              message: `Completed processing keyword "${keyword}"`,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error(`Error processing keyword ${keyword}:`, error);
            steps.push({
              type: "error",
              message: `Error processing keyword "${keyword}": ${error}`,
              timestamp: new Date().toISOString(),
            });
            results.push({
              keyword,
              success: false,
              error: String(error),
            });
          }
        }

        // Generate summary
        let summary = "";
        if (storedResultIds.length > 0) {
          summary = `Found ${storedResultIds.length} relevant results across ${keywordList.length} keywords.`;
        } else {
          summary = `No relevant results found across ${keywordList.length} keywords.`;
        }

        // Update run history
        await db
          .update(runHistory)
          .set({
            completedAt: new Date(),
            success: true,
            resultsCount: storedResultIds.length,
            processedKeywords: keywordList.length,
            summary,
            steps: JSON.stringify(steps),
          })
          .where(eq(runHistory.id, runHistoryId));

        // Update agent stats
        await db
          .update(agents)
          .set({
            lastRunAt: new Date(),
            runCount: agent[0].runCount + 1,
          })
          .where(eq(agents.id, run.agentId));

        // Mark scheduled run as completed
        await db
          .update(scheduledRuns)
          .set({
            status: "completed",
            completedAt: new Date(),
            result: JSON.stringify({
              success: true,
              resultsCount: storedResultIds.length,
              processedKeywords: keywordList.length,
              summary,
            }),
          })
          .where(eq(scheduledRuns.id, run.id));

        // Send notification
        await sendRunNotification({
          agentId: run.agentId,
          success: true,
          message: summary,
          resultsCount: storedResultIds.length,
          processedKeywords: keywordList.length,
        });
      } catch (error) {
        console.error(`Error processing scheduled run ${run.id}:`, error);

        // Mark as failed
        await db
          .update(scheduledRuns)
          .set({
            status: "failed",
            completedAt: new Date(),
            result: JSON.stringify({
              success: false,
              error: String(error),
            }),
          })
          .where(eq(scheduledRuns.id, run.id));

        // Send failure notification
        await sendRunNotification({
          agentId: run.agentId,
          success: false,
          message: "Scheduled agent run failed",
          error: String(error),
        });
      }
    }
  } catch (error) {
    console.error("Error processing pending runs:", error);
  }
}

/**
 * Reset daily schedules
 */
async function resetDailySchedules() {
  // This function can be used to reset any daily counters or limits
  console.log("Daily schedule reset completed");
}

/**
 * Manually trigger an agent run
 */
export async function triggerAgentRun(agentId: string) {
  try {
    const scheduledRunId = createId();

    await db.insert(scheduledRuns).values({
      id: scheduledRunId,
      agentId,
      scheduledFor: new Date(),
      status: "pending",
      createdAt: new Date(),
    });

    return { success: true, scheduledRunId };
  } catch (error) {
    console.error(`Error triggering agent run for ${agentId}:`, error);
    return { success: false, error: String(error) };
  }
}
