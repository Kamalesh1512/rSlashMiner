// lib/scrapers/twitter-scraper.ts
import { BaseScraper } from "./scraper";
import { ProcessedContent } from "@/lib/constants/types";
import * as cheerio from "cheerio";

export class TwitterScraper extends BaseScraper {
  /**
   * Scrape Twitter/X search results using Nitter (privacy-respecting Twitter frontend)
   * Note: This is more reliable than scraping Twitter directly due to rate limits
   */
  async scrapeSearchPosts(keyword: string, limit = 20): Promise<ProcessedContent[]> {
    // Use Nitter instance (public Twitter frontend)
    const nitterInstance = "nitter.net"; // Can be configured via env
    const url = `https://${nitterInstance}/search?q=${encodeURIComponent(keyword)}&f=tweets`;

    try {
      // Nitter doesn't require JS rendering
      const html = await this.fetchHTML(url);
      return this.parseNitterResults(html, limit);
    } catch (error: any) {
      this.logger.error("Failed to scrape Twitter via Nitter", { keyword, error: error.message });
      return [];
    }
  }

  /**
   * Parse Nitter search results
   */
  private parseNitterResults(html: string, limit: number): ProcessedContent[] {
    const $ = cheerio.load(html);
    const posts: ProcessedContent[] = [];

    $(".timeline-item").slice(0, limit).each((_, element) => {
      try {
        const $tweet = $(element);
        const tweetLink = $tweet.find(".tweet-link").attr("href") || "";
        const tweetId = tweetLink.split("/").pop()?.replace("#m", "") || "";
        const author = $tweet.find(".username").text().trim().replace("@", "");
        const content = $tweet.find(".tweet-content").text().trim();
        const timeStr = $tweet.find(".tweet-date a").attr("title") || "";

        posts.push({
          id: tweetId,
          title: "",
          content,
          url: `https://twitter.com/${author}/status/${tweetId}`,
          platform: "twitter",
          author,
          createdAt: timeStr ? new Date(timeStr) : new Date(),
          metadata: {
            replies: this.parseMetric($tweet.find(".icon-comment").parent().text()),
            retweets: this.parseMetric($tweet.find(".icon-retweet").parent().text()),
            likes: this.parseMetric($tweet.find(".icon-heart").parent().text()),
          },
        });
      } catch (error: any) {
        this.logger.warn("Failed to parse Twitter post", { error: error.message });
      }
    });

    this.logger.info("Parsed Twitter search results", { count: posts.length });
    return posts;
  }

  private parseMetric(text: string): number {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, "")) : 0;
  }
}