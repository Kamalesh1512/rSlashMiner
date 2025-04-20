export const dynamic = "force-dynamic";


import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agents, keywords, subreddits, monitoringResults } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { graph, runAgent } from "@/lib/agents/redditAgent"

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

    if (!agent || agent.length === 0) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 })
    }

    if (agent[0].userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if agent is active
    if (!agent[0].isActive) {
      return NextResponse.json({ message: "Agent is paused" }, { status: 400 })
    }

    // Get keywords and subreddits for this agent
    const keywordsResult = await db
      .select({ name: keywords.keyword })
      .from(keywords)
      .where(eq(keywords.agentId, agentId))
    const subredditResult = await db
      .select({ name: subreddits.subredditName })
      .from(subreddits)
      .where(eq(subreddits.agentId, agentId))

    const subredditList = subredditResult.map((sub) => sub.name)
    const keywordList = keywordsResult.map((key) => key.name)

    if (subredditList.length === 0 || keywordList.length === 0) {
      return NextResponse.json(
        {
          message: "Agent configuration incomplete",
          error: "Agent must have at least one subreddit and one keyword",
        },
        { status: 400 },
      )
    }

    // Process each subreddit
    const results = []
    const storedResultIds = []

    const relevanceThreshold = JSON.parse(
      agent[0].configuration
    ).relevanceThreshold;


    // For each subreddit, run the agent with each keyword
    for (const subreddit of subredditList) {
      // We'll use the first keyword as the main query, but include all keywords for analysis
      const query = keywordList[0]

      try {
        const result = await runAgent({
          agentId,
          subreddit,
          query,
          relevanceThreshold,
          businessInterests: keywordList,
          businessDescription: agent[0].description as string,
          onProgress: (message) => {
            // In the non-streaming version, we just log progress
            console.log(`Progress for ${subreddit}: ${message}`)
          },
        })

        if (result.storedResult && result.storedResult.success) {
          results.push({
            subreddit,
            resultId: result.storedResult.resultId,
            success: true,
          })
          storedResultIds.push(result.storedResult.resultId)
        }
      } catch (error) {
        console.error(`Error processing subreddit ${subreddit}:`, error)
        results.push({
          subreddit,
          success: false,
          error: String(error),
        })
      }
    }

    // Update the agent's last run time and run count
    await db
      .update(agents)
      .set({
        lastRunAt: new Date(),
        runCount: agent[0].runCount + 1,
      })
      .where(eq(agents.id, agentId))

    // Generate a summary of the results
    let summary = ""
    if (storedResultIds.length > 0) {
      // Get the stored results from the database
      const storedResults = await db
        .select()
        .from(monitoringResults)
        .where(eq(monitoringResults.agentId, agentId))
        .orderBy(monitoringResults.createdAt)
        .limit(10)

      summary = `Found ${storedResultIds.length} relevant results across ${subredditList.length} subreddits.`

      if (storedResults.length > 0) {
        summary += ` Most recent results include content from r/${storedResults[0].subreddit} with ${storedResults[0].relevanceScore}% relevance.`
      }
    } else {
      summary = `No relevant results found across ${subredditList.length} subreddits.`
    }

    return NextResponse.json(
      {
        message: "Agent run successfully",
        summary,
        results,
        totalResults: storedResultIds.length,
        processedSubreddits: subredditList.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error running agent:", error)
    return NextResponse.json({ message: "An error occurred while running the agent" }, { status: 500 })
  }
}
 