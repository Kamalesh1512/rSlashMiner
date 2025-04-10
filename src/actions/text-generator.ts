"use server";

import {
  fallbackKeywords,
  fallbackSubreddits,
} from "@/lib/constants/constants";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_API_KEY!,
});

export const generateKeywords = async (
  description: string,
  industry: string
): Promise<{ status: number; data?: string[]; error?: string }> => {
  const prompt = `Generate a list of 15-20 relevant keywords and phrases that potential customers might use on Reddit when looking for solutions related to the following business:
    
    Business Description: ${description}
    Industry: ${industry}
    
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
          const parsed = JSON.parse(content);
          if (
            Array.isArray(parsed) &&
            parsed.every((k) => typeof k === "string")
          ) {
            return { status: 200, data: parsed };
          } else {
            return { status: 201, data: fallbackKeywords(industry) };
          }
        }
      } catch (err) {
        console.error("Keyword JSON parsing error:", err);
        return { status: 201, data: fallbackKeywords(industry) };
      }
    }
    return { status: 201, error: "No keywords generated" };
  } catch (err) {
    console.error("Keyword generation error:", err);
    return { status: 400, data: fallbackKeywords(industry) };
  }
};

export const suggestSubreddits = async (
  description: string,
  industry: string
): Promise<{ status: number; data?: string[]; error?: string }> => {
  const prompt = `Suggest 10-15 relevant subreddits where potential customers might discuss needs or problems related to the following business:
    
    Business Description: ${description}
    Industry: ${industry}
    
    Focus on:
    1. Industry-specific subreddits
    2. Problem-focused communities
    3. Subreddits where people ask for recommendations
    4. Communities for professionals in related fields
    5. General discussion forums relevant to the target audience
    
    Return ONLY a JSON array of strings with subreddit names (without the r/ prefix) and no explanation or additional text.
    For example:["subreddit1", "subreddit2", "subreddit3"]`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that suggests relevant subreddits in JSON format.",
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
            return { status: 200, data: parsed };
          } else {
            return { status: 201, data: fallbackSubreddits(industry) };
          }
        }
      } catch (err) {
        console.error("Subreddit JSON parsing error:", err);
        return { status: 201, data: fallbackSubreddits(industry) };
      }
    }

    return {
      status: 201,
      error: "No subreddits generated",
      data: fallbackSubreddits(industry),
    };
  } catch (err) {
    console.error("Subreddit suggestion error:", err);
    return { status: 400, data: fallbackSubreddits(industry) };
  }
};
