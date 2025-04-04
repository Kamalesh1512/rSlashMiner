import OpenAI from "openai";
import {z} from 'zod'



// console.log(process.env.NEXT_OPENAI_API_KEY)

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!, dangerouslyAllowBrowser:true });
const KeywordSchema = z.array(z.string())
/**
 * Generates keyword suggestions based on business description and industry
 */
export async function generateKeywords(description:string, industry:string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates keyword suggestions in JSON format."
        },
        {
          role: "user",
          content: `Generate a list of 15-20 relevant keywords and phrases that potential customers might use on Reddit when looking for solutions related to the following business:
          
          Business Description: ${description}
          Industry: ${industry}
          
          Focus on:
          1. Problem statements (e.g., "how to solve X")
          2. Need expressions (e.g., "looking for a tool that can Y")
          3. Recommendation requests (e.g., "best solution for Z")
          4. Pain points and frustrations
          5. Industry-specific terminology
          
          Return ONLY a JSON array of strings with no explanation or additional text.
          example: ["keyword 1", "keyword 2", "keyword 3"]`
        }
      ],
      temperature:0.7
    });

    
    try {

        // Parse the response as JSON
        const keywords = JSON.parse(response.choices[0].message.content as string)
  
        // Validate that it's an array of strings
        if (Array.isArray(keywords) && keywords.every((k) => typeof k === "string")) {
          return keywords
        } else {
          console.error("Invalid keywords format:", response.choices[0].message.content)
          return fallbackKeywords(industry)
        }
      } catch (error) {
        console.error("Error parsing keywords:", error)
        return fallbackKeywords(industry)
      }
    } catch (error) {
      console.error("Error generating keywords:", error)
      return fallbackKeywords(industry)
    } 
  
}

/**
 * Suggests relevant subreddits based on business description and industry
 */
export async function suggestSubreddits(description:string, industry:string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that suggests relevant subreddits in JSON format."
        },
        {
          role: "user",
          content: `Suggest 10-15 relevant subreddits where potential customers might discuss needs or problems related to the following business:
          
          Business Description: ${description}
          Industry: ${industry}
          
          Focus on:
          1. Industry-specific subreddits
          2. Problem-focused communities
          3. Subreddits where people ask for recommendations
          4. Communities for professionals in related fields
          5. General discussion forums relevant to the target audience
          
          Return ONLY a JSON array of strings with subreddit names (without the r/ prefix) and no explanation or additional text.
          For example:["subreddit1", "subreddit2", "subreddit3"]`
        }
      ],
      temperature:0.7
    });

    // return JSON.parse(response.choices[0].message.content);
        
    try {

        // Parse the response as JSON
        const keywords = JSON.parse(response.choices[0].message.content as string)
  
        // Validate that it's an array of strings
        if (Array.isArray(keywords) && keywords.every((k) => typeof k === "string")) {
          return keywords
        } else {
          console.error("Invalid subreddit format:", response.choices[0].message.content)
          return fallbackKeywords(industry)
        }
      } catch (error) {
        console.error("Error parsing subreddits:", error)
        return fallbackKeywords(industry)
      }
  } catch (error) {
    console.error("Error suggesting subreddits:", error);
    return fallbackSubreddits(industry);
  }
}

/**
 * Fallback keywords if the AI generation fails
 */
function fallbackKeywords(industry:string):string[] {
  const commonKeywords = [
    "recommendations", "looking for", "need help with", "alternative to",
    "best solution for", "how to", "struggling with", "advice needed",
    "problem with", "tool for"
  ];

  const industryKeywords:Record<string, string[]> = {
    technology: ["software", "app", "automation", "integration", "API", "SaaS", "platform", "tech stack"],
    ecommerce: ["online store", "shipping", "inventory", "marketplace", "dropshipping", "ecommerce platform"],
    finance: ["budgeting", "investing", "payment processing", "financial planning", "accounting software"],
    health: ["fitness app", "health tracking", "wellness", "nutrition", "mental health", "healthcare"],
    education: ["learning platform", "online courses", "education software", "teaching tools", "e-learning"],
    marketing: ["marketing automation", "analytics", "social media tools", "content marketing", "SEO"],
    food: ["food delivery", "recipe app", "meal planning", "restaurant tech", "food service"],
    travel: ["booking system", "travel planning", "itinerary", "accommodation", "travel tech"],
    entertainment: ["streaming", "content creation", "media management", "entertainment platform"],
    other: ["business solution", "productivity", "management tool", "collaboration", "workflow"]
  };

  return [...commonKeywords, ...(industryKeywords[industry] || industryKeywords.other)];
}

/**
 * Fallback subreddits if the AI generation fails
 */
function fallbackSubreddits(industry:string):string[] {
  const commonSubreddits = ["AskReddit", "HowTo", "technology", "Entrepreneur", "smallbusiness"];

  const industrySubreddits:Record<string, string[]> = {
    technology: ["webdev", "programming", "SaaS", "software", "techsupport", "startups", "technology"],
    ecommerce: ["ecommerce", "Entrepreneur", "FulfillmentByAmazon", "shopify", "smallbusiness"],
    finance: ["personalfinance", "investing", "FinancialPlanning", "Banking", "CreditCards"],
    health: ["fitness", "nutrition", "loseit", "HealthIT", "healthcare", "running"],
    education: ["education", "Teachers", "edtech", "OnlineEducation", "college", "gradschool"],
    marketing: ["marketing", "SEO", "socialmedia", "DigitalMarketing", "content_marketing"],
    food: ["Cooking", "MealPrepSunday", "food", "FoodTech", "restaurateur"],
    travel: ["travel", "backpacking", "TravelHacks", "TravelTech", "digitalnomad"],
    entertainment: ["entertainment", "movies", "Music", "podcasts", "streaming"],
    other: ["productivity", "business", "WorkOnline", "freelance", "remote"]
  };

  return [...commonSubreddits, ...(industrySubreddits[industry] || industrySubreddits.other)];
}
