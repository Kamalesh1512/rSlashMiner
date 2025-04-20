'use server';

import { db } from '@/lib/db';
import { agents, keywords, subreddits, monitoringResults } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { runAgent } from '@/lib/agents/redditAgent';
import { sendRunNotification } from '@/lib/notifications';

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

export async function agentStreamRun(agentId: string): Promise<Response> {
  if (!agentId) {
    return new Response(JSON.stringify({ message: 'Agent ID is required' }), {
      status: 400,
    });
  }

  const session = await auth();
  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  const { stream, sendEvent, close } = createStream();

  processAgentRun(agentId, session.user.id, sendEvent, close).catch((error) => {
    console.error('Error in agent run:', error);
    sendEvent({
      type: 'error',
      error: error.message || 'An unexpected error occurred',
    });
    close();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

async function processAgentRun(
  agentId: string,
  userId: string,
  sendEvent: (event: any) => void,
  close: () => void
) {
  try {
    const agent = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!agent?.[0]) {
      sendEvent({ type: 'error', error: 'Agent not found' });
      close();
      return;
    }

    if (agent[0].userId !== userId) {
      sendEvent({ type: 'error', error: 'Unauthorized' });
      close();
      return;
    }

    if (!agent[0].isActive) {
      sendEvent({ type: 'error', error: 'Agent is paused' });
      close();
      return;
    }

    const keywordsResult = await db
      .select({ name: keywords.keyword })
      .from(keywords)
      .where(eq(keywords.agentId, agentId));

    const subredditResult = await db
      .select({ name: subreddits.subredditName })
      .from(subreddits)
      .where(eq(subreddits.agentId, agentId));

    const subredditList = subredditResult.map((s) => s.name);
    const keywordList = keywordsResult.map((k) => k.name);

    if (subredditList.length === 0 || keywordList.length === 0) {
      sendEvent({
        type: 'error',
        error: 'Agent configuration incomplete. Requires at least one subreddit and keyword.',
      });
      close();
      return;
    }

    sendEvent({
      type: 'step',
      id: 'init',
      status: 'completed',
      message: 'Agent initialized successfully',
      progress: 5,
    });

    sendEvent({
      type: 'step',
      id: 'config',
      status: 'running',
      message: 'Loading agent configuration',
      details: `Found ${subredditList.length} subreddits and ${keywordList.length} keywords`,
      progress: 10,
    });

    await new Promise((res) => setTimeout(res, 500));

    sendEvent({
      type: 'step',
      id: 'config',
      status: 'completed',
      message: 'Agent configuration loaded',
      details: `Ready to monitor ${subredditList.length} subreddits with ${keywordList.length} keywords`,
      progress: 15,
    });

    const results = [];
    const storedResultIds = [];
    const totalSubreddits = subredditList.length;

    for (let i = 0; i < subredditList.length; i++) {
      const subreddit = subredditList[i];
      const stepId = `subreddit-${i}`;
      const progressBase = 15 + i * (70 / totalSubreddits);
      const progressEnd = 15 + (i + 1) * (70 / totalSubreddits);

      sendEvent({
        type: 'step',
        id: stepId,
        status: 'running',
        message: `Processing subreddit r/${subreddit}`,
        details: `Searching for content matching ${keywordList.length} keywords`,
        progress: progressBase,
      });

      try {
        const query = keywordList[0];
        const relevanceThreshold = JSON.parse(agent[0].configuration).relevanceThreshold;

        const result = await runAgent({
          agentId,
          subreddit,
          query,
          relevanceThreshold,
          businessInterests: keywordList,
          businessDescription: agent[0].description ?? '',
          onProgress: (msg: string) => {
            const skipMsgs = [
              'No relevant posts found in this subreddit',
              'No post selected for comment analysis',
              'No content available for analysis',
              'Could not parse analysis results',
              'Content is not relevant enough',
            ];
            const skipped = skipMsgs.some((s) => msg.includes(s));
            sendEvent({
              type: 'step',
              id: `${stepId}-progress`,
              status: skipped ? 'skipped' : 'complete',
              message: `Processing r/${subreddit}`,
              details: msg,
              progress: progressBase + (progressEnd - progressBase) * 0.5,
            });
          },
        });

        if (result.storedResult?.success) {
          results.push({
            subreddit,
            resultId: result.storedResult.resultId,
            success: true,
          });
          storedResultIds.push(result.storedResult.resultId);

          sendEvent({
            type: 'step',
            id: stepId,
            status: 'completed',
            message: `Completed processing r/${subreddit}`,
            details: `🙂Found relevant content with ${result.analysis?.relevanceScore || 0}% relevance`,
            progress: progressEnd,
          });
        } else {
          sendEvent({
            type: 'step',
            id: stepId,
            status: 'completed',
            message: `Completed processing r/${subreddit}`,
            details: '☹️No relevant content found',
            progress: progressEnd,
          });
        }
      } catch (err) {
        console.error(`Error in r/${subreddit}:`, err);
        sendEvent({
          type: 'step',
          id: stepId,
          status: 'error',
          message: `Error processing r/${subreddit}`,
          details: err instanceof Error ? err.message : 'Unknown error',
          progress: progressEnd,
        });

        results.push({
          subreddit,
          success: false,
          error: String(err),
        });
      }
    }

    sendEvent({
      type: 'step',
      id: 'update-stats',
      status: 'running',
      message: 'Updating agent statistics',
      progress: 90,
    });

    await db
      .update(agents)
      .set({
        lastRunAt: new Date(),
        runCount: agent[0].runCount + 1,
      })
      .where(eq(agents.id, agentId));

    sendEvent({
      type: 'step',
      id: 'update-stats',
      status: 'completed',
      message: 'Agent statistics updated',
      progress: 95,
    });

    let summary = '';
    let recentResults: any = [];
    if (storedResultIds.length > 0) {
      recentResults = await db
        .select()
        .from(monitoringResults)
        .where(eq(monitoringResults.agentId, agentId))
        .orderBy(monitoringResults.createdAt)
        .limit(10);

      summary = `Found ${storedResultIds.length} relevant results across ${subredditList.length} subreddits.`;

      if (recentResults.length > 0) {
        summary += ` Most recent: r/${recentResults[0].subreddit} (${recentResults[0].relevanceScore}% relevance).`;
      }
    } else {
      summary = `No relevant results found across ${subredditList.length} subreddits.`;
    }

    sendEvent({
      type: 'complete',
      success: true,
      summary,
      resultsCount: storedResultIds.length,
      processedSubreddits: subredditList.length,
      progress: 100,
      recentResults,
    });

    close();

    await sendRunNotification({
      agentId,
      success: true,
      message: summary,
      resultsCount: storedResultIds.length,
      processedSubreddits: subredditList.length,
    });
  } catch (error) {
    console.error('Agent run error:', error);
    sendEvent({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    });
    await sendRunNotification({
      agentId,
      success: false,
      message: 'Agent run failed',
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
    close();
  }
}
