import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agents, keywords, subreddits } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { createId } from "@paralleldrive/cuid2"
import { checkAgentCreationLimit, incrementAgentCreationCount } from "@/lib/check-subscriptions/subscriptions"
import { desc, eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const {
      userId,
      name,
      description,
      configuration,
      subreddits: subredditList,
      keywords: keywordList,
    } = await request.json()

    // Verify the user ID matches the session user
    if (userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user can create a new agent
    const { canCreate } = await checkAgentCreationLimit(userId)

    if (!canCreate) {
      return NextResponse.json({ message: "You have reached your agent creation limit for today" }, { status: 403 })
    }

    // Create the agent
    const agentId = createId()
    await db.insert(agents).values({
      id: agentId,
      name,
      description,
      userId,
      configuration,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    })

    // Add keywords
    for (const keyword of keywordList) {
      await db.insert(keywords).values({
        id: createId(),
        agentId,
        keyword,
        createdAt: new Date(),
      })
    }

    // Add subreddits
    for (const subredditName of subredditList) {
      await db.insert(subreddits).values({
        id: createId(),
        agentId,
        subredditName,
        createdAt: new Date(),
      })
    }

    // Increment the user's agent creation count
    await incrementAgentCreationCount(userId)

    return NextResponse.json({ message: "Agent created successfully", agentId }, { status: 201 })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json({ message: "An error occurred while creating the agent" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get all agents for the user
    const userAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, session.user.id))
    .orderBy(desc(agents.createdAt))
    .leftJoin(keywords, eq(keywords.agentId, agents.id))
    .leftJoin(subreddits, eq(subreddits.agentId, agents.id))

    return NextResponse.json({ agents: userAgents }, { status: 200 })
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json({ message: "An error occurred while fetching agents" }, { status: 500 })
  }
}

