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
  const prompt = `Generate a list of 10-15 relevant keywords and phrases that potential customers might use on Reddit when looking for solutions related to the following business:
    
    Business Description: ${description}
    
    Focus on:
    1. Problem statements (e.g., "how to solve X")
    2. Need expressions (e.g., "looking for a tool that can Y")
    3. Recommendation requests (e.g., "best solution for Z")
    4. Pain points and frustrations
    5. Industry-specific terminology
    
    Return ONLY a JSON array of strings with no explanation or additional text.
    example: ["keyword 1", "keyword 2", "keyword 3"]`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that generates keyword suggestions in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
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
  const prompt = `Given the following topic or problem description, suggest the most relevant and active subreddits (maximum 10) where this topic could be discussed. Respond with only a comma-separated list of subreddit names, without the "r/" prefix. Description: "${description}"`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // or "gpt-3.5-turbo" if needed
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const raw = completion.choices[0].message.content || "";

  console.log("AI suggested Subreddits", raw);
  return raw
    .split(",")
    .map((sub) => sub.trim().replace(/^r\//, "").toLowerCase())
    .filter(Boolean);
}

export const suggestSubreddits = async (
  description: string
): Promise<{
  status: number;
  data?: {
    subreddits: string[];
    suggestedSubreddits: string[];
  };
  error?: string;
}> => {
  try {
    const aiSuggested = await generateAISubreddits(description);

    const verifiedSubreddits = new Set<string>();

    for (const name of aiSuggested) {
      const matches = await redditService.searchSubreddits(name, 1);
      matches.forEach((sub: SubredditProps) =>
        verifiedSubreddits.add(sub.name)
      );
    }

    const finalList = Array.from(verifiedSubreddits);

    console.log("Finaled subreddits", finalList);

    return {
      status: 200,
      data: {
        subreddits: finalList.slice(0, 5),
        suggestedSubreddits: finalList.slice(0, 15),
      },
    };
  } catch (error) {
    console.error("Subreddit suggestion error:", error);
    return { status: 400, error: "Failed to fetch AI-based subreddits" };
  }
};

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
    temperature: 0.3,
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
