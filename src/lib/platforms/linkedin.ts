// lib/platforms/linkedin.ts
import { ProcessedContent } from "@/lib/constants/types";

export class LinkedIn {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || "";
  }

  async searchPosts(keyword: string): Promise<ProcessedContent[]> {
    const url = `https://api.linkedin.com/v2/posts?q=keyword&keywords=${encodeURIComponent(keyword)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!res.ok) throw new Error(`LinkedIn API error: ${res.status}`);
    const data = await res.json();

    const posts = data.elements ?? [];
    return posts.map((p: any) => ({
      id: p.id,
      content: p.commentary || p.specificContent?.text || "",
      title: p.specificContent?.title || "",
      url: `https://linkedin.com/feed/update/${p.id}`,
      platform: "linkedin",
      author: p.author || "unknown",
      createdAt: new Date(p.created?.time || Date.now()),
      metadata: p,
    }));
  }

  async searchComments(postId: string): Promise<ProcessedContent[]> {
    // LinkedIn API is restricted, needs partner access
    return [];
  }
}
