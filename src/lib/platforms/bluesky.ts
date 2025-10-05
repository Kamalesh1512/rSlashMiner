// @/lib/platform/bluesky.ts
import {
  AtpAgent,
  AppBskyFeedDefs,
  ComAtprotoServerCreateSession,
} from "@atproto/api";
import { ProcessedContent } from "@/lib/constants/types";

export class Bluesky {
  private agent: AtpAgent;
  private session: ComAtprotoServerCreateSession.Response | null = null;

  private identifier: string;
  private password: string;

  constructor() {
    if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_PASSWORD) {
      throw new Error("Missing Bluesky credentials in environment variables");
    }

    this.identifier = process.env.BLUESKY_IDENTIFIER;
    this.password = process.env.BLUESKY_PASSWORD;
    this.agent = new AtpAgent({ service: "https://bsky.social" });
  }

  /** Ensure authentication, refresh token if expired */
  private async authenticate(): Promise<string> {
    if (this.session?.data.accessJwt) {
      return this.session.data.accessJwt;
    }

    this.session = await this.agent.login({
      identifier: this.identifier,
      password: this.password,
    });

    return this.session.data.accessJwt;
  }

  /** Search posts by keyword and normalize */
  async searchPosts(query: string, limit = 20): Promise<ProcessedContent[]> {
    await this.authenticate();

    const response = await this.agent.call("app.bsky.feed.searchPosts", {
      q: query,
      limit,
    });

    const posts: AppBskyFeedDefs.PostView[] = response.data.posts ?? [];

    return posts.map((post) => {
      const record = post.record as any;
      return {
        id: post.uri,
        title:record.title,
        content: record?.text ?? "",
        url: `https://bsky.app/profile/${post.author?.handle}/post/${post.uri
          .split("/")
          .pop()}`,
        platform: "bluesky",
        author: post.author?.handle ?? "unknown",
        createdAt: record?.createdAt ?? undefined,
        metadata: {
          likeCount: post.likeCount ?? 0,
          replyCount: post.replyCount ?? 0,
          repostCount: post.repostCount ?? 0,
        },
      } satisfies ProcessedContent;
    });
  }
}
