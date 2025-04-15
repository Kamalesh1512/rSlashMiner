import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  agents,
  keywords,
  subreddits,
  monitoringResults,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { runAgent } from "@/lib/agents/redditAgent";

// Helper function to create a readable stream
function createStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  function sendEvent(event: any) {
    if (controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    }
  }

  function close() {
    if (controller) {
      controller.close();
    }
  }

  return { stream, sendEvent, close };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json(
      { message: "Agent ID is required" },
      { status: 400 }
    );
  }

  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Create a stream for sending real-time updates
  const { stream, sendEvent, close } = createStream();

  // Set up the response with appropriate headers for SSE
  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  // Process in the background
  processAgentRun(agentId, session.user.id, sendEvent, close).catch((error) => {
    console.error("Error in agent run:", error);
    sendEvent({
      type: "error",
      error: error.message || "An unexpected error occurred",
    });
    close();
  });

  return response;
}

async function processAgentRun(
  agentId: string,
  userId: string,
  sendEvent: (event: any) => void,
  close: () => void
) {
  try {
    // Verify the agent belongs to the user
    const agent = await db.select().from(agents).where(eq(agents.id, agentId));

    if (!agent || agent.length === 0) {
      sendEvent({
        type: "error",
        error: "Agent not found",
      });
      close();
      return;
    }

    if (agent[0].userId !== userId) {
      sendEvent({
        type: "error",
        error: "Unauthorized",
      });
      close();
      return;
    }

    // Check if agent is active
    if (!agent[0].isActive) {
      sendEvent({
        type: "error",
        error: "Agent is paused",
      });
      close();
      return;
    }

    // Get keywords and subreddits for this agent
    const keywordsResult = await db
      .select({ name: keywords.keyword })
      .from(keywords)
      .where(eq(keywords.agentId, agentId));

    const subredditResult = await db
      .select({ name: subreddits.subredditName })
      .from(subreddits)
      .where(eq(subreddits.agentId, agentId));

    const subredditList = subredditResult.map((sub) => sub.name);
    const keywordList = keywordsResult.map((key) => key.name);

    if (subredditList.length === 0 || keywordList.length === 0) {
      sendEvent({
        type: "error",
        error:
          "Agent configuration incomplete. Agent must have at least one subreddit and one keyword.",
      });
      close();
      return;
    }

    // Send initial step
    sendEvent({
      type: "step",
      id: "init",
      status: "completed",
      message: "Agent initialized successfully",
      progress: 5,
    });

    // Send step for loading configuration
    sendEvent({
      type: "step",
      id: "config",
      status: "running",
      message: "Loading agent configuration",
      details: `Found ${subredditList.length} subreddits and ${keywordList.length} keywords`,
      progress: 10,
    });

    // Short delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update configuration step to completed
    sendEvent({
      type: "step",
      id: "config",
      status: "completed",
      message: "Agent configuration loaded",
      details: `Ready to monitor ${subredditList.length} subreddits with ${keywordList.length} keywords`,
      progress: 15,
    });

    // Process each subreddit
    const results = [];
    const storedResultIds = [];
    const totalSubreddits = subredditList.length;

    for (let i = 0; i < subredditList.length; i++) {
      const subreddit = subredditList[i];
      const stepId = `subreddit-${i}`;
      const progressBase = 15 + i * (70 / totalSubreddits);
      const progressEnd = 15 + (i + 1) * (70 / totalSubreddits);

      // Send step for processing this subreddit
      sendEvent({
        type: "step",
        id: stepId,
        status: "running",
        message: `Processing subreddit r/${subreddit}`,
        details: `Searching for content matching ${keywordList.length} keywords`,
        progress: progressBase,
      });

      try {
        // We'll use the first keyword as the main query, but include all keywords for analysis
        const query = keywordList[0];

        const relevanceThreshold = JSON.parse(agent[0].configuration).relevanceThreshold

        // Run the agent with progress reporting
        const result = await runAgent({
          agentId,
          subreddit,
          query,
          relevanceThreshold,
          businessInterests: keywordList,
          businessDescription: agent[0].description as string,
          onProgress: (message: string) => {
            const skipMessages = [
              "No relevant posts found in this subreddit",
              "No post selected for comment analysis",
              "No content available for analysis",
              "Could not parse analysis results",
              "Content is not relevant enough",
            ]
            const isSkipped = skipMessages.some(skipPhrase => message.includes(skipPhrase))
            sendEvent({
              type: "step",
              id: `${stepId}-progress`,
              status: isSkipped ? "skipped" : "complete", // ✅ Mark as completed if skipped
              message: `Processing r/${subreddit}`,
              details: message,
              progress: progressBase + (progressEnd - progressBase) * 0.5,
            });
          },
        });

        // Complete this subreddit step
        if (result.storedResult && result.storedResult.success) {
          results.push({
            subreddit,
            resultId: result.storedResult.resultId,
            success: true,
          });
          storedResultIds.push(result.storedResult.resultId);

          sendEvent({
            type: "step",
            id: stepId,
            status: "completed",
            message: `Completed processing r/${subreddit}`,
            details: `🙂Found relevant content with ${
              result.analysis?.relevanceScore || 0
            }% relevance`,
            progress: progressEnd,
          });
        } else {
          sendEvent({
            type: "step",
            id: stepId,
            status: "completed",
            message: `Completed processing r/${subreddit}`,
            details: "☹️No relevant content found",
            progress: progressEnd,
          });
        }
      } catch (error) {
        console.error(`Error processing subreddit ${subreddit}:`, error);

        // Mark this subreddit step as error
        sendEvent({
          type: "step",
          id: stepId,
          status: "error",
          message: `Error processing r/${subreddit}`,
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
          progress: progressEnd,
        });

        results.push({
          subreddit,
          success: false,
          error: String(error),
        });
      }
    }

    // Send step for updating agent stats
    sendEvent({
      type: "step",
      id: "update-stats",
      status: "running",
      message: "Updating agent statistics",
      progress: 90,
    });

    // Update the agent's last run time and run count
    await db
      .update(agents)
      .set({
        lastRunAt: new Date(),
        runCount: agent[0].runCount + 1,
      })
      .where(eq(agents.id, agentId));

    // Update stats step to completed
    sendEvent({
      type: "step",
      id: "update-stats",
      status: "completed",
      message: "Agent statistics updated",
      progress: 95,
    });

    // Generate a summary of the results
    let summary = "";
    let recentResults:any = []
    if (storedResultIds.length > 0) {
      // Get the stored results from the database
      recentResults = await db
        .select()
        .from(monitoringResults)
        .where(eq(monitoringResults.agentId, agentId))
        .orderBy(monitoringResults.createdAt)
        .limit(10)

      summary = `Found ${storedResultIds.length} relevant results across ${subredditList.length} subreddits.`;

      if (recentResults.length > 0) {
        summary += ` Most recent results include content from r/${recentResults[0].subreddit} with ${recentResults[0].relevanceScore}% relevance.`;
      }
    } else {
      summary = `No relevant results found across ${subredditList.length} subreddits.`;
    }

    // Send final completion event
    sendEvent({
      type: "complete",
      success: true,
      summary,
      resultsCount: storedResultIds.length,
      processedSubreddits: subredditList.length,
      progress: 100,
      recentResults:recentResults
    });

    // Close the stream
    close();
  } catch (error) {
    console.error("Error in agent run:", error);

    // Send error event
    sendEvent({
      type: "error",
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });

    // Close the stream
    close();
  }
}
