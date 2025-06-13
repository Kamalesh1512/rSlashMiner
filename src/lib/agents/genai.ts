import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_API_KEY!,
});

//get embedding
export async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

//get similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return dot / (magA * magB);
}

export function smoothRelevance(similarity: number): number {
  // Center sigmoid around 0.65 to keep 80+ relevance scores stricter
  let smoothed = 100 / (1 + Math.exp(-10 * (similarity - 0.6)));

  // Optional mild adjustment for borderline cases
  if (similarity > 0.5 && similarity <= 0.7) {
    smoothed += 5;
  }

  return Math.min(100, Math.round(smoothed));
}
