import { db } from "@/lib/db"
import { agents, keywords, scheduledRuns, subreddits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import cron from "node-cron"
import { sendRunNotification } from "@/lib/notifications"
import { runAgent } from "@/lib/agents/redditAgent"


// Scheduler functions for scheduled agent runs

// Function to check if an agent should run today
export async function shouldAgentRunToday(agentId: string): Promise<boolean> {
    try {
      // Get agent configuration
      const agent = await db.select().from(agents).where(eq(agents.id, agentId))
  
      if (!agent) {
        console.error(`Agent ${agentId} not found`)
        return false
      }
  
      // If agent is not active, don't run
      if (!agent[0].isActive) {
        return false
      }
  
      // If schedule type is "always", run every day
      if (JSON.parse(agent[0].configuration).scheduleType === "always") {
        return true
      }
  
      // Check if today is a scheduled day
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      return !!JSON.parse(agent[0].configuration).scheduleDays?.[today]
    } catch (error) {
      console.error(`Error checking if agent should run today: ${error}`)
      return false
    }
  }
  
  // Function to check if it's time to run the agent
  export function isTimeToRun(scheduleTime: string): boolean {
    const now = new Date()
    const [scheduledHour, scheduledMinute] = scheduleTime.split(":").map(Number)
  
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
  
    // Run if current time is within 5 minutes of scheduled time
    return currentHour === scheduledHour && currentMinute >= scheduledMinute && currentMinute < scheduledMinute + 5
  }
  
  // Function to schedule an agent run
  export async function scheduleAgentRun(agentId: string): Promise<void> {
    try {
      // Create a scheduled run record
      await db.insert(scheduledRuns).values({
        id: createId(),
        agentId,
        scheduledFor: new Date(),
        status: "pending",
      })
    } catch (error) {
      console.error(`Error scheduling agent run: ${error}`)
    }
  }
  
  // Function to process scheduled runs
  export async function processScheduledRuns(): Promise<void> {
    try {
      // Get pending scheduled runs
      const pendingRuns = await db.select().from(scheduledRuns).where(eq(scheduledRuns.status, "pending"),)
  
      for (const run of pendingRuns) {
        try {
          // Mark as processing
          await db
            .update(scheduledRuns)
            .set({ status: "processing", startedAt: new Date() })
            .where(eq(scheduledRuns.id, run.id))
  
          // Get agent details
          const agent = await db.select().from(agents).where(eq(agents.id, run.agentId))
  
          if (!agent) {
            throw new Error(`Agent ${run.agentId} not found`)
          }
  
          // Get keywords and subreddits
          const keywordsResult = await db.select().from(keywords).where(eq(keywords.agentId, run.agentId))
  
          const subredditsResult = await db.select().from(subreddits).where(eq(subreddits.agentId, run.agentId))
  
          const relevanceThreshold = JSON.parse(agent[0].configuration).relevanceThreshold

          const keywordList = keywordsResult.map((key) => key.keyword);
          // Run the agent for each subreddit
          for (const subreddit of subredditsResult) {
            await runAgent({
              agentId: run.agentId,
              subreddit: subreddit.subredditName,
              relevanceThreshold:relevanceThreshold,
              query: keywordList || "",
              businessInterests: keywordsResult.map((k) => k.keyword),
              businessDescription: agent[0].description || "",
              onProgress: (message) => {
                console.log(`[Scheduled Run ${run.id}] ${message}`)
              },
            })
          }
  
          // Mark as completed
          await db
            .update(scheduledRuns)
            .set({
              status: "completed",
              completedAt: new Date(),
              result: JSON.stringify({ success: true }),
            })
            .where(eq(scheduledRuns.id, run.id))
  
  
  
          // Send notification
          await sendRunNotification({agentId:run.agentId,message:"Scheduled agent run completed successfully",success:true,})
        } catch (error) {
          console.error(`Error processing scheduled run ${run.id}: ${error}`)
  
          // Mark as failed
          await db
            .update(scheduledRuns)
            .set({
              status: "failed",
              completedAt: new Date(),
              result: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            })
            .where(eq(scheduledRuns.id, run.id))
  
          // Send notification about failure
          await sendRunNotification({agentId:run.agentId, success:false, message:`Scheduled agent run failed: ${error}`})
        }
      }
    } catch (error) {
      console.error(`Error processing scheduled runs: ${error}`)
    }
  }
  
  // Initialize scheduler
  let schedulerInitialized = false
  
  export function initializeScheduler() {
    if (schedulerInitialized) return
  
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      console.log("Running scheduler check...")
  
      try {
        // Get all active agents
        const activeAgents = await db.select().from(agents).where(eq(agents.isActive, true))
  
        for (const agent of activeAgents) {
          // Check if agent should run today
          const shouldRunToday = await shouldAgentRunToday(agent.id)
  
          if (shouldRunToday) {
            // Check if it's time to run
            const scheduleTime = JSON.parse(agent.configuration).scheduleTime
  
            if (isTimeToRun(scheduleTime)) {
              console.log(`Scheduling run for agent ${agent.id}`)
              await scheduleAgentRun(agent.id)
            }
          }
        }
  
        // Process any pending scheduled runs
        await processScheduledRuns()
      } catch (error) {
        console.error(`Scheduler error: ${error}`)
      }
    })
  
    schedulerInitialized = true
    console.log("Agent scheduler initialized")
  }
  
  