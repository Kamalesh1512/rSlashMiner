import { suggestSubreddits } from "@/actions/text-generator";
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
  num_comments: number;
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
    if (!data.access_token) {
      throw new Error("Failed to authenticate with Reddit API");
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000; // cache token
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
    limit: number
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
    posts.sort((a: any, b: any) => {
      const engagementA = a.score + (a.num_comments ?? 0);
      const engagementB = b.score + (b.num_comments ?? 0);
      return engagementB - engagementA;
    });

    return posts;
  }

  async searchRelevantPosts(
    keyword: string,
    time: Timeframe
  ): Promise<RedditPost[]> {
    const subredditLimit = 5;
    const postLimitPerSub = 10;
    const postSampleSize = 50;

    // STEP 1: Search globally across Reddit posts (not limited to a subreddit)
    const globalResults = await this.fetchFromReddit(`/search`, {
      q: keyword,
      sort: "relevance",
      t: time,
      limit: postSampleSize,
      restrict_sr: false,
      include_over_18: false,
    });

    const rawPosts = (globalResults.data?.children || []).map(
      (child: any) => child.data
    );

    // STEP 2: Extract subreddits from global search posts
    const subredditMap = new Map<string, number>();

    for (const post of rawPosts) {
      const subreddit = post.subreddit;
      subredditMap.set(subreddit, (subredditMap.get(subreddit) || 0) + 1);
    }

    // Sort subreddits by frequency and take top ones
    const subredditNames = Array.from(subredditMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, subredditLimit)
      .map(([sub]) => sub.toLowerCase());


    const allPosts: RedditPost[] = [];

    // STEP 3: Search again inside these subreddits
    for (const subreddit of subredditNames) {
      const postData = await this.fetchFromReddit(`/r/${subreddit}/search`, {
        q: keyword,
        sort: "relevance",
        t: time,
        limit: postLimitPerSub,
        restrict_sr: true,
        include_over_18: false,
      });

      const posts = (postData.data?.children || []).map((child: any) => {
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

      allPosts.push(...posts);
    }

    // STEP 4: Filter posts for actual keyword presence and recency
    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - 60 * 60 * 24 * 30 * 6;
    const queryLower = keyword.toLowerCase();

    console.log("Posts searched...",allPosts)
    const filtered = allPosts
      .filter((post) => {
        const text = (post.title + " " + post.selftext).toLowerCase();
        const isMatch =
          text.includes(queryLower) || text.split(/\s+/).includes(queryLower);
        const isRecent = post.created_utc >= sixMonthsAgo;
        return isMatch && isRecent;
      })
      .sort((a, b) => {
        const engagementA = a.score + (a.num_comments ?? 0);
        const engagementB = b.score + (b.num_comments ?? 0);
        return engagementB - engagementA;
      });

    return filtered;
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

