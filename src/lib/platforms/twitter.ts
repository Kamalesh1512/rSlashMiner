// // lib/platforms/twitter.ts
// import { ProcessedContent } from "@/lib/constants/types";

// export class Twitter {
//   private apiKey: string;
//   private apiSecret: string;
//   private accessToken: string | null = null;
//   private tokenExpiry: number | null = null; // epoch ms

//   constructor() {
//     this.apiKey = process.env.TWITTER_API_KEY || "";
//     this.apiSecret = process.env.TWITTER_API_SECRET || "";
//   }

//   /**
//    * Authenticate with Twitter API and cache bearer token.
//    */
//   private async authenticate(): Promise<string> {
//     // If cached token is still valid, reuse it
//     if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
//       return this.accessToken;
//     }

//     const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64");

//     const response = await fetch("https://api.twitter.com/oauth2/token", {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${credentials}`,
//         "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
//       },
//       body: "grant_type=client_credentials",
//     });

//     const data = await response.json();

//     if (!response.ok || !data.access_token) {
//       throw new Error(`Failed to authenticate with Twitter API: ${JSON.stringify(data)}`);
//     }

//     this.accessToken = data.access_token;
//     // Twitter tokens from client_credentials flow don’t really expire quickly,
//     // but we can safely cache for 1 hour.
//     this.tokenExpiry = Date.now() + 60 * 60 * 1000;

//     return this.accessToken!;
//   }

//   /**
//    * Search recent tweets by keyword.
//    */
//   async searchPosts(keyword: string): Promise<ProcessedContent[]> {
//     const token = await this.authenticate();

//     const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
//       keyword
//     )}&tweet.fields=author_id,created_at,public_metrics&expansions=author_id&max_results=20`;

//     const res = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!res.ok) throw new Error(`Twitter API error: ${res.status}`);
//     const data = await res.json();

//     const tweets = data.data ?? [];
//     const users = data.includes?.users ?? [];

//     return tweets.map((t: any) => {
//       const author = users.find((u: any) => u.id === t.author_id);
//       return {
//         id: t.id,
//         content: t.text,
//         title: "",
//         url: `https://twitter.com/${author?.username}/status/${t.id}`,
//         platform: "twitter",
//         author: author?.username || "unknown",
//         createdAt: new Date(t.created_at),
//         metadata: t,
//       };
//     });
//   }

//   async searchComments(tweetId: string): Promise<ProcessedContent[]> {
//     // Twitter API v2 doesn't have direct "replies" endpoint
//     // To implement, you'd need to use `conversation_id` query
//     return [];
//   }
// }

// lib/platforms/twitter.ts - with scraping fallback
import { ProcessedContent } from "@/lib/constants/types";
import { TwitterScraper } from "@/lib/scrapers/twitter-scraper";

export class Twitter {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private scraper: TwitterScraper;

  constructor() {
    this.apiKey = process.env.TWITTER_API_KEY || "";
    this.apiSecret = process.env.TWITTER_API_SECRET || "";
    this.scraper = new TwitterScraper();
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64");

    const response = await fetch("https://api.twitter.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      throw new Error(`Failed to authenticate with Twitter API: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + 60 * 60 * 1000;

    return this.accessToken!;
  }

  async searchPosts(keyword: string): Promise<ProcessedContent[]> {
    try {
      // Try API first
      const token = await this.authenticate();

      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
        keyword
      )}&tweet.fields=author_id,created_at,public_metrics&expansions=author_id&max_results=20`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Twitter API error: ${res.status}`);
      const data = await res.json();

      const tweets = data.data ?? [];
      const users = data.includes?.users ?? [];

      return tweets.map((t: any) => {
        const author = users.find((u: any) => u.id === t.author_id);
        return {
          id: t.id,
          content: t.text,
          title: "",
          url: `https://twitter.com/${author?.username}/status/${t.id}`,
          platform: "twitter",
          author: author?.username || "unknown",
          createdAt: new Date(t.created_at),
          metadata: t,
        };
      });
    } catch (error) {
      // Fallback to scraping via Nitter if API fails
      console.warn("Twitter API failed, falling back to Nitter scraping", error);
      return await this.scraper.scrapeSearchPosts(keyword);
    }
  }

  async searchComments(tweetId: string): Promise<ProcessedContent[]> {
    return [];
  }

  async cleanup(): Promise<void> {
    await this.scraper.cleanup();
  }
}
