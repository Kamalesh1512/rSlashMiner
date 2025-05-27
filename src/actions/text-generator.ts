"use server";
import {
  businessPatterns,
  fallbackKeywords,
  fallbackSubreddits,
  SubredditProps,
} from "@/lib/constants/types";
import redditService from "@/lib/services/reddit";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_API_KEY!,
});

export const generateKeywords = async (
  description: string
): Promise<{
  status: number;
  data?: {
    keywords: string[];
    suggestedKeywords: string[];
  };
  error?: string;
}> => {
  const prompt = `You are a keyword research assistant. Based on the business description below, generate a highly relevant list of 10-15 keywords or search phrases that potential customers might use on Reddit when searching for solutions.

Business Description:
${description}

Guidelines:
- Focus on what users would type or ask when experiencing a problem or seeking a solution.
- DO NOT generate generic patterns like “how to solve X”; instead, infer actual user pain points, needs, and goals from the business context.
- Think like a Reddit user posting in niche subreddits, communities, or discussion threads.
- Use terminology and phrasing that reflects real-world concerns, frustrations, desires, or recommendations users might request.

Types of keywords to include:
1. Pain points or issues (e.g., "struggling with [problem]")
2. Solution-seeking phrases (e.g., "tool for [task]")
3. Requests for help or suggestions (e.g., "any alternatives to [product]")
4. Industry-specific jargon or language
5. Common Reddit-style phrasing (e.g., “what’s the best way to...”)

Format:
Return ONLY a JSON array of strings, with no explanations or extra text.
Example: ["keyword 1", "keyword 2", "keyword 3"]
`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an keyword research assistant that generates keyword suggestions in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const content = res.choices[0].message.content;

    if (content) {
      try {
        const matchedJson = content.match(/\[[^]*?\]/);
        if (matchedJson) {
          const parsed = JSON.parse(matchedJson[0]);
          if (
            Array.isArray(parsed) &&
            parsed.every((k) => typeof k === "string")
          ) {
            return {
              status: 200,
              data: {
                keywords: parsed.slice(0, 5),
                suggestedKeywords: parsed,
              },
            };
          } else {
            return { status: 201 };
          }
        }
      } catch (err) {
        console.error("Keyword JSON parsing error:", err);
        return { status: 201 };
      }
    }
    return { status: 201, error: "No keywords generated" };
  } catch (err) {
    console.error("Keyword generation error:", err);
    return { status: 400 };
  }
};

// Ask OpenAI to suggest subreddits
async function generateAISubreddits(description: string): Promise<string[]> {
  const systemPrompt = `
You are a helpful Reddit expert assistant. Your task is to suggest existing, relevant, and active subreddits where users typically discuss the given topic or problem.
Only suggest real subreddit names without the "r/" prefix. Prioritize communities that are:
- Highly active (daily discussions, recent posts)
- Focused on the given topic
- Helpful or insightful for the user

Do not invent subreddit names. Respond only with a comma-separated list of subreddit names (maximum 10). No explanations or extra formatting.
`;

  const userPrompt = `Suggest the most relevant subreddits for this topic: "${description}"`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // use "gpt-4" if available for better quality
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content || "";
  return raw
    .split(",")
    .map((sub) => sub.trim().replace(/^r\//, "").toLowerCase())
    .filter(Boolean);
}

export async function suggestSubreddits(
  description: string
): Promise<{
  status: number;
  data?: {
    subreddits: string[];
    suggestedSubreddits: string[];
  };
  error?: string;
}> {
  try {
    const aiSuggested = await generateAISubreddits(description);

    const verifiedSubreddits = new Map<string, SubredditProps>();

    const allMatches = await Promise.all(
      aiSuggested.map((name) => redditService.searchSubreddits(name, 1))
    );

    allMatches.flat().forEach((sub: SubredditProps) => {
      if (!verifiedSubreddits.has(sub.name)) {
        verifiedSubreddits.set(sub.name, sub);
      }
    });

    const sorted = Array.from(verifiedSubreddits.values()).sort(
      (a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0)
    );

    const top5 = sorted.slice(0, 5).map((s) => s.name);
    const top15 = sorted.slice(0, 15).map((s) => s.name);

    return {
      status: 200,
      data: {
        subreddits: top5,
        suggestedSubreddits: top15,
      },
    };
  } catch (error) {
    console.error("Subreddit suggestion error:", error);
    return { status: 400, error: "Failed to fetch AI-based subreddits" };
  }
}

export async function validateBusinessInput(input: string) {
  const chat = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Determine whether the user's input is a business idea, a problem statement, or a request for help with a business concept. Respond with 'Yes' if it is. Otherwise, say 'No'.",
      },
      {
        role: "user",
        content: input,
      },
    ],
    temperature: 0.2,
  });

  const reply = chat.choices[0].message.content?.toLowerCase() || "";
  // const lowered = input.toLowerCase()
  // return businessPatterns.some((pattern) => {
  //   const patternTokens = pattern.split(" ");
  //   return patternTokens.every((word) => lowered.includes(word));
  // });

  const isValid = reply.toLowerCase().includes("yes");
  console.log("business valid response:", isValid);
  return { isValid };
}
