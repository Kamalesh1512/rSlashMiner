import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { openai } from "./genai";
import { db } from "@/lib/db";
import { monitoringResults } from "@/lib/db/schema";
import redditService from "@/lib/services/reddit";
import { eq } from "drizzle-orm";
import { sendRunNotification } from "../notifications";

// Define the tools
export const searchReddit = tool(
  async (input) => {
    const { query, timeframe = "all", limit } = input;
    // console.log("The subreddit", { subreddit, queries, timeframe });
    // const posts = await redditService.searchPosts(subreddit, query, timeframe);
    const posts = await redditService.searchPostsByKeyword(
      query,
      timeframe,
      limit
    );

    return JSON.stringify(posts);
  },
  {
    name: "search_reddit",
    description: "Search for posts in a specific subreddit with a query.",
    schema: z.object({
      limit: z.number().describe("The Limit to search top posts"),
      query: z.string().describe("The search query."),
      timeframe: z
        .enum(["hour", "day", "week", "month", "year", "all"])
        .optional()
        .describe("Time frame for the search."),
    }),
  }
);

export const getComments = tool(
  async ({ postId }) => {
    // console.log("Fetching comments for:", { postId });
    const comments = await redditService.getComments(postId);
    return JSON.stringify(comments);
  },
  {
    name: "get_comments",
    description: "Get comments for a specific post.",
    schema: z.object({
      postId: z.string().describe("The ID of the post to get comments from."),
    }),
  }
);

// export const analyzeContent = tool(
//   async ({ content, businessInterests, businessDescription }) => {
//     const prompt = `Analyze the following Reddit content and determine if it indicates a potential customer or business opportunity related to the described business.
//                       Content: ${content}
//                       Business Description: ${businessDescription}
//                       Business Keywords: ${businessInterests.join(", ")}

//                       Provide your analysis in JSON format with the following fields:
//                       - relevanceScore: A number from 0-100 indicating how relevant this content is to the business
//                       - matchedKeywords: An array of keywords from the business interests that match the content
//                       - reasoning: A brief explanation (1-2 sentences) of why this content is or isn't relevant
//                       - sentimentScore: A number from -100 to 100 indicating the sentiment (-100 very negative, 0 neutral, 100 very positive)
//                       - potentialAction: A suggested action to take (e.g., "reach out", "monitor", "ignore")`;
//     try {
//       const response = await openai.chat.completions.create({
//         model: "gpt-3.5-turbo",
//         messages: [
//           {
//             role: "system",
//             content: `You are an AI assistant that analyzes Reddit posts to determine their business relevance.
//                 You MUST respond strictly in valid JSON with the following structure:
//                 {
//                 "relevanceScore": number (0-100),
//                 "matchedKeywords": string[],
//                 "reasoning": string,
//                 "sentimentScore": number (-100 to 100),
//                 "potentialAction": string ("reach out", "monitor", "ignore")
//                 }.`,
//           },
//           {
//             role: "user",
//             content: prompt,
//           },
//         ],
//         temperature: 0.2,
//       });
//       return response.choices[0].message.content;
//     } catch (error) {
//       console.error("Error analyzing content with OpenAI:", error);
//       return JSON.stringify({
//         relevanceScore: 50,
//         matchedKeywords: [],
//         reasoning: "Unable to perform detailed analysis due to API error",
//         sentimentScore: 0,
//         potentialAction: "review manually",
//       });
//     }
//   },
//   {
//     name: "analyze_content",
//     description: "Analyze Reddit content for relevance to business interests",
//     schema: z.object({
//       content: z.string().describe("The content to analyze"),
//       businessInterests: z
//         .array(z.string())
//         .describe("Keywords related to business interests"),
//       businessDescription: z
//         .string()
//         .describe("Description of the business or product"),
//     }),
//   }
// );


function escapeText(text: string) {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // remove non-printables
}

async function retryOpenAIRequest(payload:any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await openai.chat.completions.create(payload);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`OpenAI error on attempt ${attempt}, retrying...`, error);
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }
}

export const analyzeContent = tool(
  async ({ content, businessInterests, businessDescription }) => {
    const safeContent = escapeText(content);
    const safeDescription = escapeText(businessDescription);
    const safeKeywords = businessInterests.map(escapeText).join(", ");

    const prompt = `Analyze the following Reddit content for business relevance.

Content: ${safeContent}

Business Description: ${safeDescription}
Business Keywords: ${safeKeywords}

Respond strictly with a JSON object:
{
  "relevanceScore": number (0-100),
  "matchedKeywords": string[],
  "reasoning": string,
  "sentimentScore": number (-100 to 100),
  "potentialAction": string ("reach out", "monitor", "ignore")
}`;

    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a business opportunity analyzer. Your job is to assess Reddit content for potential business interest relevance and return strictly valid JSON only.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    };

    try {
      const response = await retryOpenAIRequest(payload);
      if (!response || !response.choices || !response.choices.length) {
        throw new Error("No response from OpenAI");
      }
      const raw = response.choices[0]?.message?.content ?? "";

      // Attempt to parse JSON if GPT adds extra explanation accidentally
      const firstJson = raw.match(/\{[\s\S]*\}/);
      return firstJson ? firstJson[0] : raw;
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

      await db
        .insert(monitoringResults)
        .values({
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
          matchedKeywords: JSON.stringify(matchedKeywords),
          relevanceScore,
          processed: false,
          sentimentScore: sentimentScore ?? 0,
        })
        .onConflictDoNothing();

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
export const checkExistingPost = tool(
  async ({ postId }) => {
    try {
      const existingRecord = await db
        .select()
        .from(monitoringResults)
        .where(eq(monitoringResults.redditPostId, postId));
      if (existingRecord.length>0) {
        return JSON.stringify({ success: true, postId });
      }else{
        return JSON.stringify({ success: false, postId });
      }
    } catch (error) {
      console.error("Error reading existing data:", error);
      return JSON.stringify({ success: false, error: String(error) });
    }
  },
  {
    name: "check_existing_post",
    description: "Checks database for already existing data",
    schema: z.object({
      postId: z.string().describe("The ID of the post to get comments from."),
    }),
  }
);

// Instantiate the tools
const tools = [searchReddit, getComments, analyzeContent, storeResult,checkExistingPost];
