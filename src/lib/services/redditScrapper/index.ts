import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import redditService from "../reddit";
import { executablePath } from "puppeteer";

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

export const getBrowserConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production/Docker configuration
    return {
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-client-side-phishing-detection",
        "--disable-crash-reporter",
        "--disable-oopr-debug-crash-dump",
        "--no-crash-upload",
        "--disable-low-res-tiling",
        "--disable-extensions",
        "--disable-default-apps",
        "--mute-audio",
        "--hide-scrollbars",
        "--disable-bundled-ppapi-flash",
        "--disable-plugins-discovery",
        "--disable-prerender-local-predictor",
        "--disable-sync",
        "--disable-webaudio",
        "--user-data-dir=/tmp",
      ],
    };
  }

  // Development configuration - let Puppeteer use its bundled Chrome
  return {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  };
};

/**
 * Use Playwright to scrape Reddit search results
 */

puppeteer.use(StealthPlugin());

export async function getPostUrls(query: string): Promise<string[]> {
  const config = getBrowserConfig();
  const browser = await puppeteer.launch(config);

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
  });

  const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(
    query
  )}&type=link`;

  try {
    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector('a[href*="/comments/"]', { timeout: 15000 });

    const postUrls = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll('a[href*="/comments/"]')
      );
      return Array.from(
        new Set(
          anchors
            .map((a) => a.getAttribute("href"))
            .filter(Boolean)
            .map((href) => `https://www.reddit.com${href!.split("?")[0]}`)
        )
      );
    });

    return postUrls;
  } catch (err) {
    console.error("Error scraping search results with Puppeteer stealth:", err);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Main function to get posts by search query
 */
export async function getAllRedditPosts(query: string): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  const seenUrls = new Set<string>();

  const urls = await getPostUrls(query);

  for (const url of urls) {
    if (seenUrls.has(url)) continue;

    seenUrls.add(url);

    const post = await redditService.getPostByUrl(url); // Use your Playwright-based RedditPost fetcher here
    if (post) posts.push(post);
  }

  return posts;
}
