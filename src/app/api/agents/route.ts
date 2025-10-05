// app/api/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  agents,
  agentKeywords,
  agentPlatformConfigs,
  users,
  monitoringResults,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { auth } from "@/lib/auth";
import { agentQueue } from "@/lib/queue/config";


// GET - Fetch user's agents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session?.user.id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const userAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, session.user.id))
      .orderBy(agents.createdAt);

    const agentsWithDetails = await Promise.all(
      userAgents.map(async (agent) => {
        // Fetch keywords
        const keywordsData = await db
          .select()
          .from(agentKeywords)
          .where(eq(agentKeywords.agentId, agent.id));

        // Parse keywords - handle both array and JSON string
        let parsedKeywords: string[] = [];
        let parsedExcludedKeywords: string[] = [];
        
        if (keywordsData.length > 0) {
          const kwData = keywordsData[0];
          try {
            parsedKeywords = typeof kwData.keyword === 'string' 
              ? JSON.parse(kwData.keyword) 
              : kwData.keyword || [];
            parsedExcludedKeywords = typeof kwData.excludedKeywords === 'string'
              ? JSON.parse(kwData.excludedKeywords)
              : kwData.excludedKeywords || [];
          } catch (e) {
            console.error(`Error parsing keywords for agent ${agent.id}:`, e);
          }
        }

        // Fetch platform configs
        const platformConfigsData = await db
          .select()
          .from(agentPlatformConfigs)
          .where(eq(agentPlatformConfigs.agentId, agent.id));

        // Transform platform configs to Record format
        const platformConfigs: Record<string, { config: any; isEnabled: boolean }> = {};
        platformConfigsData.forEach((pc) => {
          platformConfigs[pc.platform] = {
            config: pc.config,
            isEnabled: pc.isEnabled,
          };
        });

        const recentResults = await db
          .select()
          .from(monitoringResults)
          .where(eq(monitoringResults.agentId, agent.id))
          .orderBy(desc(monitoringResults.createdAt))

        // Calculate performance metrics
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const last24hResults = recentResults.filter(
          r => new Date(r.createdAt) >= last24h
        );
        const last7dResults = recentResults.filter(
          r => new Date(r.createdAt) >= last7d
        );
        const last30dResults = recentResults.filter(
          r => new Date(r.createdAt) >= last30d
        );

        const highQualityLeads = recentResults.filter(
          r => (r.relevanceScore || 0) >= 85
        ).length;

        const qualifiedLeads = recentResults.filter(
          r => (r.leadScore || 0) >= 70
        ).length;

        const totalRelevance = recentResults.reduce(
          (sum, r) => sum + (r.relevanceScore || 0), 
          0
        );
        const avgRelevance = recentResults.length > 0 
          ? Math.round(totalRelevance / recentResults.length) 
          : 0;

        const recentRelevance = last30dResults.length > 0
          ? Math.round(
              last30dResults.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / 
              last30dResults.length
            )
          : 0;

        // Get job status from queue
        let jobStatus = null;
        try {
          const jobs = await agentQueue.getJobs([
            "waiting",
            "active",
            "delayed",
          ]);
          const agentJob = jobs.find((j) => j.data.agentId === agent.id);
          if (agentJob) {
            jobStatus = {
              id: agentJob.id,
              state: await agentJob.getState(),
              progress: agentJob.progress,
            };
          }
        } catch (error) {
          console.error(
            `Error fetching job status for agent ${agent.id}:`,
            error
          );
        }

        return {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          isAutoRun: agent.isAutoRun,
          platforms: agent.platforms,
          
          notificationsEnabled: agent.notificationsEnabled,
          notificationFrequency: agent.notificationFrequency,
          notificationChannels: agent.notificationChannels,
          lastExecutedAt: agent.lastExecutedAt,
          nextExecutionAt: agent.nextExecutionAt,
          executionCount: agent.executionCount,
          
          totalLeadsGenerated: agent.totalLeadsGenerated || recentResults.length,
          averageRelevanceScore: agent.averageRelevanceScore || avgRelevance,
          
          color: agent.color,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          
          keywords: parsedKeywords,
          excludedKeywords: parsedExcludedKeywords,
          platformConfigs,
          
          recentResults,
          
          performance: {
            totalLeads: agent.totalLeadsGenerated || recentResults.length,
            averageRelevanceScore: agent.averageRelevanceScore || avgRelevance,
            highQualityLeads,
            qualifiedLeads,
            last24Hours: last24hResults.length,
            last7Days: last7dResults.length,
            last30Days: last30dResults.length,
            recentAverageRelevance: recentRelevance,
          },
          
          jobStatus, // Optional: remove if not needed
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
// POST - Create new agent and queue job
export async function POST(request: NextRequest) {
  let agentId: string | null = null;
  let jobId: string | null = null;

  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      keywords,
      excludedKeywords,
      platforms,
      platformConfigs,
      notificationsEnabled,
      notificationFrequency,
      notificationChannels,
      color,
    } = body;

    // Validate required fields
    if (!userId || !name || !keywords?.length || !platforms?.length) {
      return NextResponse.json(
        { error: "Missing required fields: userId, name, keywords, platforms" },
        { status: 400 }
      );
    }

    // Check user's agent limits
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userConfig = user[0];
    const existingAgents = await db
      .select({ count: agents.id })
      .from(agents)
      .where(eq(agents.userId, userId));

    if (existingAgents.length >= userConfig.maxAgents) {
      return NextResponse.json(
        {
          error: `Agent limit reached. Your plan allows ${userConfig.maxAgents} agents.`,
          limit: userConfig.maxAgents,
        },
        { status: 403 }
      );
    }

    // Create agent
    agentId = createId();
    const nextExecution = new Date();
    nextExecution.setMinutes(nextExecution.getMinutes() + 5);

    const [newAgent] = await db
      .insert(agents)
      .values({
        id: agentId,
        userId,
        name,
        description,
        platforms,
        notificationsEnabled,
        notificationFrequency: notificationFrequency as any,
        notificationChannels,
        nextExecutionAt: nextExecution,
        color,
      })
      .returning();

    // Create agent keywords
    await db.insert(agentKeywords).values({
      agentId,
      keyword: JSON.stringify(keywords),
      excludedKeywords: JSON.stringify(excludedKeywords),
    });

    // Create platform configs
    const platformConfigInserts = platforms
      .filter((platform: string) => platformConfigs?.[platform])
      .map((platform: string) => ({
        agentId,
        platform: platform as any,
        config: platformConfigs[platform],
        isEnabled: true,
      }));

    if (platformConfigInserts.length > 0) {
      await db.insert(agentPlatformConfigs).values(platformConfigInserts);
    }

    // 🚀 QUEUE THE JOB - Immediate first run
    try {
      const job = await agentQueue.add(
        `agent-${agentId}`,
        {
          agentId,
          userId,
          isInitialRun: true,
        },
        {
          jobId: `${agentId}-initial-${Date.now()}`,
          delay: 10000, // Start after 10 seconds
          priority: 1, // High priority for initial run
        }
      );

      jobId = job.id as string;
      console.log(`[API] Queued initial job ${jobId} for agent ${agentId}`);

      // Queue recurring job (daily)
      await agentQueue.add(
        `agent-${agentId}-recurring`,
        {
          agentId,
          userId,
          isInitialRun: false,
        },
        {
          jobId: `${agentId}-recurring`,
          repeat: {
            pattern: "0 0 * * *", // Daily at midnight (cron format)
          },
        }
      );

      console.log(`[API] Scheduled recurring job for agent ${agentId}`);
    } catch (queueError) {
      console.error(
        `[API] Failed to queue job for agent ${agentId}:`,
        queueError
      );

      // Rollback: Delete the agent
      await db.delete(agents).where(eq(agents.id, agentId));
      await db.delete(agentKeywords).where(eq(agentKeywords.agentId, agentId));
      await db
        .delete(agentPlatformConfigs)
        .where(eq(agentPlatformConfigs.agentId, agentId));

      throw new Error(
        "Failed to schedule agent job. Agent creation rolled back."
      );
    }

    return NextResponse.json(
      {
        success: true,
        agent: {
          ...newAgent,
          keywords: [
            {
              keyword: JSON.stringify(keywords),
              excludedKeywords: JSON.stringify(excludedKeywords),
            },
          ],
          platformConfigs: platformConfigInserts,
        },
        jobId,
        message: "Agent created successfully and job queued",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating agent:", error);

    // Additional cleanup if needed
    if (agentId && jobId) {
      try {
        const job = await agentQueue.getJob(jobId);
        if (job) {
          await job.remove();
          console.log(`[API] Rolled back job ${jobId}`);
        }
      } catch (cleanupError) {
        console.error(`[API] Failed to cleanup job ${jobId}:`, cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}

// PUT - Update existing agent
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      userId,
      name,
      description,
      status,
      platforms,
      keywords,
      excludedKeywords,
      platformConfigs,
      notificationFrequency,
      notificationChannels,
    } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Agent ID and User ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);

    if (!existingAgent.length || existingAgent[0].userId !== userId) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Update agent
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (platforms) updateData.platforms = platforms;
    if (notificationFrequency)
      updateData.notificationFrequency = notificationFrequency;
    if (notificationChannels)
      updateData.notificationChannels = notificationChannels;
    updateData.updatedAt = new Date();

    // Handle job scheduling based on status
    if (status === "paused" || status === "stopped") {
      updateData.nextExecutionAt = null;

      // Remove recurring job
      const recurringJobId = `${id}-recurring`;
      try {
        const job = await agentQueue.getJob(recurringJobId);
        if (job) {
          await job.remove();
          console.log(`[API] Removed recurring job for paused agent ${id}`);
        }
      } catch (error) {
        console.error(`[API] Error removing job for agent ${id}:`, error);
      }
    } else if (status === "active" && existingAgent[0].status !== "active") {
      const nextExecution = new Date();
      nextExecution.setMinutes(nextExecution.getMinutes() + 5);
      updateData.nextExecutionAt = nextExecution;

      // Re-queue recurring job
      await agentQueue.add(
        `agent-${id}-recurring`,
        { agentId: id, userId, isInitialRun: false },
        {
          jobId: `${id}-recurring`,
          repeat: { pattern: "0 0 * * *" },
        }
      );
      console.log(`[API] Re-scheduled recurring job for activated agent ${id}`);
    }

    const [updatedAgent] = await db
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning();

    // Update keywords if provided
    if (keywords || excludedKeywords) {
      await db.delete(agentKeywords).where(eq(agentKeywords.agentId, id));
      await db.insert(agentKeywords).values({
        agentId: id,
        keyword: JSON.stringify(keywords || []),
        excludedKeywords: JSON.stringify(excludedKeywords || []),
      });
    }

    // Update platform configs if provided
    if (platforms && platformConfigs) {
      await db
        .delete(agentPlatformConfigs)
        .where(eq(agentPlatformConfigs.agentId, id));

      const platformConfigInserts = platforms.map((platform: string) => ({
        agentId: id,
        platform: platform as any,
        config: platformConfigs[platform] || {},
        isEnabled: true,
      }));

      console.log(platformConfigInserts)

      if (platformConfigInserts.length > 0) {
        await db.insert(agentPlatformConfigs).values(platformConfigInserts);
      }
    }

    return NextResponse.json({
      success: true,
      agent: updatedAgent,
      message: "Agent updated successfully",
    });
  } catch (error) {
    console.error("[API] Error updating agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}


// DELETE - Delete agent and cancel jobs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Agent ID and User ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);

    if (!existingAgent.length || existingAgent[0].userId !== userId) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Remove all jobs for this agent
    const recurringJobId = `${id}-recurring`;
    try {
      const job = await agentQueue.getJob(recurringJobId);
      if (job) {
        await job.remove();
        console.log(`[API] Removed job for deleted agent ${id}`);
      }

      // Remove any pending jobs
      const jobs = await agentQueue.getJobs(['waiting', 'delayed']);
      for (const job of jobs) {
        if (job.data.agentId === id) {
          await job.remove();
          console.log(`[API] Removed pending job ${job.id}`);
        }
      }
    } catch (error) {
      console.error(`[API] Error removing jobs for agent ${id}:`, error);
    }

    // Delete agent (cascade will handle related records)
    await db.delete(agents).where(eq(agents.id, id));

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("[API] Error deleting agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}