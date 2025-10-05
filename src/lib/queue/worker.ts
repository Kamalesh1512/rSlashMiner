//lib/queue/worker.ts
import { Worker, Job } from "bullmq";
import { agentQueue, redisConnection } from "./config";
import { AgentProcessor } from "../semantic-tracker/agent-processor";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface AgentJobData {
  agentId: string;
  userId: string;
  isInitialRun?: boolean;
  recurring?: boolean;
}

export class AgentWorker {
  private worker: Worker<AgentJobData>;
  private processor: AgentProcessor;

  constructor() {
    this.processor = new AgentProcessor();

    this.worker = new Worker<AgentJobData>(
      "agent-processing",
      async (job: Job<AgentJobData>) => this.processJob(job),
      {
        connection: redisConnection,
        concurrency: 5, // Dynamic: increase if you have more CPU
        limiter: { max: 20, duration: 60000 }, // Max 20 jobs per minute
      }
    );

    this.setupEventHandlers();
  }

  private async processJob(job: Job<AgentJobData>) {
    const { agentId, isInitialRun, recurring } = job.data;
    console.log(`[Worker] Processing job ${job.id} for agent ${agentId}`);

    try {
      // 1️⃣ Verify agent exists & is active
      const agentRecord = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

      if (!agentRecord.length) throw new Error(`Agent ${agentId} not found`);
      if (agentRecord[0].status !== "active") {
        console.log(`[Worker] Agent ${agentId} inactive, skipping`);
        return { skipped: true, reason: "Agent inactive" };
      }

      // 2️⃣ Process the agent
      await this.processor.processAgent(agentId);

      // 3️⃣ Update job progress
      await job.updateProgress(100);

      console.log(`[Worker] Successfully processed agent ${agentId}`);

      // 4️⃣ Queue next recurring job if first run
      if (isInitialRun) {
        const nextExecution = new Date();
        nextExecution.setDate(nextExecution.getDate() + 1); // daily recurrence

        await agentQueue.add(
          `agent-${agentId}-recurring`,
          { agentId, recurring: true },
          {
            delay: nextExecution.getTime() - Date.now(),
            jobId: `${agentId}-recurring`,
          }
        );

        console.log(`[Worker] Scheduled recurring job for agent ${agentId}`);
      }

      return {
        success: true,
        agentId,
        processedAt: new Date().toISOString(),
        isInitialRun,
      };
    } catch (err) {
      console.error(`[Worker] Error processing agent ${agentId}:`, err);

      // Set agent status to error if max retries reached
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        await db
          .update(agents)
          .set({ status: "error", updatedAt: new Date() })
          .where(eq(agents.id, agentId));
      }

      throw err; // retry handled by BullMQ
    }
  }

  private setupEventHandlers() {
    this.worker.on("completed", (job) =>
      console.log(`[Worker] Job ${job.id} completed`)
    );
    this.worker.on("failed", (job, err) =>
      console.error(`[Worker] Job ${job?.id} failed:`, err?.message)
    );
    this.worker.on("error", (err) =>
      console.error("[Worker] Worker error:", err)
    );
    this.worker.on("active", (job) => {
      console.log(`[Worker] Job ${job.id} is active`);
    });
  }

  async close() {
    console.log("[Worker] Closing worker...");
    await this.worker.close();
  }
}

// ✅ Auto-start worker if file is run directly
  console.log("[Worker] Starting agent worker process...");
  const worker = new AgentWorker();

  process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM received, closing worker...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Worker] SIGINT received, closing worker...");
    await worker.close();
    process.exit(0);
  });