// lib/scrapers/linkedin-scraper.ts
import { BaseScraper } from "./scraper";
import { ProcessedContent } from "@/lib/constants/types";

export class LinkedInScraper extends BaseScraper {
  /**
   * LinkedIn scraping is heavily protected and requires authentication
   * This is a placeholder - not recommended due to ToS violations
   */
  async scrapeSearchPosts(keyword: string): Promise<ProcessedContent[]> {
    this.logger.warn("LinkedIn scraping not recommended - use API or RSS feeds instead");
    return [];
  }
}