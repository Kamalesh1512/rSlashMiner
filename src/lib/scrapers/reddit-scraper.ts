// lib/scrapers/reddit-scraper.ts
import { BaseScraper } from "./scraper";
import { ProcessedContent } from "@/lib/constants/types";
import * as cheerio from "cheerio";

export class RedditScraper extends BaseScraper {
  /**
   * Scrape Reddit posts from search results
   */
  async scrapeSearchPosts(keyword: string, limit = 5): Promise<ProcessedContent[]> {
    const url = `https://old.reddit.com/search?q=${encodeURIComponent(keyword)}&sort=new&limit=${limit}`;

    // Check robots.txt compliance
    const allowed = await this.checkRobotsTxt("https://old.reddit.com", "/search");
    if (!allowed) {
      this.logger.warn("Scraping not allowed by robots.txt", { url });
      return [];
    }

    try {
      const html = await this.fetchHTML(url);
      return this.parseSearchResults(html);
    } catch (error: any) {
      this.logger.error("Failed to scrape Reddit search", { keyword, error: error.message });
      return [];
    }
  }

  /**
   * Scrape posts from a specific subreddit
   */
  async scrapeSubreddit(subreddit: string, keyword: string, limit = 5): Promise<ProcessedContent[]> {
    const url = `https://old.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(
      keyword
    )}&restrict_sr=1&sort=new&limit=${limit}`;

    const allowed = await this.checkRobotsTxt("https://old.reddit.com", `/r/${subreddit}/search`);
    if (!allowed) {
      this.logger.warn("Scraping not allowed by robots.txt", { url });
      return [];
    }

    try {
      const html = await this.fetchHTML(url);
      return this.parseSearchResults(html);
    } catch (error: any) {
      this.logger.error("Failed to scrape subreddit", { subreddit, keyword, error: error.message });
      return [];
    }
  }

  /**
   * Parse Reddit search results HTML
   */
  private parseSearchResults(html: string): ProcessedContent[] {
    const $ = cheerio.load(html);
    const posts: ProcessedContent[] = [];

    $(".thing[data-type='link']").each((_, element) => {
      try {
        const $post = $(element);
        const id = $post.attr("data-fullname")?.replace("t3_", "") || "";
        const title = $post.find(".title > .title").text().trim();
        const author = $post.attr("data-author") || "unknown";
        const permalink = $post.attr("data-permalink") || "";
        const url = `https://reddit.com${permalink}`;
        const createdUtc = parseInt($post.attr("data-timestamp") || "0") * 1000;

        posts.push({
          id,
          title,
          content: title, // Old reddit doesn't show selftext in search
          url,
          platform: "reddit",
          author,
          createdAt: new Date(createdUtc),
          metadata: {
            score: parseInt($post.attr("data-score") || "0"),
            numComments: parseInt($post.attr("data-comments-count") || "0"),
          },
        });
      } catch (error: any) {
        this.logger.warn("Failed to parse Reddit post", { error: error.message });
      }
    });

    this.logger.info("Parsed Reddit search results", { count: posts.length });
    return posts;
  }
}