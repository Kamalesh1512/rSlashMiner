import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { auth, } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { graph } from "@/lib/agents/redditAgent"


export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ message: "Agent ID is required" }, { status: 400 })
    }

    // Verify the agent belongs to the user
    const agent = await db.select().from(agents).where(eq(agents.id, agentId))

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 })
    }

    if (agent[0].userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if agent is active
    if (!agent[0].isActive) {
      return NextResponse.json({ message: "Agent is paused" }, { status: 400 })
    }

    // Run the agent
    const result = await graph.invoke({
        subreddit: "startups",
        query: "problem",
        businessInterests: ["B2B", "SaaS", "product-market fit", "customer pain"],
        businessDescription:agent[0].description as string,
        agentId:agent[0].id
      });

    if (!result) {
      return NextResponse.json({ message: "Failed to run agent", error: result }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Agent run successfully",
        summary: result.storedResult,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error running agent:", error)
    return NextResponse.json({ message: "An error occurred while running the agent" }, { status: 500 })
  }
}

