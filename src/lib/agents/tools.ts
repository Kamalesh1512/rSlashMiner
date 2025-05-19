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
    const { query, timeframe="all"} = input;
    console.log("==========The Keyword==========",query);
    const posts = await redditService.searchTopExactMatchPosts(
      query,
      timeframe,
    );
    return JSON.stringify(posts);
  },
  {
    name: "search_reddit",
    description: "Search for posts in a specific subreddit with a query.",
    schema: z.object({
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


function escapeText(text: string) {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // remove non-printables
}

async function retryOpenAIRequest(payload: any, maxRetries = 3) {
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

    const user_prompt = JSON.stringify({
      content: safeContent,
      business: {
        description: safeDescription,
        keywords: safeKeywords,
      },
    });

    const system_prompt = `You are OpportunityGPT, an expert business-signal classifier.

⚙ TASK  
For one Reddit post or comment, decide whether it is a *commercial opportunity* for the company described below.

⚖ SCORING RULES  
• relevanceScore:  
  90-100 → clear buying intent  
  70-89  → problem/pain where our product clearly fits  
  40-69  → tangential discussion, might join for awareness  
  10-39  → off-topic; vaguely related keyword only  
  0-9    → no relation at all  

• sentimentScore:  
  -100 = hostile  
     0 = neutral  
  +100 = enthusiastic  
  Use tone *about the topic*, not the user's mood.

⚠ INPUT  
You will receive a JSON object with:
- content: the Reddit post/comment  
- business: an object with description and keywords  

⚠ OUTPUT  
Return only valid **minified JSON** with the following two fields:

{
  "relevanceScore": <integer between 0-100>,
  "sentimentScore": <integer between -100 and 100>
}

Do not include any explanation or wrap in triple backticks.`;

    const payload = {
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: user_prompt,
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
        sentimentScore: 0,
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
    postCreatedAt,
    relevanceScore,
    comments,
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
          createdAt: postCreatedAt ? new Date(postCreatedAt* 1000) : new Date(),
          relevanceScore,
          numComments: comments?.toString() ?? null,
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
      postCreatedAt:z.number().optional().describe("Post created Date"),
      relevanceScore: z.number().describe("The relevance score from 0-100"),
      comments:z.number().describe("The Number of comments for the post"),
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
      if (existingRecord.length > 0) {
        return JSON.stringify({ success: true, postId });
      } else {
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
const tools = [
  searchReddit,
  getComments,
  analyzeContent,
  storeResult,
  checkExistingPost,
];
