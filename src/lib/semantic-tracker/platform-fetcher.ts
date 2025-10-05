// lib/semantic-tracker/platform-fetcher.ts
import { Reddit } from "@/lib/platforms/reddit";
import { ProcessedContent } from "@/lib/constants/types";
import { Bluesky } from "@/lib/platforms/bluesky";
import { LinkedIn } from "@/lib/platforms/linkedin";
import { Twitter } from "@/lib/platforms/twitter";

interface RedditConfig {
  subreddits?: string[];
  excludedSubreddits?: string[];
  searchPosts?: boolean;
  searchComments?: boolean;
  includeNSFW?: boolean;
  minScore?: number;
}

export class PlatformFetcher {
  private reddit = new Reddit();
  private twitter = new Twitter();
  private bluesky = new Bluesky();
  private linkedin = new LinkedIn();

  /**
   * Fetch content from a platform using keywords and platform-specific config
   */
  async fetch(
    platform: string,
    keywords: string[],
    config?: Record<string, any>
  ): Promise<ProcessedContent[]> {
    const allContent: ProcessedContent[] = [];

    for (const keyword of keywords) {
      console.log(`---------- Processing Keyword:${keyword} ----------`)  
      try {
        switch (platform) {
          case "reddit":
            const redditConfig: RedditConfig = config || {};
            const subreddits = redditConfig.subreddits?.length
              ? redditConfig.subreddits
              : [""]; // empty string = all subreddits

            for (const subreddit of subreddits) {
              // 1️⃣ Search posts
              let posts: ProcessedContent[] = [];
              if (redditConfig.searchPosts) {

                posts = subreddit
                  ? await this.reddit.searchPostsBySubreddit(subreddit, keyword)
                  : await this.reddit.searchPosts(keyword);
                allContent.push(...posts);
              }

              // 2️⃣ Search comments (optional)
              if (redditConfig.searchComments && posts.length > 0) {
                for (const post of posts) {
                  const comments = await this.reddit.searchComments(post.id);
                  allContent.push(...comments);
                }
              }
            }
            
            break;

          case "twitter":
          case "x":
            allContent.push(...(await this.twitter.searchPosts(keyword)));
            await delay(1500);
            break;

          case "bluesky":
            allContent.push(...(await this.bluesky.searchPosts(keyword)));
            break;

          case "linkedin":
            allContent.push(...(await this.linkedin.searchPosts(keyword)));
            break;

          default:
            console.warn(`Unsupported platform: ${platform}`);
            continue;
        }
      } catch (err) {
        console.error(
          `Error fetching from ${platform} for keyword "${keyword}":`,
          err
        );
      }
    }
    // console.log("Content Found platform",allContent)
    return allContent;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
