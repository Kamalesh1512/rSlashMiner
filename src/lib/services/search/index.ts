import redditService from "../reddit";

const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_API_KEY!;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX!;

type GoogleResult = {
  title: string;
  link: string;
  snippet: string;
};

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

export async function googleSearchReddit(query: string): Promise<RedditPost[]> {
  const url = `https://www.googleapis.com/customsearch/v1?q=site:reddit.com+${encodeURIComponent(
    query
  )}&key=${GOOGLE_CSE_KEY}&cx=${GOOGLE_CSE_CX}`;
  const posts: RedditPost[] = [];

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google CSE failed: ${res.statusText}`);

  const json = await res.json();

  const items: GoogleResult[] =
    json.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })) || [];

  console.log(items.length);

  const enriched = await Promise.all(
    items.map(async (item) => {
      const match = item.link.match(/\/comments\/([a-z0-9]+)\//i);
      const postId = match?.[1];
      if (!postId) {
        console.log(`Invalid Reddit post URL: ${item.link}`);
      }
      const post = await redditService.getPostByUrl(item.link);
      if (post) posts.push(post);
    })
  );

  return posts;
}


const BING_SEARCH_KEY = process.env.BING_SEARCH_KEY!;
const BING_SEARCH_ENDPOINT = process.env.BING_SEARCH_ENDPOINT! || "https://api.bing.microsoft.com";

export async function bingSearchReddit(query: string): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  const url = `${BING_SEARCH_ENDPOINT}/v7.0/search?q=site:reddit.com+${encodeURIComponent(query)}&count=10`;

  const res = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": BING_SEARCH_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Bing Search failed: ${res.statusText}`);
  }

  const json = await res.json();

  const items = json.webPages?.value ?? [];

  const enriched = await Promise.all(
    items.map(async (item: any) => {
      const link = item.url;
      const match = link.match(/\/comments\/([a-z0-9]+)\//i);
      const postId = match?.[1];

      if (!postId) {
        console.log(`Invalid Reddit post URL: ${link}`);
        return null;
      }

      const post = await redditService.getPostByUrl(link);
      if (post) posts.push(post);
    })
  );

  return posts;
}