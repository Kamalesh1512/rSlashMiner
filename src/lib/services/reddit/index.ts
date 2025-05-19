import { SubredditProps } from "@/lib/constants/types";
import dotenv from "dotenv";

dotenv.config();

export type RedditPost = {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  created_utc: number;
};

export type RedditComment = {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
};

type Timeframe = "hour" | "day" | "week" | "month" | "year" | "all";

class RedditService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent": process.env.REDDIT_USER_AGENT!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: process.env.REDDIT_USERNAME!,
        password: process.env.REDDIT_PASSWORD!,
      }),
    });

    const data = await response.json();
    // console.log("Token",data)
    if (!data.access_token) {
      throw new Error("Failed to authenticate with Reddit API");
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000; // cache token
    console.log("Access Token generated");
    return this.accessToken as string;
  }

  private async fetchFromReddit(
    endpoint: string,
    params: Record<string, string | number | boolean>
  ) {
    const token = await this.authenticate();

    const url = new URL(`https://oauth.reddit.com${endpoint}`);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, String(value))
    );

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": process.env.REDDIT_USER_AGENT || "",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Reddit API error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return json;
  }

  async searchSubreddits(query: string, limit = 10): Promise<SubredditProps[]> {
    const data = await this.fetchFromReddit(`/subreddits/search`, {
      q: query,
      limit,
      sort: "relevance",
    });

    console.log("Searched subreddits based on query...");
    return (data.data?.children || []).map((child: any) => {
      const sub = child.data;
      return {
        id: sub.id,
        name: sub.display_name,
        title: sub.title,
        description: sub.public_description,
        subscribers: sub.subscribers,
        url: `https://www.reddit.com${sub.url}`,
      };
    });
  }
  async searchPostsByKeyword(
    keyword: string,
    time: Timeframe,
    limit:number
  ): Promise<RedditPost[]> {
    const data = await this.fetchFromReddit(`/search`, {
      q: keyword,
      sort: "relevance",
      t: time,
      limit,
      restrict_sr: false,
      include_over_18: false,
    });
  
    const posts = (data.data?.children || []).map((child: any) => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        selftext: post.selftext,
        author: post.author,
        subreddit: post.subreddit,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score,
        created_utc: post.created_utc,
        num_comments: post.num_comments ?? 0,
      };
    });
  
    // Engagement score = upvotes + comment count
    posts.sort((a:any, b:any) => {
      const engagementA = a.score + (a.num_comments ?? 0);
      const engagementB = b.score + (b.num_comments ?? 0);
      return engagementB - engagementA;
    });
  
    return posts;
  }

  async searchTopExactMatchPosts(
  keyword: string,
  time:Timeframe
): Promise<RedditPost[]> {
  const limit = 15;

  // Step 1: Fetch up to 25 posts using search
  const data = await this.fetchFromReddit(`/search`, {
    q: keyword,
    sort: "relevance",
    t: time,
    limit,
    restrict_sr: false,
    include_over_18: false,
  });

  // Step 2: Extract and normalize
  const posts = (data.data?.children || []).map((child: any) => {
    const post = child.data;
    return {
      id: post.id,
      title: post.title,
      selftext: post.selftext,
      author: post.author,
      subreddit: post.subreddit,
      url: `https://www.reddit.com${post.permalink}`,
      score: post.score,
      created_utc: post.created_utc,
      num_comments: post.num_comments ?? 0,
    };
  });

  // Step 3: Filter for stronger keyword matches
  // const keywordLower = keyword.toLowerCase();
  // const filtered = posts.filter((post:any) => {
  //   const content = (post.title + " " + post.selftext).toLowerCase();
  //   return (
  //     content.includes(keywordLower) ||
  //     content.split(/\s+/).includes(keywordLower)
  //   );
  // });

  // Step 3: Sort by relevance (score + comment count)
  posts.sort((a:any, b:any) => {
    const engagementA = a.score + (a.num_comments ?? 0);
    const engagementB = b.score + (b.num_comments ?? 0);
    return engagementB - engagementA;
  });

  return posts;
}
  

  async searchPosts(
    subreddit: string,
    query: string,
    time: Timeframe,
    limit = 1
  ): Promise<RedditPost[]> {
    const data = await this.fetchFromReddit(`/r/${subreddit}/search`, {
      q: query,
      limit,
      sort: "relevance", 
      t: time,
      restrict_sr: true,
    });
    return (data.data?.children).map((child: any) => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        selftext: post.selftext,
        author: post.author,
        subreddit: post.subreddit,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score,
        created_utc: post.created_utc,
      };
    });
  }

  async searchMultipleRedditPosts(
    subreddit: string,
    queries: string[],
    time: Timeframe,
    limit = 1
  ): Promise<RedditPost[]> {
    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    const allPosts: RedditPost[] = [];

    for (const query of queries) {
      const posts = await this.searchPosts(subreddit, query, time, limit);
      allPosts.push(...posts);
      await sleep(1000); // wait 1 second between requests
    }

    return allPosts;
  }

  async getSubredditPosts(
    subreddit: string,
    sort: "hot" | "new" | "top" = "new",
    limit = 5
  ): Promise<RedditPost[]> {
    const data = await this.fetchFromReddit(`/r/${subreddit}/${sort}`, {
      limit,
    });

    return (data.data?.children || []).map((child: any) => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        selftext: post.selftext,
        author: post.author,
        subreddit: post.subreddit,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score,
        created_utc: post.created_utc,
      };
    });
  }

  async getComments(postId: string): Promise<RedditComment[]> {
    const token = await this.authenticate();

    const res = await fetch(
      `https://oauth.reddit.com/comments/${postId}?depth=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": process.env.REDDIT_USER_AGENT || "",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error fetching comments: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const comments = data[1]?.data?.children || [];

    return comments
      .filter((c: any) => c.kind === "t1")
      .map((comment: any) => {
        const d = comment.data;
        return {
          id: d.id,
          body: d.body,
          author: d.author,
          score: d.score,
          created_utc: d.created_utc,
        };
      });
  }
}

const redditService = new RedditService();
export default redditService;
