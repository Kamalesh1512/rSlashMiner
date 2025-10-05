// utils/getAccessToken.ts
import { AtpAgent, ComAtprotoServerCreateSession } from "@atproto/api";

interface TokenData {
  token: string;
  expiresAt: number; // timestamp in ms
}

const tokenStore: Record<string, TokenData> = {};

/**
 * Returns a valid access token for a platform.
 * Automatically refreshes if expired or missing.
 */
export async function getAccessToken(
  platform: "reddit" | "twitter" | "bluesky" | "linkedin"
): Promise<string> {
  const now = Date.now();

  // Return cached token if valid
  if (tokenStore[platform] && tokenStore[platform].expiresAt > now) {
    return tokenStore[platform].token;
  }

  let token: string;
  let expiresIn: number;

  switch (platform) {
    case "reddit": {
      const credentials = Buffer.from(
        `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
      ).toString("base64");

      const redditRes = await fetch("https://www.reddit.com/api/v1/access_token", {
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

      const redditData = await redditRes.json();
      if (!redditData.access_token) throw new Error("Reddit token fetch failed");

      token = redditData.access_token;
      expiresIn = redditData.expires_in * 1000;
      break;
    }

    case "twitter": {
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        throw new Error("Missing Twitter API Key/Secret");
      }

      const twitterCreds = Buffer.from(
        `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`
      ).toString("base64");

      const twitterRes = await fetch("https://api.twitter.com/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${twitterCreds}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
      });

      const twitterData = await twitterRes.json();
      if (!twitterData.access_token) throw new Error("Twitter token fetch failed");

      token = twitterData.access_token;
      expiresIn = 3600 * 1000; // 1 hour
      break;
    }

    case "bluesky": {
      if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_PASSWORD) {
        throw new Error("Missing Bluesky credentials");
      }

      const agent = new AtpAgent({ service: "https://bsky.social" });

      // ⚡ Official login
      const session: ComAtprotoServerCreateSession.Response = await agent.login({
        identifier: process.env.BLUESKY_IDENTIFIER,
        password: process.env.BLUESKY_PASSWORD,
      });

      if (!session.data.accessJwt) throw new Error("Bluesky token fetch failed");

      token = session.data.accessJwt;
      expiresIn = 60 * 60 * 1000; // ~1 hour
      break;
    }

    case "linkedin": {
      if (
        !process.env.LINKEDIN_CLIENT_ID ||
        !process.env.LINKEDIN_CLIENT_SECRET ||
        !process.env.LINKEDIN_REFRESH_TOKEN
      ) {
        throw new Error("Missing LinkedIn credentials");
      }

      const linkedinRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: process.env.LINKEDIN_REFRESH_TOKEN!,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      });

      const linkedinData = await linkedinRes.json();
      if (!linkedinData.access_token) throw new Error("LinkedIn token fetch failed");

      token = linkedinData.access_token;
      expiresIn = linkedinData.expires_in * 1000;
      break;
    }

    default:
      throw new Error(`Platform ${platform} not supported`);
  }

  // Cache token
  tokenStore[platform] = {
    token,
    expiresAt: now + expiresIn - 10_000, // 10s buffer
  };

  return token;
}
