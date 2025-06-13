// import redditService from "../reddit";

// const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_API_KEY!;
// const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX!;

// type GoogleResult = {
//   title: string;
//   link: string;
//   snippet: string;
// };

// interface RedditPost {
//   id: string;
//   title: string;
//   selftext: string;
//   author: string;
//   subreddit: string;
//   url: string;
//   score: number;
//   created_utc: number;
//   num_comments: number;
// }

// export async function googleSearchReddit(query: string): Promise<RedditPost[]> {
//   const url = `https://www.googleapis.com/customsearch/v1?q=site:reddit.com+${encodeURIComponent(
//     query
//   )}&key=${GOOGLE_CSE_KEY}&cx=${GOOGLE_CSE_CX}`;
//   const posts: RedditPost[] = [];

//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Google CSE failed: ${res.statusText}`);

//   const json = await res.json();

//   const items: GoogleResult[] =
//     json.items?.map((item: any) => ({
//       title: item.title,
//       link: item.link,
//       snippet: item.snippet,
//     })) || [];

//   console.log(items.length);

//   const enriched = await Promise.all(
//     items.map(async (item) => {
//       const match = item.link.match(/\/comments\/([a-z0-9]+)\//i);
//       const postId = match?.[1];
//       if (!postId) {
//         console.log(`Invalid Reddit post URL: ${item.link}`);
//       }
//       const post = await redditService.getPostByUrl(item.link);
//       if (post) posts.push(post);
//     })
//   );

//   return posts;
// }

import { eq, and, gte } from "drizzle-orm";

import { subHours } from "date-fns";
import redditService from "../reddit";
import { db } from "@/lib/db";
import { monitoringResults } from "@/lib/db/schema";

const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_API_KEY!;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX!;

interface GoogleResult {
  title: string;
  link: string;
  snippet: string;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  created_utc: number;
  num_comments: number;
}

const CACHE_HOURS = 6;

export async function googleSearchReddit(query: string): Promise<RedditPost[]> {
  const sixHoursAgo = subHours(new Date(), CACHE_HOURS);

  // Step 1: Check if recent cached results exist for the query
  const cachedUrlsRes = await db
    .select({ url: monitoringResults.url })
    .from(monitoringResults)
    .where(
      and(
        eq(monitoringResults.matchedKeywords, query),
        gte(monitoringResults.createdAt, sixHoursAgo)
      )
    );

  const cachedUrls = cachedUrlsRes.map((r) => r.url);
  if (cachedUrls.length > 0) {
  console.log(`Using ${cachedUrls.length} cached results for query:`, query);
  return [];
  }

  // Step 3: If no cached results, call Google CSE
  const url = `https://www.googleapis.com/customsearch/v1?q=site:reddit.com+${encodeURIComponent(
    query
  )}&key=${GOOGLE_CSE_KEY}&cx=${GOOGLE_CSE_CX}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google CSE failed: ${res.statusText}`);

  const json = await res.json();
  const items: GoogleResult[] =
    json.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })) || [];

  console.log(`Google returned ${items.length} results for query: ${query}`);

  // Step 4: Deduplicate against already monitored posts
  const existingUrlsRes = await db
    .select({ url: monitoringResults.url })
    .from(monitoringResults)
    .where(eq(monitoringResults.matchedKeywords, query));

  const seenUrls = new Set(existingUrlsRes.map((r) => r.url));

  const newUrls = items
    .map((item) => item.link)
    .filter((url) => url.includes("reddit.com/r/") && !seenUrls.has(url));

  // Step 5: Enrich only new Reddit posts
  const posts: RedditPost[] = [];
  for (const url of newUrls) {
    const post = await redditService.getPostByUrl(url);
    if (post) posts.push(post);
  }
  return posts;
}
