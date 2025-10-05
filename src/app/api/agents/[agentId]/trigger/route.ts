// app/api/agents/[id]/trigger/route.ts
// Manual trigger endpoint for testing/admin use
import { NextRequest, NextResponse } from "next/server";
import { agentQueue } from "@/lib/queue/config";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface AgentProps {
  params: Promise<{
    agentId: string;
  }>;
}

export async function POST(request: Request, { params }: AgentProps) {
  try {
    const { agentId } = await params;
    const session = await auth();

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    const userId = session.user.id;

    // Verify agent exists and belongs to user
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent.length || agent[0].userId !== userId) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Queue immediate job
    const job = await agentQueue.add(
      `agent-${agentId}-manual`,
      {
        agentId,
        userId,
        isInitialRun: false,
      },
      {
        jobId: `${agentId}-manual-${Date.now()}`,
        priority: 1, // High priority
      }
    );

    console.log("Job Created and Queued",job.id,job.isActive)


    return NextResponse.json({
      success: true,
      message: "Agent execution triggered",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error triggering agent:", error);
    return NextResponse.json(
      { error: "Failed to trigger agent" },
      { status: 500 }
    );
  }
}
