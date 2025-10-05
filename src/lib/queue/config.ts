// lib/queue/config.ts
import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
const redisConnection = new IORedis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  }
);

// Shared queue options
const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, then 4s, 8s
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

// Agent processing queue
export const agentQueue = new Queue('agent-processing', defaultQueueOptions);

// Export connection for workers to reuse
export { redisConnection };

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing queue connections...');
  await agentQueue.close();
  await redisConnection.quit();
});