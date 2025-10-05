// lib/semantic-tracker/semantic-tracker.ts
import { EmbeddingService } from "./embedding-service";
import { KeywordMatcher } from "./keyword-matcher";
import { IntentClassifier } from "./intent-classifier";
import {
  AgentConfig,
  ProcessedContent,
  SemanticMatch,
} from "../constants/types";

export class SemanticTracker {
  private embeddingService: EmbeddingService;
  private intentClassifier: IntentClassifier;
  private keywordEmbeddings: Map<string, number[]> = new Map();

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.intentClassifier = new IntentClassifier();
  }

  async initializeKeywords(keywords: string[]): Promise<void> {
    console.log("Initializing keyword embeddings...");

    const embeddings = await this.embeddingService.getBatchEmbeddings(keywords);

    for (let i = 0; i < keywords.length; i++) {
      this.keywordEmbeddings.set(keywords[i].toLowerCase(), embeddings[i]);
    }

    console.log(`Initialized ${keywords.length} keyword embeddings`);
  }

  async analyzeContent(
    content: ProcessedContent,
    config: AgentConfig,
    precomputedEmbedding?: number[] // allow batching
  ): Promise<SemanticMatch | null> {
    // Step 1: Normalize text once
    const text = `${content.title || ""} ${content.content || ""}`
      .trim()
      .toLowerCase();

    // Step 2: Fast exact keyword matching
    const keywordMatcher = new KeywordMatcher(
      config.keywords,
      config.excludedKeywords
    );
    const exactMatches = keywordMatcher.findExactMatches(text);
    console.log("Found Exact Match:",exactMatches)
    // Step 3: Semantic similarity search (only if needed)
    let semanticMatches: string[] = [];
    let maxSemanticScore = 0;

    if (this.keywordEmbeddings.size > 0) {
      // Use precomputed embedding if passed in (from batch mode)
      const contentEmbedding =
        precomputedEmbedding ||
        (await this.embeddingService.getEmbedding(text));

      for (const [keyword, keywordEmbedding] of this.keywordEmbeddings) {
        const similarity = this.embeddingService.cosineSimilarity(
          contentEmbedding,
          keywordEmbedding
        );
        if (similarity >= config.semanticThreshold) {
          semanticMatches.push(keyword);
          if (similarity > maxSemanticScore) {
            maxSemanticScore = similarity;
          }
        }
      }
    }

    // Step 4: Determine if we have a match
    const hasExactMatch = exactMatches.length > 0;
    const hasSemanticMatch = semanticMatches.length > 0;
    if (!hasExactMatch && !hasSemanticMatch) {
      return null;
    }

    // Step 5: Classify intent (optional)
    let intent: "positive" | "negative" | "neutral" = "neutral";
    let confidence = 0.5;
    if (config.intentAnalysis) {
      const intentResult = await this.intentClassifier.classifyIntent(text, [
        ...exactMatches,
        ...semanticMatches,
      ]);
      intent = intentResult.intent;
      confidence = intentResult.confidence;
    }

    // Step 6: Calculate score
    const overallScore = hasExactMatch ? 1.0 : maxSemanticScore;

    // Step 7: Match type
    let matchType: "exact" | "semantic" | "hybrid";
    if (hasExactMatch && hasSemanticMatch) matchType = "hybrid";
    else if (hasExactMatch) matchType = "exact";
    else matchType = "semantic";

    return {
      text: text.substring(0, 500), // safe truncate
      score: overallScore,
      matchType,
      matchedKeywords: [...new Set([...exactMatches, ...semanticMatches])],
      semanticVariants: semanticMatches,
      intent,
      confidence,
      context: this.extractContext(text, [...exactMatches, ...semanticMatches]),
    };
  }

  private extractContext(text: string, keywords: string[]): string {
    // Extract surrounding context for the first matched keyword
    if (keywords.length === 0) return text.substring(0, 200);

    const keyword = keywords[0];
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());

    if (index === -1) return text.substring(0, 200);

    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + keyword.length + 100);

    return text.substring(start, end);
  }
}
