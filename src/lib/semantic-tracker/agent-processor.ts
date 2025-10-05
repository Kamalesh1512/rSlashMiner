// lib/semantic-tracker/agent-processor.ts
import { db } from "@/lib/db";
import {
  agents,
  agentKeywords,
  agentPlatformConfigs,
  monitoringResults,
  users,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SemanticTracker } from "./semantic-tracker";
import { ProcessedContent, SemanticMatch } from "../constants/types";
import { PlatformFetcher } from "./platform-fetcher";

export class AgentProcessor {
  private semanticTracker: SemanticTracker;
  private initialized = false;

  constructor() {
    this.semanticTracker = new SemanticTracker();
  }

  async processAgent(agentId: string): Promise<void> {
    console.log(`Processing agent: ${agentId}`);

    // Get agent configuration
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (agent.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agentConfig = agent[0];

    // Get keywords
    const keywordRecords = await db
      .select()
      .from(agentKeywords)
      .where(eq(agentKeywords.agentId, agentId));

    const keywords = keywordRecords.flatMap((record) => {
      try {
        return JSON.parse(record.keyword);
      } catch {
        return [record.keyword];
      }
    });

    const excludedKeywords = keywordRecords.flatMap((record) => {
      try {
        return record.excludedKeywords
          ? JSON.parse(record.excludedKeywords)
          : [];
      } catch {
        return [];
      }
    });

    // Initialize semantic tracker with keywords
    if (!this.initialized) {
      await this.semanticTracker.initializeKeywords(keywords);
      this.initialized = true;
    }

    const config = {
      id: agentId,
      keywords,
      excludedKeywords,
      platforms: agentConfig.platforms as string[],
      semanticThreshold: 0.75,
      intentAnalysis: true,
    };

    // Get platform configs
    const platformConfigs = await db
      .select()
      .from(agentPlatformConfigs)
      .where(eq(agentPlatformConfigs.agentId, agentId));

    // Process all platforms together
    await this.processPlatform(agentConfig.userId, config, platformConfigs);

    // Update agent execution stats
    await db
      .update(agents)
      .set({
        lastExecutedAt: new Date(),
        executionCount: agentConfig.executionCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));
  }

  private async processPlatform(
    userId: string,
    config: any,
    platformConfigs: any[]
  ): Promise<void> {
    console.log(`Processing platforms: ${config.platforms.join(", ")}`);

    // 1. Fetch all contents
    const contents = await this.fetchPlatformContent(
      config.platforms,
      config.keywords,
      platformConfigs
    );
    console.log("Number of Content Found from All platforms", contents.length);

    if (!contents.length) {
      console.log("No new content found.");
      return;
    }

    // 2. Get already processed URLs
    const existingUrls = new Set(
      (
        await db
          .select({ url: monitoringResults.url })
          .from(monitoringResults)
          .where(eq(monitoringResults.agentId, config.id))
      ).map((r) => r.url)
    );

    // 3. Filter new content
    const newContents = contents.filter((c) => !existingUrls.has(c.url));
    if (!newContents.length) {
      console.log("No new unprocessed content.");
      return;
    }

    let totalLeadsGenerated = 0;
    let qualifiedLeadsGenerated = 0;
    const CONCURRENCY = 5;

    // 4. Process content
    const processContent = async (content: any) => {
      try {
        const match = await this.semanticTracker.analyzeContent(
          content,
          config
        );
        if (!match) return;

        const isQualifiedLead = this.qualifyLead(match);
        const leadScore = this.calculateLeadScore(match);

        const inserted = await db
          .insert(monitoringResults)
          .values({
            agentId: config.id,
            userId,
            platform: content.platform as any,
            platformPostId: content.id,
            title: content.title || "",
            content: content.content,
            url: content.url,
            author: content.author,
            authorHandle: content.metadata.authorHandle || "",
            community: content.metadata.community || "",
            relevanceScore: Math.round(match.score * 100),
            sentimentScore: this.getSentimentScore(match.intent),
            matchedKeywords: match.matchedKeywords.join(", "),
            semanticScore: match.matchType === "semantic" ? match.score : null,
            topicCategories: this.extractTopicCategories(content),
            isQualifiedLead,
            leadScore,
            buyingIntent: this.calculateBuyingIntent(match),
            postCreatedAt: new Date(content.createdAt),
            discoveredAt: new Date(),
            metadata: content.metadata,
          })
          .onConflictDoNothing({
            target: [monitoringResults.agentId, monitoringResults.url],
          })
          .returning({ inserted: monitoringResults.id });

        // count only if inserted successfully (not duplicate)
        if (inserted.length > 0) {
          totalLeadsGenerated++;
          if (isQualifiedLead) qualifiedLeadsGenerated++;
        }
      } catch (err) {
        console.error(`Error processing content ${content.url}:`, err);
      }
    };

    // 5. Run in concurrency batches
    for (let i = 0; i < newContents.length; i += CONCURRENCY) {
      const batch = newContents.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((c) => processContent(c)));
    }

    console.log(
      `Generated ${totalLeadsGenerated} total leads (${qualifiedLeadsGenerated} qualified) from all platforms`
    );

    // 6. Update user monthlyLeadsUsed (with total leads count)
    if (totalLeadsGenerated > 0) {
      await db
        .update(users)
        .set({
          monthlyLeadsUsed: sql`${users.monthlyLeadsUsed} + ${totalLeadsGenerated}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `Updated monthlyLeadsUsed (+${totalLeadsGenerated}) for user ${userId}`
      );
    }
  }

  private async fetchPlatformContent(
    platforms: string[],
    keywords: string[],
    platformConfigs: any[]
  ): Promise<ProcessedContent[]> {
    const allContent: ProcessedContent[] = [];
    const platformFetcher = new PlatformFetcher();

    for (const platform of platforms) {
      const { config } = platformConfigs.find((c) => c.platform === platform);
      // Only skip if explicitly disabled
      if (config && config.isEnabled === false) {
        console.warn(`⚠️ Platform disabled: ${platform}`);
        continue;
      }

      try {
        console.log(`Fetching content from ${platform}...`);
        const content = await platformFetcher.fetch(platform, keywords, config);
        allContent.push(...content);
      } catch (error) {
        console.error(`Error fetching from ${platform}:`, error);
      }
    }
    return allContent;
  }

  private qualifyLead(match: SemanticMatch): boolean {
    // Lead qualification logic
    const hasHighScore = match.score >= 0.8;
    const hasPositiveIntent = match.intent === "positive";
    const hasHighConfidence = match.confidence >= 0.7;

    return hasHighScore && hasPositiveIntent && hasHighConfidence;
  }

  private calculateLeadScore(match: SemanticMatch): number {
    let score = match.score * 40; // Base score (0-40)

    // Intent bonus
    if (match.intent === "positive") score += 30;
    else if (match.intent === "neutral") score += 15;

    // Confidence bonus
    score += match.confidence * 20;

    // Match type bonus
    if (match.matchType === "exact") score += 10;
    else if (match.matchType === "hybrid") score += 5;

    return Math.min(100, Math.round(score));
  }

  private getSentimentScore(intent: string): number {
    switch (intent) {
      case "positive":
        return 1;
      case "negative":
        return -1;
      default:
        return 0;
    }
  }

  private calculateBuyingIntent(match: SemanticMatch): number {
    // Simple buying intent calculation
    const intentBonus = match.intent === "positive" ? 0.3 : 0;
    const scoreBonus = match.score * 0.4;
    const confidenceBonus = match.confidence * 0.3;

    return Math.min(1, intentBonus + scoreBonus + confidenceBonus);
  }

  private extractTopicCategories(content: ProcessedContent): string[] {
    // Simple topic extraction based on content
    const categories: string[] = [];
    const text = content.content.toLowerCase();

    if (text.includes("project management") || text.includes("productivity")) {
      categories.push("productivity");
    }
    if (text.includes("alternative") || text.includes("replace")) {
      categories.push("alternatives");
    }
    if (text.includes("recommendation") || text.includes("suggest")) {
      categories.push("recommendations");
    }

    return categories;
  }
}
