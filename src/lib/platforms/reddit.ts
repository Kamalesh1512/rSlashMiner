// // lib/platforms/reddit.ts
// import { ProcessedContent } from "@/lib/constants/types";

// export class Reddit {
//   private accessToken: string = "";
//   private tokenExpiry: number = 0; // timestamp in ms
//   private clientId: string;
//   private clientSecret: string;
//   private username: string;
//   private password: string;
//   private userAgent: string;

//   constructor() {
//     this.clientId = process.env.REDDIT_CLIENT_ID || "";
//     this.clientSecret = process.env.REDDIT_CLIENT_SECRET || "";
//     this.username = process.env.REDDIT_USERNAME || "";
//     this.password = process.env.REDDIT_PASSWORD || "";
//     this.userAgent = process.env.REDDIT_USER_AGENT || "rslashminer/0.1";
//   }

//   private async authenticate(): Promise<string> {
//     // Return cached token if valid
//     if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
//       return this.accessToken;
//     }

//     const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

//     const response = await fetch("https://www.reddit.com/api/v1/access_token", {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${credentials}`,
//         "User-Agent": this.userAgent,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: new URLSearchParams({
//         grant_type: "password",
//         username: this.username,
//         password: this.password,
//       }),
//     });

//     const data = await response.json();
//     if (!data.access_token) {
//       throw new Error("Failed to authenticate with Reddit API");
//     }

//     this.accessToken = data.access_token;
//     this.tokenExpiry = Date.now() + data.expires_in * 1000;
//     return this.accessToken;
//   }

//   private async fetchWithAuth(url: string): Promise<any> {
//     const token = await this.authenticate();

//     const res = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "User-Agent": this.userAgent,
//       },
//     });

//     // Retry once if unauthorized
//     if (res.status === 401) {
//       this.accessToken = ""; // force refresh
//       return this.fetchWithAuth(url);
//     }

//     return res.json();
//   }

//   async searchPosts(keyword: string): Promise<ProcessedContent[]> {
//     const url = `https://oauth.reddit.com/search?q=${encodeURIComponent(keyword)}&sort=new&limit=5&type=link`;
//     const data = await this.fetchWithAuth(url);
//     const posts = data.data?.children?.map((c: any) => c.data) ?? [];

//     return posts.map((p: any) => ({
//       id: p.id,
//       content: p.selftext || p.title,
//       title: p.title,
//       url: `https://reddit.com${p.permalink}`,
//       platform: "reddit",
//       author: p.author,
//       createdAt: new Date(p.created_utc * 1000),
//       metadata: p,
//     }));
//   }

//   async searchPostsBySubreddit(subreddit: string, keyword: string): Promise<ProcessedContent[]> {
//     const url = `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(keyword)}&restrict_sr=1&sort=new&limit=5`;
//     const data = await this.fetchWithAuth(url);
//     const posts = data.data?.children?.map((c: any) => c.data) ?? [];

//     return posts.map((p: any) => ({
//       id: p.id,
//       content: p.selftext || p.title,
//       title: p.title,
//       url: `https://reddit.com${p.permalink}`,
//       platform: "reddit",
//       author: p.author,
//       createdAt: new Date(p.created_utc * 1000),
//       metadata: p,
//     }));
//   }

//   async searchComments(postId: string): Promise<ProcessedContent[]> {
//     const url = `https://oauth.reddit.com/comments/${postId}?limit=5`;
//     const data = await this.fetchWithAuth(url);
//     const comments = data[1]?.data?.children?.map((c: any) => c.data) ?? [];

//     return comments.map((c: any) => ({
//       id: c.id,
//       content: c.body,
//       title: "",
//       url: `https://reddit.com${c.permalink}`,
//       platform: "reddit",
//       author: c.author,
//       createdAt: new Date(c.created_utc * 1000),
//       metadata: c,
//     }));
//   }
// }
// lib/platforms/reddit.ts ---- With scraping fallback
import { ProcessedContent } from "@/lib/constants/types";
import { RedditScraper } from "@/lib/scrapers/reddit-scraper";

export class Reddit {
  private accessToken: string = "";
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;
  private username: string;
  private password: string;
  private userAgent: string;
  private scraper: RedditScraper;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || "";
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || "";
    this.username = process.env.REDDIT_USERNAME || "";
    this.password = process.env.REDDIT_PASSWORD || "";
    this.userAgent = process.env.REDDIT_USER_AGENT || "rslashminer/0.1";
    this.scraper = new RedditScraper();
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent": this.userAgent,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: this.username,
        password: this.password,
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("Failed to authenticate with Reddit API");
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  private async fetchWithAuth(url: string): Promise<any> {
    const token = await this.authenticate();

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": this.userAgent,
      },
    });

    if (res.status === 401) {
      this.accessToken = "";
      return this.fetchWithAuth(url);
    }

    return res.json();
  }

  async searchPosts(keyword: string): Promise<ProcessedContent[]> {
    try {
      // Try API first
      const query = `title:"${keyword}" OR selftext:"${keyword}"`;
      const url = `https://oauth.reddit.com/search?q=${encodeURIComponent(
        query
      )}&sort=new&limit=5&type=link`;
      const data = await this.fetchWithAuth(url);
      const posts = data.data?.children?.map((c: any) => c.data) ?? [];

      return posts.map((p: any) => ({
        id: p.id,
        content: p.selftext,
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        platform: "reddit",
        author: p.author,
        createdAt: new Date(p.created_utc * 1000),
        metadata: p,
      }));
    } catch (error) {
      // Fallback to scraping if API fails
      console.warn("Reddit API failed, falling back to scraping", error);
      return await this.scraper.scrapeSearchPosts(keyword);
    }
  }

  async searchPostsBySubreddit(
    subreddit: string,
    keyword: string
  ): Promise<ProcessedContent[]> {
    try {
      // Try API first
      const query = `title:"${keyword}" OR selftext:"${keyword}"`;
      
      const url = `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(
        query
      )}&restrict_sr=1&sort=new&limit=5`;
      const data = await this.fetchWithAuth(url);
      const posts = data.data?.children?.map((c: any) => c.data) ?? [];

      return posts.map((p: any) => ({
        id: p.id,
        content: p.selftext,
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        platform: "reddit",
        author: p.author,
        createdAt: new Date(p.created_utc * 1000),
        metadata: p,
      }));
    } catch (error) {
      // Fallback to scraping if API fails
      console.warn(
        "Reddit API failed for subreddit search, falling back to scraping",
        error
      );
      return await this.scraper.scrapeSubreddit(subreddit, keyword);
    }
  }

  async searchComments(postId: string): Promise<ProcessedContent[]> {
    const url = `https://oauth.reddit.com/comments/${postId}?limit=5`;
    const data = await this.fetchWithAuth(url);
    const comments = data[1]?.data?.children?.map((c: any) => c.data) ?? [];

    return comments.map((c: any) => ({
      id: c.id,
      content: c.body,
      title: "",
      url: `https://reddit.com${c.permalink}`,
      platform: "reddit",
      author: c.author,
      createdAt: new Date(c.created_utc * 1000),
      metadata: c,
    }));
  }

  async cleanup(): Promise<void> {
    await this.scraper.cleanup();
  }
}
