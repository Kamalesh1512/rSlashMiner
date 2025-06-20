import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  agents,
  keywords,
  monitoringResults,
  subreddits,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { createId } from "@paralleldrive/cuid2";
import {
  canCreateAgent,
  incrementAgentCount,
} from "@/lib/payments/check-subscriptions/subscriptions";
import { desc, eq, inArray } from "drizzle-orm";
import { Agent } from "@/lib/constants/types";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      userId,
      name,
      description,
      configuration,
      keywords: keywordList,
    } = await request.json();

    // Verify the user ID matches the session user
    if (userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user can create a new agent
    const canCreate  = await canCreateAgent(userId)

    if (!canCreate) {
      return NextResponse.json(
        { message: "You have reached your agent creation limit for today" },
        { status: 403 }
      );
    }

    // Create the agent
    const agentId = createId();
    await db.insert(agents).values({
      id: agentId,
      name,
      description,
      userId,
      configuration,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });

    // Add keywords
    for (const keyword of keywordList) {
      await db.insert(keywords).values({
        id: createId(),
        agentId,
        keyword,
        createdAt: new Date(),
      });
    }

    // Increment the user's agent creation count
    await incrementAgentCount(userId);

    return NextResponse.json(
      { message: "Agent created successfully", agentId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the agent" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch agents
    const agentRows = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, session.user.id))
      .orderBy(desc(agents.createdAt));

    const agentIds = agentRows.map((a) => a.id);

    if (agentIds.length === 0) {
      return NextResponse.json({ agents: [] }, { status: 200 });
    }

    // 2. Fetch keywords for those agents
    const keywordRows = await db
      .select()
      .from(keywords)
      .where(inArray(keywords.agentId, agentIds));

    // 3. Fetch subreddits for those agents
    const subredditRows = await db
      .select()
      .from(subreddits)
      .where(inArray(subreddits.agentId, agentIds));

    const recentResults = await db
      .select()
      .from(monitoringResults)
      .where(inArray(monitoringResults.agentId, agentIds));
    // 4. Merge into Agent[] structure
    const agentsWithNested: Agent[] = agentRows.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description as string,
      isActive: agent.isActive,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      lastRunAt: agent.lastRunAt,
      runCount: agent.runCount,
      configuration: JSON.parse(agent.configuration),
      keywords: keywordRows
        .filter((k) => k.agentId === agent.id)
        .map((k) => ({ id: k.id, keyword: k.keyword })),
      subreddits: subredditRows
        .filter((s) => s.agentId === agent.id)
        .map((s) => ({ id: s.id, subredditName: s.subredditName })),
      results: recentResults
        .filter((res) => res.agentId === agent.id)
        .map((res) => ({
          id: res.id,
          agentId: res.agentId,
          author: res.author,
          content: res.content,
          createdAt: res.createdAt,
          numComments: res.numComments as string,
          redditCommentId: res.redditCommentId as string,
          redditPostId: res.redditPostId as string,
          subreddit: res.subreddit as string,
          relevanceScore: res.relevanceScore as number,
          score: res.score as number,
          sentimentScore: res.sentimentScore as number,
          url: res.url as string,
          matchedKeywords: res.matchedKeywords as string,
        })),
    }));

    return NextResponse.json({ agents: agentsWithNested }, { status: 200 });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching agents" },
      { status: 500 }
    );
  }
}
