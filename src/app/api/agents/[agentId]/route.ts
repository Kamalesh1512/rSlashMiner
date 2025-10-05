// app/api/agents/[agentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  agents,
  monitoringResults,
  agentKeywords,
  agentPlatformConfigs,
} from "@/lib/db/schema";
import { eq, and, desc, count, avg, gte, sql } from "drizzle-orm";

interface AgentProps {
  params: Promise<{
    agentId: string;
  }>;
}

export async function GET(request: Request, { params }: AgentProps) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await params;

    // Fetch agent
    const agentRows = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, session.user.id)))
      .limit(1);

    if (!agentRows.length) {
      return NextResponse.json(
        { message: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    const agentData = agentRows[0];

    // Keywords
    const keywordsRows = await db
      .select()
      .from(agentKeywords)
      .where(eq(agentKeywords.agentId, agentId));
    const keywords: string[] = [];
    const excludedKeywords: string[] = [];
    keywordsRows.forEach((k) => {
      try {
        const parsedKeywords = JSON.parse(k.keyword) as string[];
        keywords.push(...parsedKeywords);
      } catch {
        keywords.push(k.keyword); // fallback if plain string
      }

      if (k.excludedKeywords) {
        try {
          const parsedExcluded = JSON.parse(k.excludedKeywords) as string[];
          excludedKeywords.push(...parsedExcluded);
        } catch {
          excludedKeywords.push(k.excludedKeywords);
        }
      }
    });

    // Platform configs
    const platformRows = await db
      .select()
      .from(agentPlatformConfigs)
      .where(eq(agentPlatformConfigs.agentId, agentId));
    const platformConfigs = platformRows.reduce((acc, cfg) => {
      acc[cfg.platform] = { config: cfg.config, isEnabled: cfg.isEnabled };
      return acc;
    }, {} as Record<string, { config: any; isEnabled: boolean }>);

    // Recent results (last 10)
    const recentResultsRows = await db
      .select()
      .from(monitoringResults)
      .where(
        and(
          eq(monitoringResults.agentId, agentId),
          eq(monitoringResults.userId, session.user.id)
        )
      )
      .orderBy(desc(monitoringResults.discoveredAt))
      .limit(10);

    const recentResults = recentResultsRows.map((r) => ({
      ...r,
      sentimentScore:
        typeof r.sentimentScore === "number" ? r.sentimentScore : null,
      type: r.platformCommentId ? "comment" : "post",
      postCreatedAt: r.postCreatedAt
        ? new Date(r.postCreatedAt).toISOString()
        : null,
      discoveredAt: r.discoveredAt
        ? new Date(r.discoveredAt).toISOString()
        : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
    }));

    // Performance stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const perfStats = await db
      .select({
        totalLeads: sql<number>`COUNT(*)`.as("totalLeads"),
        avgRelevanceScore:
          sql<number>`AVG(${monitoringResults.relevanceScore})`.as(
            "avgRelevanceScore"
          ),
        highQualityLeads:
          sql<number>`COUNT(CASE WHEN ${monitoringResults.relevanceScore} >= 80 THEN 1 END)`.as(
            "highQualityLeads"
          ),
        qualifiedLeads:
          sql<number>`COUNT(CASE WHEN ${monitoringResults.isQualifiedLead} = true THEN 1 END)`.as(
            "qualifiedLeads"
          ),
        last30Days:
          sql<number>`COUNT(CASE WHEN ${monitoringResults.discoveredAt} >= ${thirtyDaysAgo} THEN 1 END)`.as(
            "last30Days"
          ),
        recentAverageRelevance:
          sql<number>`AVG(CASE WHEN ${monitoringResults.discoveredAt} >= ${thirtyDaysAgo} THEN ${monitoringResults.relevanceScore} END)`.as(
            "recentAverageRelevance"
          ),
        last24Hours:
          sql<number>`COUNT(CASE WHEN ${monitoringResults.discoveredAt} >= ${last24Hours} THEN 1 END)`.as(
            "last24Hours"
          ),
        last7Days:
          sql<number>`COUNT(CASE WHEN ${monitoringResults.discoveredAt} >= ${last7Days} THEN 1 END)`.as(
            "last7Days"
          ),
      })
      .from(monitoringResults)
      .where(
        and(
          eq(monitoringResults.agentId, agentId),
          eq(monitoringResults.userId, session.user.id)
        )
      );

    const stats = perfStats[0];
    const performance = {
      totalLeads: stats.totalLeads || 0,
      averageRelevanceScore: Math.round(Number(stats.avgRelevanceScore || 0)),
      highQualityLeads: stats.highQualityLeads || 0,
      qualifiedLeads: stats.qualifiedLeads || 0,
      last24Hours: stats.last24Hours || 0,
      last7Days: stats.last7Days || 0,
      last30Days: stats.last30Days || 0,
      recentAverageRelevance: Math.round(
        Number(stats.recentAverageRelevance || 0)
      ),
    };

    const responseAgent = {
      id: agentData.id,
      name: agentData.name,
      description: agentData.description,
      status: agentData.status,
      platforms: agentData.platforms,
      notificationsEnabled: agentData.notificationsEnabled,
      notificationFrequency: agentData.notificationFrequency,
      notificationChannels: agentData.notificationChannels,
      lastExecutedAt: agentData.lastExecutedAt
        ? new Date(agentData.lastExecutedAt).toISOString()
        : null,
      nextExecutionAt: agentData.nextExecutionAt
        ? new Date(agentData.nextExecutionAt).toISOString()
        : null,
      executionCount: agentData.executionCount,
      totalLeadsGenerated: agentData.totalLeadsGenerated,
      averageRelevanceScore: agentData.averageRelevanceScore,
      color: agentData.color,
      createdAt: agentData.createdAt.toISOString(),
      updatedAt: agentData.updatedAt.toISOString(),
      keywords,
      excludedKeywords,
      platformConfigs,
      recentResults,
      performance: performance,
    };

    return NextResponse.json({ success: true, agent: responseAgent });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// Optional: Add PATCH method to update agent basic information
export async function PATCH(request: Request, { params }: AgentProps) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await params;
    const body = await request.json();

    // Validate agent ownership first
    const existingAgent = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, session.user.id)))
      .limit(1);

    if (!existingAgent.length) {
      return NextResponse.json(
        { message: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Prepare update data - only allow certain fields to be updated
    const allowedUpdates = {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.platforms && { platforms: body.platforms }),
      ...(body.notificationsEnabled !== undefined && {
        notificationsEnabled: body.notificationsEnabled,
      }),
      ...(body.notificationFrequency && {
        notificationFrequency: body.notificationFrequency,
      }),
      ...(body.notificationChannels && {
        notificationChannels: body.notificationChannels,
      }),
      ...(body.color && { color: body.color }),
      updatedAt: new Date(),
    };

    if (Object.keys(allowedUpdates).length === 1) {
      // Only updatedAt
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Update the agent
    const updatedAgent = await db
      .update(agents)
      .set(allowedUpdates)
      .where(and(eq(agents.id, agentId), eq(agents.userId, session.user.id)))
      .returning();

    if (!updatedAgent.length) {
      return NextResponse.json(
        { message: "Failed to update agent" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent updated successfully",
      agent: {
        ...updatedAgent[0],
        isActive: updatedAgent[0].status === "active",
      },
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
