// lib/semantic-tracker/embedding-service.ts
import { GoogleGenAI } from "@google/genai";
import Redis from "ioredis";
import { EmbeddingCache } from "./embedding-cache";

export class EmbeddingService {
  private ai: GoogleGenAI;
  private redis: Redis;
  private embeddingCache: EmbeddingCache;
  private readonly CACHE_TTL = 86400 * 7; // 7 days

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

    // ✅ inject this service into cache (breaks recursion)
    this.embeddingCache = new EmbeddingCache(this);
  }

  /**
   * Expose the cache safely
   */
  get cache(): EmbeddingCache {
    return this.embeddingCache;
  }

  /**
   * Get a single embedding with Redis caching (for arbitrary text)
   */
  async getEmbedding(text: string): Promise<number[]> {
    const normalized = text.toLowerCase().trim();
    const cacheKey = `embedding:${Buffer.from(normalized).toString("base64")}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: normalized,
      });

      if (!response.embeddings?.[0]) {
        throw new Error("No embedding returned from API");
      }

      const embedding = response.embeddings[0].values!;
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(embedding)
      );
      return embedding;
    } catch (err) {
      console.error("Error generating embedding:", err);
      throw err;
    }
  }

  /**
   * Get embedding for a post with Redis + DB caching
   */
  async getPostEmbedding(postId: string, text: string, platform: string) {
    return this.embeddingCache.getOrCreate(postId, text, platform);
  }

  /**
   * Get embeddings for multiple texts in one call (manual batching)
   */
  async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const uncached: string[] = [];
    const indexMap = new Map<string, number>();

    // check Redis cache first
    for (let i = 0; i < texts.length; i++) {
      const txt = texts[i].toLowerCase().trim();
      const key = `embedding:${Buffer.from(txt).toString("base64")}`;
      const cached = await this.redis.get(key);
      if (cached) {
        embeddings[i] = JSON.parse(cached);
      } else {
        uncached.push(txt);
        indexMap.set(txt, i);
      }
    }

    if (uncached.length > 0) {
      try {
        for (const txt of uncached) {
          const response = await this.ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: txt,
          });

          const emb = response.embeddings?.[0]?.values;
          if (!emb) {
            throw new Error("No embedding returned from API");
          }

          const origIndex = indexMap.get(txt)!;
          embeddings[origIndex] = emb;

          const cacheKey = `embedding:${Buffer.from(txt).toString("base64")}`;
          await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(emb));
        }
      } catch (err) {
        console.error("Error generating batch embeddings:", err);
        throw err;
      }
    }

    return embeddings;
  }

  /**
   * Utility: cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] ** 2;
      normB += b[i] ** 2;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
