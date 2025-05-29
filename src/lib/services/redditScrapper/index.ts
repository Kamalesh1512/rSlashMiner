// import { fetch } from "undici";
// import redditService from "../reddit";

// interface RedditPost {
//   id: string;
//   title: string;
//   selftext: string;
//   author: string;
//   subreddit: string;
//   url: string;
//   score: number;
//   created_utc: number;
//   num_comments: number;
// }

// interface RedditPost {
//   id: string;
//   title: string;
//   selftext: string;
//   author: string;
//   subreddit: string;
//   url: string;
//   score: number;
//   created_utc: number;
//   num_comments: number;
// }


// // Scrape search results from Reddit HTML (no JS rendering)
// async function getPostUrls(query: string, after: string | null = null): Promise<string[]> {
//   const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link${after ? `&after=${after}` : ''}`;
//   const res = await fetch(searchUrl, {
//     headers: {
//       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IndieSaaSBot/1.0;'
//     },
//   });

//   console.log("Response From Scrapping",res.statusText)

//   if (!res.ok) throw new Error('Failed to fetch search results');
//   const html = await res.text();

//   // Extract post URLs from HTML using regex
//   const urlRegex = /href="(\/r\/[^"]+\/comments\/[^"]+)"/g;
//   const matches = [...html.matchAll(urlRegex)];
//   const urls = matches.map(m => `https://www.reddit.com${m[1]}`);
//   return [...new Set(urls)];
// }


// // Main function
// export async function getAllRedditPosts(query: string, limit = 20): Promise<RedditPost[]> {
//   const posts: RedditPost[] = [];
//   const seenUrls = new Set<string>();

//   let after: string | null = null;

//   while (posts.length < limit) {
//     let urls: string[];
//     try {
//       urls = await getPostUrls(query, after);
//     } catch (err) {
//       console.error('Error fetching post URLs:', err);
//       break;
//     }

//     if (urls.length === 0) break;

//     for (const url of urls) {
//       if (posts.length >= limit || seenUrls.has(url)) continue;

//       seenUrls.add(url);
//       const post = await redditService.getPostByUrl(url);
//       if (post) posts.push(post);
//     }

//     // Reddit pagination isn't reliable without API access — break after one loop
//     break;
//   }

//   return posts;
// }

import { chromium } from 'playwright';
import redditService from '../reddit';

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

/**
 * Use Playwright to scrape Reddit search results
 */
export async function getPostUrls(query: string): Promise<string[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IndieSaaSBot/1.0',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link`;

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for visible post links instead of testid
    await page.waitForSelector('a[href*="/comments/"]', { timeout: 15000 });

    // Extract all post links
    const postUrls = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/comments/"]'));
      const urls = anchors
        .map(a => a.getAttribute('href'))
        .filter(Boolean)
        .map(href => `https://www.reddit.com${href!.split('?')[0]}`);
      return Array.from(new Set(urls));
    });

    // console.log("Scrapped Posts:",postUrls)
    return postUrls;
  } catch (err) {
    console.error('Error scraping search results with Playwright:', err);
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


