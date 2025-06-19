import { schedule, ScheduledTask } from "node-cron";
import { db } from "@/lib/db";
import {
  agents,
  scheduledRuns,
  runHistory,
  keywords,
  users,
  monitoringResults,
} from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { runAgent } from "@/lib/agents/redditAgent";
import { sendRunNotification } from "@/lib/notifications";

// Initialize the scheduler
let initialized = false;
const scheduledTasks: Record<string, ScheduledTask> = {};

/**
 * Initialize the scheduler
 */
export function initializeScheduler() {
  if (initialized) {
    // console.log("⚠️ Already initialized, skipping setup.");
    return;
  }
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
    const now = new Date();

    // Get all active agents
    const activeAgents = await db
      .select({
        agent: agents,
        user: users,
      })
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.isActive, true));

    for (const { agent, user } of activeAgents) {
      const config = JSON.parse(agent.configuration) as any;
      const userPlan = user?.subscriptionTier as
        | "starter"
        | "growth"
        | "enterprise";
      if (!config.scheduleRuns || !config.scheduleRuns.enabled) {
        console.log("⚠️ Scheduled runs not found skipping.");
        continue;
      }

      // Get the plan interval in hours
      const planIntervals: Record<string, number> = {
        starter: 8,
        growth: 5,
        enterprise: 2,
      };
      const intervalHours = planIntervals[userPlan];
      if (!intervalHours) continue;

      // Parse schedule start time (format: "HH:mm")
      const scheduleTimeStr = config.scheduleRuns.scheduleTime || "00:00";
      const [startHour, startMinute] = scheduleTimeStr.split(":").map(Number);
      // Step 2: Create a date object for today in IST
      const istNow = new Date(now);
      istNow.setHours(startHour, startMinute, 0, 0);

      // Step 3: Subtract 5 hours 30 minutes to convert IST to UTC
      const utcTimeMs = istNow.getTime() - 5.5 * 60 * 60 * 1000;
      const scheduleStartUTC = new Date(utcTimeMs);

      // If scheduleStart is in the future (today), shift it to the past
      if (scheduleStartUTC > now) {
        scheduleStartUTC.setDate(scheduleStartUTC.getDate() - 1);
      }

      const msSinceStart = now.getTime() - scheduleStartUTC.getTime();
      const hoursSinceStart = msSinceStart / (1000 * 60 * 60);

      const shouldRun =
        now.getMinutes() === startMinute &&
        Math.abs(hoursSinceStart % intervalHours) < 0.01;

      console.log("Status", {
        now: now.toISOString(),
        scheduleStart: scheduleStartUTC.toISOString(),
        msSinceStart,
        hoursSinceStart,
        remainder: hoursSinceStart % intervalHours,
        runStatus: shouldRun,
      });

      if (shouldRun) {
        // Check if a run already scheduled in this minute
        const existingRun = await db
          .select()
          .from(scheduledRuns)
          .where(
            and(
              eq(scheduledRuns.agentId, agent.id),
              eq(scheduledRuns.status, "pending"),
              gte(
                scheduledRuns.scheduledFor,
                new Date(now.getTime() - 1000 * 60)
              ), // 1 minute buffer
              lte(
                scheduledRuns.scheduledFor,
                new Date(now.getTime() + 1000 * 60)
              )
            )
          )
          .limit(1);

        if (existingRun.length === 0) {
          await db.insert(scheduledRuns).values({
            id: createId(),
            agentId: agent.id,
            scheduledFor: new Date(),
            status: "pending",
            createdAt: new Date(),
          });

          console.log(
            `✅ Scheduled run for agent ${agent.name} (${
              agent.id
            }) at ${now.toISOString()}`
          );
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
        let relevantResultCount = 0;
        const totalkeywords = keywordList.length;
        const steps = [];
        const relevanceThreshold = JSON.parse(
          agent[0].configuration
        ).relevanceThreshold;

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
              businessDescription: agent[0].description || "",
              onProgress: (message) => {
                steps.push({
                  type: "progress",
                  message,
                  timestamp: new Date().toISOString(),
                });
              },
            });

            if (result.storedResult.length > 0) {
              results.push({
                keyword,
                resultId: result.storedResult.resultId,
                success: true,
              });
              relevantResultCount =
                relevantResultCount + result.storedResult.length;
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

        // Update agent stats
        await db
          .update(agents)
          .set({
            lastRunAt: new Date(),
            runCount: agent[0].runCount + 1,
          })
          .where(eq(agents.id, run.agentId));

        let summary = "";
        let recentResults: any = [];
        if (relevantResultCount > 0) {
          // Get the stored results from the database
          recentResults = await db
            .select()
            .from(monitoringResults)
            .where(eq(monitoringResults.agentId, run.agentId))
            .orderBy(monitoringResults.createdAt);

          summary = `Found results from ${relevantResultCount} keywords`;

          console.log("Results Found:", relevantResultCount);

          if (recentResults.length > 0) {
            summary += `Most recent results include content from r/${recentResults[0].subreddit} with ${recentResults[0].relevanceScore}% relevance.`;

            // Send notification
            await sendRunNotification({
              agentId: run.agentId,
              success: true,
              message: summary,
              resultsCount: relevantResultCount,
              processedKeywords: keywordList.length,
            });
          }
        } else {
          summary = `No New relevant results found across ${keywordList.length} keywords.`;
        }

        // Update run history
        // await db
        //   .update(runHistory)
        //   .set({
        //     completedAt: new Date(),
        //     success: true,
        //     resultsCount: storedResultIds.length,
        //     processedKeywords: keywordList.length,
        //     summary,
        //     steps: JSON.stringify(steps),
        //   })
        //   .where(eq(runHistory.id, runHistoryId));

        // Mark scheduled run as completed
        await db
          .update(scheduledRuns)
          .set({
            status: "completed",
            completedAt: new Date(),
            result: JSON.stringify({
              success: true,
              resultsCount: relevantResultCount,
              processedKeywords: keywordList.length,
              summary,
            }),
          })
          .where(eq(scheduledRuns.id, run.id));
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
