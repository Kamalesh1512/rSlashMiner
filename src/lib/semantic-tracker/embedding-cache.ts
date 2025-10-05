// lib/semantic-tracker/embedding-cache.ts
import { db } from "@/lib/db";
import Redis from "ioredis";
import { embeddings } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { EmbeddingService } from "./embedding-service";

export class EmbeddingCache {
  private redis: Redis;
  private embeddingService: EmbeddingService;
  private readonly CACHE_TTL = 86400 * 7; // 7 days

  constructor(embeddingService: EmbeddingService) {
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    this.embeddingService = embeddingService; // injected instead of creating new
  }

  private cacheKey(postId: string): string {
    return `post-embedding:${postId}`;
  }

  /**
   * Get embedding for a post from cache/DB, compute if missing.
   */
  async getOrCreate(
    postId: string,
    text: string,
    platform: string
  ): Promise<number[]> {
    const key = this.cacheKey(postId);

    // 1. Check Redis
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    // 2. Check DB
    const dbResult = await db
      .select()
      .from(embeddings)
      .where(
        and(eq(embeddings.postId, postId), eq(embeddings.platform, platform))
      )
      .limit(1);

    if (dbResult.length > 0) {
      const emb = dbResult[0].vector as number[];
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(emb));
      return emb;
    }

    // 3. Compute embedding via Gemini (through injected service)
    const embedding = await this.embeddingService.getEmbedding(text);

    // 4. Save in DB + Redis
    await db.insert(embeddings).values({
      postId,
      platform,
      content: text,
      vector: embedding,
      createdAt: new Date(),
    });

    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(embedding));

    return embedding;
  }
}
