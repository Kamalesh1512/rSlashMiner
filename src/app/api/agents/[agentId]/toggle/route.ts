// app/api/agents/[agentId]/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface AgentProps {
  params: Promise<{
    agentId: string;
  }>;
}

export async function PATCH(request: Request, { params }: AgentProps  
) {


  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { agentId } = await params;
    
    // Parse the request body
    const body = await request.json();
    const { isActive } = body;

    // Validate the input
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { message: "isActive must be a boolean value" },
        { status: 400 }
      );
    }

    // First, check if the agent exists and belongs to the user
    const existingAgent = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        userId: agents.userId,
      })
      .from(agents)
      .where(
        and(
          eq(agents.id, agentId),
          eq(agents.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingAgent.length) {
      return NextResponse.json(
        { message: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    const agent = existingAgent[0];
    const newStatus = isActive ? 'active' : 'paused';

    // Don't update if status is already the same
    if (
      (agent.status === 'active' && isActive) ||
      (agent.status === 'paused' && !isActive)
    ) {
      return NextResponse.json({
        success: true,
        message: `Agent is already ${newStatus}`,
        agent: {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          isActive: agent.status === 'active',
        }
      });
    }

    // Calculate next execution time if activating the agent
    let nextExecutionAt = null;
    if (isActive) {
      // Set next execution to current time + 1 hour (you can adjust this logic)
      nextExecutionAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    }

    // Update the agent status
    const updatedAgent = await db
      .update(agents)
      .set({
        status: newStatus,
        nextExecutionAt: nextExecutionAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agents.id, agentId),
          eq(agents.userId, session.user.id)
        )
      )
      .returning({
        id: agents.id,
        name: agents.name,
        description: agents.description,
        status: agents.status,
        isAutoRun: agents.isAutoRun,
        platforms: agents.platforms,
        notificationsEnabled: agents.notificationsEnabled,
        notificationFrequency: agents.notificationFrequency,
        notificationChannels: agents.notificationChannels,
        lastExecutedAt: agents.lastExecutedAt,
        nextExecutionAt: agents.nextExecutionAt,
        executionCount: agents.executionCount,
        totalLeadsGenerated: agents.totalLeadsGenerated,
        averageRelevanceScore: agents.averageRelevanceScore,
        color: agents.color,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      });

    if (!updatedAgent.length) {
      return NextResponse.json(
        { message: "Failed to update agent status" },
        { status: 500 }
      );
    }

    const updated = updatedAgent[0];

    // Log the status change for audit purposes
    console.log(`Agent ${agentId} status changed to ${newStatus} by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: `Agent ${isActive ? 'activated' : 'paused'} successfully`,
      agent: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        isActive: updated.status === 'active',
        isAutoRun: updated.isAutoRun,
        platforms: updated.platforms,
        notificationsEnabled: updated.notificationsEnabled,
        notificationFrequency: updated.notificationFrequency,
        notificationChannels: updated.notificationChannels,
        lastExecutedAt: updated.lastExecutedAt,
        nextExecutionAt: updated.nextExecutionAt,
        executionCount: updated.executionCount,
        totalLeadsGenerated: updated.totalLeadsGenerated,
        averageRelevanceScore: updated.averageRelevanceScore,
        color: updated.color,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      }
    });

  } catch (error) {
    console.error("Error toggling agent status:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to fetch current agent status
export async function GET(request: Request, { params }: AgentProps
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { agentId } = await params;

    const agent = await db
      .select({
        id: agents.id,
        name: agents.name,
        description: agents.description,
        status: agents.status,
        isAutoRun: agents.isAutoRun,
        platforms: agents.platforms,
        lastExecutedAt: agents.lastExecutedAt,
        nextExecutionAt: agents.nextExecutionAt,
        executionCount: agents.executionCount,
        totalLeadsGenerated: agents.totalLeadsGenerated,
        averageRelevanceScore: agents.averageRelevanceScore,
        color: agents.color,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      })
      .from(agents)
      .where(
        and(
          eq(agents.id, agentId),
          eq(agents.userId, session.user.id)
        )
      )
      .limit(1);

    if (!agent.length) {
      return NextResponse.json(
        { message: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    const agentData = agent[0];

    return NextResponse.json({
      success: true,
      agent: {
        ...agentData,
        isActive: agentData.status === 'active',
      }
    });

  } catch (error) {
    console.error("Error fetching agent status:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}