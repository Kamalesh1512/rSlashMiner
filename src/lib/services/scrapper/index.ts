import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import redditService from "../reddit";
import { HttpsProxyAgent } from "https-proxy-agent";

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  created_utc: number;
  num_comments: number;
}

puppeteer.use(StealthPlugin());

export class RedditScraper {
  private queryCache = new Map<string, string[]>();
  private proxyHost = "gate.decodo.com";
  private proxyUsername = process.env.SMARTPROXY_USER!;
  private proxyPassword = process.env.SMARTPROXY_PASSWORD!;
  private proxyPortStart = 10001;
  private proxyPortEnd = 10010;

  private getRandomUserAgent(): string {
    const userAgents = [
      // Desktop Chrome
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      // Firefox
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_0; rv:124.0) Gecko/20100101 Firefox/124.0",
      // Edge
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private getRotatedProxy(): string {
    const portRange = this.proxyPortEnd - this.proxyPortStart + 1;
    const randomPort =
      this.proxyPortStart + Math.floor(Math.random() * portRange);
    const proxyUrl = `https://${this.proxyHost}:${randomPort}`;
    return proxyUrl;
  }

  private getBrowserConfig() {
    const isProduction = process.env.NODE_ENV === "production";

    const proxy = this.getRotatedProxy();
    console.log("Proxy:",proxy)

    return {
      executablePath: isProduction
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : executablePath(),
      headless: true,
      args: [
        `--proxy-server=${proxy}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--user-data-dir=/tmp",
      ],
    };
  }
  private async getRedditUrlsFromGoogle(query: string): Promise<string[]> {
    if (this.queryCache.has(query)) {
      console.log("✅ Cache hit for:", query);
      return this.queryCache.get(query)!;
    }

    const browser = await puppeteer.launch(this.getBrowserConfig());
    const page = await browser.newPage();

    try {
      await page.authenticate({
        username: this.proxyUsername,
        password: this.proxyPassword,
      });

      await page.setUserAgent(this.getRandomUserAgent());

      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const blockedTypes = ["image", "stylesheet", "font", "media"];
        if (blockedTypes.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      const uniqueLinks = new Set<string>();

      for (let start = 0; start < 50; start += 10) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
          `site:reddit.com inurl:comments ${query}`
        )}&start=${start}`;

        await page.goto(searchUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        const html = await page.content();
        if (html.includes("Our systems have detected unusual traffic")) {
          console.error("⚠️ Google CAPTCHA detected at page", start / 10 + 1);
          break;
        }

        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) =>
              /^https?:\/\/(www\.)?reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/.test(
                href
              )
            );
        });

        links.map((url) => uniqueLinks.add(url.split("?")[0]));

        // Wait before next page to avoid bot detection
        await new Promise((res) => setTimeout(res, 3000));
      }

      const result = Array.from(uniqueLinks);
      this.queryCache.set(query, result); // Cache result
      console.log("🔎 Scraped", result.length, "Reddit post links");
      return result;
    } catch (err) {
      console.error("[RedditScraper] Google search failed:", err);
      return [];
    } finally {
      await browser.close();
    }
  }

  public async getRedditPostUrls(query: string): Promise<RedditPost[]> {
    const seen = new Set<string>();
    const posts: RedditPost[] = [];

    const urls = await this.getRedditUrlsFromGoogle(query);

    for (const url of urls) {
      if (seen.has(url)) continue;
      seen.add(url);

      try {
        const post = await redditService.getPostByUrl(url);
        if (post) posts.push(post);
      } catch (err) {
        console.warn(`[RedditScraper] Failed to fetch post: ${url}`, err);
      }
    }

    return posts;
  }
}

const redditScrapper = new RedditScraper();
export default redditScrapper;
