import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { openai } from "./genai";
import { db } from "@/lib/db";
import { monitoringResults } from "@/lib/db/schema";

// Define the Reddit API service
class RedditService {
  async searchPosts(subreddit: string, query: string, timeframe = "day") {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(
          query
        )}&sort=new&t=${timeframe}&limit=25`,
        {
          headers: {
            "User-Agent": "rSlashMiner/1.0.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.children.map((child: any) => ({
        id: child.data.id,
        title: child.data.title,
        selftext: child.data.selftext,
        author: child.data.author,
        subreddit: child.data.subreddit,
        url: `https://www.reddit.com${child.data.permalink}`,
        score: child.data.score,
        created_utc: child.data.created_utc,
      }));
    } catch (error) {
      console.error("Error searching Reddit posts:", error);
      return [];
    }
  }

  async getSubredditPosts(subreddit: string, sort = "new", limit = 25) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
        {
          headers: {
            "User-Agent": "rSlashMiner/1.0.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.children.map((child: any) => ({
        id: child.data.id,
        title: child.data.title,
        selftext: child.data.selftext,
        author: child.data.author,
        subreddit: child.data.subreddit,
        url: `https://www.reddit.com${child.data.permalink}`,
        score: child.data.score,
        created_utc: child.data.created_utc,
      }));
    } catch (error) {
      console.error("Error getting subreddit posts:", error);
      return [];
    }
  }

  async getComments(postId: string, subreddit: string) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`,
        {
          headers: {
            "User-Agent": "rSlashMiner/1.0.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      const comments = data[1].data.children
        .filter((child: any) => child.kind === "t1")
        .map((child: any) => ({
          id: child.data.id,
          body: child.data.body,
          author: child.data.author,
          score: child.data.score,
          created_utc: child.data.created_utc,
        }));

      return comments;
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }
}

// Create Reddit service instance
const redditService = new RedditService();

// Define the tools
export const searchReddit = tool(
  async (input) => {
    const { subreddit, query, timeframe = "day" } = input;
    const posts = await redditService.searchPosts(subreddit, query, timeframe);
    return JSON.stringify(posts);
  },
  {
    name: "search_reddit",
    description: "Search for posts in a specific subreddit with a query.",
    schema: z.object({
      subreddit: z.string().describe("The subreddit to search in."),
      query: z.string().describe("The search query."),
      timeframe: z
        .enum(["hour", "day", "week", "month", "year", "all"])
        .optional()
        .describe("Time frame for the search."),
    }),
  }
);

export const getComments = tool(
  async ({ postId, subreddit }) => {
    const comments = await redditService.getComments(postId, subreddit);
    return JSON.stringify(comments);
  },
  {
    name: "get_comments",
    description: "Get comments for a specific post.",
    schema: z.object({
      postId: z.string().describe("The ID of the post to get comments from."),
      subreddit: z.string().describe("The subreddit the post is in."),
    }),
  }
);

export const analyzeContent = tool(
  async ({ content, businessInterests, businessDescription }) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that generates keyword suggestions in JSON format.",
          },
          {
            role: "user",
            content: `Analyze the following Reddit content and determine if it indicates a potential customer or business opportunity related to the described business.
  
  Content: ${content}
  
  Business Description: ${businessDescription}
  
  Business Keywords: ${businessInterests.join(", ")}
  
  Provide your analysis in JSON format with the following fields:
  - relevanceScore: A number from 0-100 indicating how relevant this content is to the business
  - matchedKeywords: An array of keywords from the business interests that match the content
  - reasoning: A brief explanation of why this content is or isn't relevant
  - sentimentScore: A number from -100 to 100 indicating the sentiment (-100 very negative, 0 neutral, 100 very positive)
  - potentialAction: A suggested action to take (e.g., "reach out", "monitor", "ignore")
  `,
          },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error analyzing content with OpenAI:", error);
      return JSON.stringify({
        relevanceScore: 50,
        matchedKeywords: [],
        reasoning: "Unable to perform detailed analysis due to API error",
        sentimentScore: 0,
        potentialAction: "review manually",
      });
    }
  },
  {
    name: "analyze_content",
    description: "Analyze Reddit content for relevance to business interests",
    schema: z.object({
      content: z.string().describe("The content to analyze"),
      businessInterests: z
        .array(z.string())
        .describe("Keywords related to business interests"),
      businessDescription: z
        .string()
        .describe("Description of the business or product"),
    }),
  }
);

export const storeResult = tool(
  async ({
    agentId,
    redditPostId,
    redditCommentId,
    content,
    author,
    subreddit,
    url,
    score,
    matchedKeywords,
    relevanceScore,
    sentimentScore,
  }) => {
    try {
      const resultId = createId();

      await db.insert(monitoringResults).values({
        id: resultId,
        agentId,
        redditPostId: redditPostId || null,
        redditCommentId: redditCommentId || null,
        content,
        author,
        subreddit,
        url,
        score: score ?? 0,
        createdAt: new Date(),
        matchedKeywords:JSON.stringify(matchedKeywords),
        relevanceScore,
        processed: false,
        sentimentScore: sentimentScore ?? 0,
      });

      return JSON.stringify({ success: true, resultId });
    } catch (error) {
      console.error("Error storing result:", error);
      return JSON.stringify({ success: false, error: String(error) });
    }
  },
  {
    name: "store_result",
    description: "Store a monitoring result in the database",
    schema: z.object({
      agentId: z
        .string()
        .describe("The ID of the agent that found this result"),
      redditPostId: z.string().optional().describe("The Reddit post ID"),
      redditCommentId: z.string().optional().describe("The Reddit comment ID"),
      content: z.string().describe("The content of the post or comment"),
      author: z.string().describe("The Reddit username of the author"),
      subreddit: z
        .string()
        .describe("The subreddit where the content was found"),
      url: z.string().describe("The URL to the content"),
      score: z.number().optional().describe("The score/upvotes of the content"),
      matchedKeywords: z
        .array(z.string())
        .describe("Keywords that matched in the content"),
      relevanceScore: z.number().describe("The relevance score from 0-100"),
      sentimentScore: z
        .number()
        .optional()
        .describe("The sentiment score from -100 to 100"),
    }),
  }
);

// Instantiate the tools
const tools = [searchReddit, getComments, analyzeContent, storeResult];