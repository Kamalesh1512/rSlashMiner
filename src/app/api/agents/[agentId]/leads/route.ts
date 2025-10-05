// app/api/agents/[agentId]/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, monitoringResults } from "@/lib/db/schema";
import { eq, and, desc, asc, gte, lt, gt, lte, count, avg, sql, sum } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface AgentProps {
  params: Promise<{
    agentId: string;
  }>;
}

export async function GET(request: Request, { params }: AgentProps) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {agentId}  = await params;
    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering and pagination
    const platform = searchParams.get('platform');
    const relevanceFilter = searchParams.get('relevance');
    const sentimentFilter = searchParams.get('sentiment');
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // First, verify the agent exists and belongs to the user
    const agent = await db
      .select()
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

    // Build the base conditions
    const baseConditions = [
      eq(monitoringResults.agentId, agentId),
      eq(monitoringResults.userId, session.user.id)
    ];

    // Build additional conditions array
    const additionalConditions = [];

    // Apply platform filter
    if (platform && platform !== 'all') {
      additionalConditions.push(eq(monitoringResults.platform, platform as any));
    }

    // Apply relevance filter
    if (relevanceFilter && relevanceFilter !== 'all') {
      switch (relevanceFilter) {
        case 'high_relevance':
          additionalConditions.push(gte(monitoringResults.relevanceScore, 80));
          break;
        case 'medium_relevance':
          additionalConditions.push(gte(monitoringResults.relevanceScore, 50));
          additionalConditions.push(lt(monitoringResults.relevanceScore, 80));
          break;
        case 'low_relevance':
          additionalConditions.push(lt(monitoringResults.relevanceScore, 50));
          break;
      }
    }

    // Apply sentiment filter
    if (sentimentFilter && sentimentFilter !== 'all') {
      switch (sentimentFilter) {
        case 'positive':
          additionalConditions.push(gt(monitoringResults.sentimentScore, 20));
          break;
        case 'negative':
          additionalConditions.push(lt(monitoringResults.sentimentScore, -20));
          break;
        case 'neutral':
          additionalConditions.push(gte(monitoringResults.sentimentScore, -20));
          additionalConditions.push(lte(monitoringResults.sentimentScore, 20));
          break;
      }
    }

    // Combine all conditions
    const allConditions = [...baseConditions, ...additionalConditions];

    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(monitoringResults.discoveredAt);
        break;
      case 'relevance':
        orderBy = desc(monitoringResults.relevanceScore);
        break;
      case 'engagement':
        // Sort by score + comments as engagement metric using coalesce
        orderBy = desc(
          sql`(COALESCE(${monitoringResults.score}, 0) + COALESCE(${monitoringResults.numComments}, 0))`
        );
        break;
      case 'newest':
      default:
        orderBy = desc(monitoringResults.discoveredAt);
        break;
    }

    // Fetch leads with all conditions
    const leads = await db
      .select({
        id: monitoringResults.id,
        agentId: monitoringResults.agentId,
        platform: monitoringResults.platform,
        platformPostId: monitoringResults.platformPostId,
        platformCommentId: monitoringResults.platformCommentId,
        title: monitoringResults.title,
        content: monitoringResults.content,
        author: monitoringResults.author,
        authorHandle: monitoringResults.authorHandle,
        community: monitoringResults.community,
        url: monitoringResults.url,
        score: monitoringResults.score,
        numComments: monitoringResults.numComments,
        shares: monitoringResults.shares,
        reactions: monitoringResults.reactions,
        matchedKeywords: monitoringResults.matchedKeywords,
        relevanceScore: monitoringResults.relevanceScore,
        sentimentScore: monitoringResults.sentimentScore,
        isQualifiedLead: monitoringResults.isQualifiedLead,
        leadScore: monitoringResults.leadScore,
        buyingIntent: monitoringResults.buyingIntent,
        createdAt: monitoringResults.createdAt,
        discoveredAt: monitoringResults.discoveredAt,
        postCreatedAt: monitoringResults.postCreatedAt,
        type: sql<string>`CASE 
          WHEN ${monitoringResults.platformCommentId} IS NOT NULL THEN 'comment'
          ELSE 'post'
        END`.as('type'),
      })
      .from(monitoringResults)
      .where(and(...allConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(monitoringResults)
      .where(and(...allConditions));
    
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate stats for the current filter - using simpler approach
    const allLeadsForStats = await db
      .select({
        relevanceScore: monitoringResults.relevanceScore,
        isQualifiedLead: monitoringResults.isQualifiedLead,
      })
      .from(monitoringResults)
      .where(and(...allConditions));

    // Calculate stats manually
    const statsCalculation = allLeadsForStats.reduce((acc, lead) => {
      acc.totalLeads += 1;
      if (lead.relevanceScore >= 80) {
        acc.highRelevance += 1;
      }
      acc.totalRelevanceSum += lead.relevanceScore;
      if (lead.isQualifiedLead) {
        acc.qualifiedLeads += 1;
      }
      return acc;
    }, {
      totalLeads: 0,
      highRelevance: 0,
      totalRelevanceSum: 0,
      qualifiedLeads: 0
    });

    const avgRelevance = statsCalculation.totalLeads > 0 
      ? Math.round(statsCalculation.totalRelevanceSum / statsCalculation.totalLeads)
      : 0;

    return NextResponse.json({
      success: true,
      leads: leads.map(lead => ({
        ...lead,
        // Normalize sentiment score to match frontend expectations (-1 to 1 scale)
        sentimentScore: lead.sentimentScore ? lead.sentimentScore / 100 : null,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalLeads: statsCalculation.totalLeads,
        highRelevanceLeads: statsCalculation.highRelevance,
        averageRelevance: avgRelevance,
        qualifiedLeads: statsCalculation.qualifiedLeads,
      },
      agent: {
        id: agent[0].id,
        name: agent[0].name,
        status: agent[0].status,
        isActive: agent[0].status === 'active',
      }
    });

  } catch (error) {
    console.error("Error fetching agent leads:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}