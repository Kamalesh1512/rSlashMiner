const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IndieSaaSBot/1.0';

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

// Get post details from Reddit JSON endpoint
async function getPostDetailsFromJsonUrl(postUrl: string): Promise<RedditPost | null> {
  try {
    const jsonUrl = `${postUrl}.json`;
    const res = await fetch(jsonUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch JSON: ${jsonUrl}`);
    const data = await res.json();

    const post = data[0]?.data?.children?.[0]?.data;
    if (!post) return null;

    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - 60 * 60 * 24 * 30 * 6;

    if (post.created_utc < sixMonthsAgo) return null;

    return {
      id: post.id,
      title: post.title,
      selftext: post.selftext,
      author: post.author,
      subreddit: post.subreddit,
      url: `https://www.reddit.com${post.permalink}`,
      score: post.score,
      created_utc: post.created_utc,
      num_comments: post.num_comments ?? 0,
    };
  } catch (err) {
    console.error('Error fetching post JSON:', postUrl, err);
    return null;
  }
}

// Scrape search results from Reddit HTML (no JS rendering)
async function getPostUrls(query: string, after: string | null = null): Promise<string[]> {
  const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link${after ? `&after=${after}` : ''}`;
  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch search results');
  const html = await res.text();

  // Extract post URLs from HTML using regex
  const urlRegex = /href="(\/r\/[^"]+\/comments\/[^"]+)"/g;
  const matches = [...html.matchAll(urlRegex)];
  const urls = matches.map(m => `https://www.reddit.com${m[1]}`);
  return [...new Set(urls)];
}

// Main function
export async function getAllRedditPosts(query: string, limit = 20): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  const seenUrls = new Set<string>();

  let after: string | null = null;

  while (posts.length < limit) {
    let urls: string[];
    try {
      urls = await getPostUrls(query, after);
    } catch (err) {
      console.error('Error fetching post URLs:', err);
      break;
    }

    if (urls.length === 0) break;

    for (const url of urls) {
      if (posts.length >= limit || seenUrls.has(url)) continue;

      seenUrls.add(url);
      const post = await getPostDetailsFromJsonUrl(url);
      if (post) posts.push(post);
    }

    // Reddit pagination isn't reliable without API access — break after one loop
    break;
  }

  return posts;
}
