// lib/semantic-tracker/scheduler.ts
import { db } from '@/lib/db';
import { agents, users } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { AgentProcessor } from './agent-processor';

export class AgentScheduler {
  private processor: AgentProcessor;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.processor = new AgentProcessor();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting agent scheduler...');
    
    // Process agents every 5 minutes
    this.intervalId = setInterval(async () => {
      await this.processScheduledAgents();
    }, 5 * 60 * 1000);
    
    // Initial run
    await this.processScheduledAgents();
  }

  async triggerAgentExecution(agentId: string): Promise<void> {
    console.log(`Manually triggering execution for agent ${agentId}`);
    
    try {
      await this.processor.processAgent(agentId);
      
      // Schedule next execution
      const nextExecution = new Date();
      nextExecution.setHours(nextExecution.getHours() + 24); // 24 hours for daily frequency
      
      await db
        .update(agents)
        .set({
          nextExecutionAt: nextExecution,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agentId));
        
    } catch (error) {
      console.error(`Error in manual execution for agent ${agentId}:`, error);
      throw error;
    }
  }

  private async processScheduledAgents(): Promise<void> {
    try {
      // Find agents that need to be executed
      const agentsToProcess = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.status, 'active'),
            eq(agents.isAutoRun, true),
            lte(agents.nextExecutionAt, new Date())
          )
        );

      console.log(`Found ${agentsToProcess.length} agents to process`);

      for (const agent of agentsToProcess) {
        try {
          // Check user's lead limits before processing
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, agent.userId))
            .limit(1);

          if (user.length === 0) {
            console.error(`User ${agent.userId} not found for agent ${agent.id}`);
            continue;
          }

          const userConfig = user[0];

          // Skip if user has exceeded monthly limit
          if (userConfig.monthlyLeadsUsed >= userConfig.monthlyLeadLimit) {
            console.log(`Skipping agent ${agent.id} - user ${agent.userId} has exceeded monthly lead limit`);
            
            // Pause the agent
            await db
              .update(agents)
              .set({
                status: 'paused',
                updatedAt: new Date(),
              })
              .where(eq(agents.id, agent.id));
            
            continue;
          }

          await this.processor.processAgent(agent.id);
          
          // Schedule next execution (24 hours for daily frequency)
          const nextExecution = new Date();
          nextExecution.setHours(nextExecution.getHours() + 24);
          
          await db
            .update(agents)
            .set({
              nextExecutionAt: nextExecution,
              updatedAt: new Date(),
            })
            .where(eq(agents.id, agent.id));
            
        } catch (error) {
          console.error(`Error processing agent ${agent.id}:`, error);
          
          // Update agent status to error
          await db
            .update(agents)
            .set({
              status: 'error',
              updatedAt: new Date(),
            })
            .where(eq(agents.id, agent.id));
        }
      }
    } catch (error) {
      console.error('Error in scheduled agent processing:', error);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Agent scheduler stopped');
  }

  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}