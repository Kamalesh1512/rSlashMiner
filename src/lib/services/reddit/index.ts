import { suggestSubreddits } from "@/actions/text-generator";
import { SubredditProps } from "@/lib/constants/types";
import dotenv from "dotenv";

dotenv.config();

export type RedditPost = {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  created_utc: number;
  num_comments: number;
};

export type RedditComment = {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
};

type Timeframe = "hour" | "day" | "week" | "month" | "year" | "all";

interface SearchTerms {
  coreKeywords: string[];
  phrases: string[];
  synonyms: string[];
  relatedTerms: string[];
}

class RedditService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Common stop words to filter out (language agnostic approach)
  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'our', 'their', 'what', 'where', 'when',
    'why', 'how', 'which', 'who', 'whom', 'whose', 'if', 'then', 'than', 'so',
    'very', 'too', 'more', 'most', 'some', 'any', 'all', 'no', 'not', 'only',
    'just', 'now', 'here', 'there', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once'
  ]);

  // Word significance patterns (generic patterns that indicate importance)
  private readonly significancePatterns = {
    technical: /^[A-Z][a-zA-Z]*[A-Z]|[a-z]+[A-Z][a-z]*/, // CamelCase, acronyms
    branded: /^[A-Z][a-z]*$/, // Capitalized words (brands, proper nouns)
    compound: /\w+-\w+/, // Hyphenated words
    numeric: /\d+/, // Contains numbers
    specialized: /[a-z]{5,}/, // Long words (often domain-specific)
  };

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent": process.env.REDDIT_USER_AGENT!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: process.env.REDDIT_USERNAME!,
        password: process.env.REDDIT_PASSWORD!,
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("Failed to authenticate with Reddit API");
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken as string;
  }

  private async fetchFromReddit(
    endpoint: string,
    params: Record<string, string | number | boolean>
  ) {
    const token = await this.authenticate();

    const url = new URL(`https://oauth.reddit.com${endpoint}`);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, String(value))
    );

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": process.env.REDDIT_USER_AGENT || "",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Reddit API error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return json;
  }

  // Generic method to extract meaningful terms from any query
  private extractSearchTerms(query: string): SearchTerms {
    const coreKeywords: string[] = [];
    const phrases: string[] = [];
    const synonyms: string[] = [];
    const relatedTerms: string[] = [];

    // Extract quoted phrases first
    const quotedPhrases = query.match(/"([^"]+)"/g);
    if (quotedPhrases) {
      quotedPhrases.forEach(phrase => {
        phrases.push(phrase.replace(/"/g, '').trim());
      });
    }

    // Remove quoted content and normalize
    let cleanQuery = query.replace(/"[^"]+"/g, ' ').trim();
    cleanQuery = cleanQuery.replace(/[^\w\s-]/g, ' '); // Keep hyphens
    
    // Extract words and analyze their significance
    const words = cleanQuery.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.stopWords.has(word));

    // Categorize words by significance
    const originalWords = cleanQuery.split(/\s+/).filter(word => word.length > 1);
    
    originalWords.forEach((originalWord, index) => {
      const word = originalWord.toLowerCase();
      
      if (this.stopWords.has(word)) return;

      let significance = 0;
      
      // Check significance patterns
      Object.entries(this.significancePatterns).forEach(([type, pattern]) => {
        if (pattern.test(originalWord)) {
          significance += type === 'branded' || type === 'technical' ? 3 : 
                         type === 'specialized' ? 2 : 1;
        }
      });

      // Length-based significance
      if (word.length > 6) significance += 2;
      else if (word.length > 4) significance += 1;

      // Position-based significance (earlier words often more important)
      if (index < words.length / 2) significance += 1;

      // Add to appropriate category
      if (significance > 2) {
        coreKeywords.push(word);
        // Add the original casing if it's different
        if (originalWord !== word) {
          coreKeywords.push(originalWord);
        }
      } else if (word.length > 3) {
        relatedTerms.push(word);
      }
    });

    // Generate n-grams for phrases (2-3 word combinations)
    for (let n = 2; n <= Math.min(3, words.length); n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ');
        if (ngram.length > 5) { // Minimum meaningful phrase length
          phrases.push(ngram);
        }
      }
    }

    // Generate basic synonyms using word morphology patterns
    coreKeywords.forEach(keyword => {
      // Plural/singular forms
      if (keyword.endsWith('s') && keyword.length > 3) {
        synonyms.push(keyword.slice(0, -1));
      } else {
        synonyms.push(keyword + 's');
      }

      // Common suffixes
      const suffixMap = {
        'ing': ['ed', 'er'],
        'ed': ['ing'],
        'er': ['ing'],
        'tion': ['ting', 'te'],
        'ly': [''],
        'ness': ['']
      };

      Object.entries(suffixMap).forEach(([suffix, alternatives]) => {
        if (keyword.endsWith(suffix)) {
          const root = keyword.slice(0, -suffix.length);
          alternatives.forEach(alt => {
            if (alt) synonyms.push(root + alt);
            else synonyms.push(root);
          });
        }
      });
    });

    return {
      coreKeywords: [...new Set(coreKeywords)],
      phrases: [...new Set(phrases)],
      synonyms: [...new Set(synonyms)].filter(s => s.length > 2),
      relatedTerms: [...new Set(relatedTerms)]
    };
  }

  // Generic semantic relevance calculation
  private calculateSemanticRelevance(text: string, searchTerms: SearchTerms, originalQuery: string): number {
    if (!text) return 0;

    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);
    let score = 0;

    // Exact query match (highest score)
    const queryRegex = new RegExp(originalQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const exactQueryMatches = (textLower.match(queryRegex) || []).length;
    score += exactQueryMatches * 200;

    // Phrase matches (very high score)
    searchTerms.phrases.forEach(phrase => {
      const phraseRegex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = (textLower.match(phraseRegex) || []).length;
      score += matches * 100;
    });

    // Core keyword matches (high score)
    searchTerms.coreKeywords.forEach(keyword => {
      // Exact word boundary match
      const exactMatches = (textLower.match(new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")) || []).length;
      score += exactMatches * 50;

      // Partial matches (for variations)
      const partialMatches = words.filter(word => 
        word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)
      ).length - exactMatches; // Don't double count
      score += partialMatches * 20;
    });

    // Synonym matches (medium score)
    searchTerms.synonyms.forEach(synonym => {
      const matches = (textLower.match(new RegExp(`\\b${synonym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")) || []).length;
      score += matches * 25;
    });

    // Related term matches (lower score)
    searchTerms.relatedTerms.forEach(term => {
      const matches = (textLower.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")) || []).length;
      score += matches * 10;
    });

    // Keyword density bonus
    const totalImportantWords = [...searchTerms.coreKeywords, ...searchTerms.synonyms];
    const keywordCount = totalImportantWords.reduce((count, keyword) => {
      return count + (textLower.match(new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")) || []).length;
    }, 0);

    if (words.length > 0) {
      const density = keywordCount / words.length;
      score += density * 75;
    }

    // Position and context bonuses
    const allTerms = [originalQuery, ...searchTerms.phrases, ...searchTerms.coreKeywords].slice(0, 5);
    allTerms.forEach(term => {
      const termLower = term.toLowerCase();
      // Beginning of text bonus
      if (textLower.startsWith(termLower)) {
        score += 30;
      }
      // Near beginning bonus
      else if (textLower.indexOf(termLower) < textLower.length * 0.2) {
        score += 15;
      }
    });

    // Coherence bonus - multiple different terms appearing together
    const uniqueTermsFound = new Set();
    [...searchTerms.coreKeywords, ...searchTerms.synonyms].forEach(term => {
      if (textLower.includes(term.toLowerCase())) {
        uniqueTermsFound.add(term);
      }
    });
    score += uniqueTermsFound.size * 10;

    return score;
  }

  // Generate search variations dynamically
  private generateSearchVariations(searchTerms: SearchTerms, originalQuery: string): string[] {
    const variations: string[] = [];

    // Original query first
    variations.push(originalQuery);

    // Exact phrases in quotes
    searchTerms.phrases.forEach(phrase => {
      variations.push(`"${phrase}"`);
    });

    // Core keywords combinations
    if (searchTerms.coreKeywords.length > 1) {
      // All core keywords
      variations.push(searchTerms.coreKeywords.slice(0, 4).join(' '));
      
      // Pairs of core keywords
      for (let i = 0; i < Math.min(searchTerms.coreKeywords.length, 3); i++) {
        for (let j = i + 1; j < Math.min(searchTerms.coreKeywords.length, 4); j++) {
          variations.push(`${searchTerms.coreKeywords[i]} ${searchTerms.coreKeywords[j]}`);
        }
      }
    }

    // Individual high-value keywords
    searchTerms.coreKeywords.slice(0, 3).forEach(keyword => {
      if (keyword.length > 3) {
        variations.push(keyword);
      }
    });

    // Mix core keywords with synonyms
    if (searchTerms.coreKeywords.length > 0 && searchTerms.synonyms.length > 0) {
      const topKeyword = searchTerms.coreKeywords[0];
      searchTerms.synonyms.slice(0, 2).forEach(synonym => {
        variations.push(`${topKeyword} ${synonym}`);
      });
    }

    // Remove duplicates and empty strings
    return [...new Set(variations.filter(v => v.trim().length > 0))];
  }



  private async searchPostsByKeyword(
    keyword: string,
    time: Timeframe,
    limit: number,
    subreddit?: string
  ): Promise<RedditPost[]> {
    try {
      const endpoint = subreddit ? `/r/${subreddit}/search` : '/search';
      const params: Record<string, any> = {
        q: keyword,
        sort: 'relevance',
        t: time,
        limit,
        include_over_18: false,
      };

      if (subreddit) {
        params.restrict_sr = true;
      }

      const data = await this.fetchFromReddit(endpoint, params);
      return this.parsePosts(data);
    } catch (err) {
      console.error("Reddit search error:", err);
      return [];
    }
  }

  private getTimeFilter(timeframe: Timeframe): string {
    const timeMap = {
      hour: "hour",
      day: "day", 
      week: "week",
      month: "month",
      year: "year",
      all: "all",
    };
    return timeMap[timeframe] || "month";
  }

  private getTimeThreshold(timeframe: Timeframe): number {
    const now = Math.floor(Date.now() / 1000);
    const timeThresholds = {
      hour: now - 60 * 60,
      day: now - 60 * 60 * 24,
      week: now - 60 * 60 * 24 * 7,
      month: now - 60 * 60 * 24 * 30,
      year: now - 60 * 60 * 24 * 365,
      all: 0,
    };
    return timeThresholds[timeframe] || timeThresholds.month;
  }

  private parsePosts(data: any): RedditPost[] {
    return (data.data?.children || []).map((child: any) => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        selftext: post.selftext || "",
        author: post.author,
        subreddit: post.subreddit,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score,
        created_utc: post.created_utc,
        num_comments: post.num_comments ?? 0,
      } as RedditPost;
    });
  }

  // Enhanced subreddit discovery with semantic matching and direct keyword matching
  private async findRelevantSubreddits(searchTerms: SearchTerms): Promise<Array<{name: string, relevance: number}>> {
    const subredditCandidates = new Map<string, number>(); // subreddit -> relevance score
    
    try {
      console.log("🎯 Step 1: Finding relevant subreddits...");

      // Step 1: Direct keyword matching - check if any core keyword directly matches a subreddit
      const directMatches = [];
      for (const keyword of searchTerms.coreKeywords) {
        try {
          // Try to find exact subreddit match
          const directCheck = await this.fetchFromReddit(`/r/${keyword}/about`, {});
          if (directCheck?.data?.display_name) {
            directMatches.push({
              name: directCheck.data.display_name,
              subscribers: directCheck.data.subscribers || 0,
              relevance: 1000 // Highest relevance for direct matches
            });
            console.log(`✅ Direct match found: r/${keyword}`);
          }
        } catch (error) {
          // Subreddit doesn't exist, that's fine
        }

        // Also try with capitalized version
        const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        if (capitalizedKeyword !== keyword) {
          try {
            const directCheck = await this.fetchFromReddit(`/r/${capitalizedKeyword}/about`, {});
            if (directCheck?.data?.display_name) {
              directMatches.push({
                name: directCheck.data.display_name,
                subscribers: directCheck.data.subscribers || 0,
                relevance: 1000
              });
              console.log(`✅ Direct match found: r/${capitalizedKeyword}`);
            }
          } catch (error) {
            // Subreddit doesn't exist
          }
        }
      }

      // Add direct matches to candidates
      directMatches.forEach(match => {
        if (match.subscribers > 500) { // Only include active subreddits
          subredditCandidates.set(match.name, match.relevance);
        }
      });

      // Step 2: Semantic search for related subreddits
      const searchQueries = [
        ...searchTerms.coreKeywords.slice(0, 4), // Top core keywords
        ...searchTerms.phrases.slice(0, 2), // Top phrases
      ];

      for (const searchQuery of searchQueries) {
        try {
          const subResults = await this.searchSubreddits(searchQuery, 8);
          
          subResults.forEach(sub => {
            if (sub.subscribers > 1000) { // Only include reasonably active subreddits
              // Calculate semantic relevance of subreddit to our search
              const nameRelevance = this.calculateSemanticRelevance(
                sub.name.toLowerCase(), 
                searchTerms, 
                searchQuery
              );
              const descRelevance = this.calculateSemanticRelevance(
                (sub.description || '').toLowerCase(), 
                searchTerms, 
                searchQuery
              );
              const titleRelevance = this.calculateSemanticRelevance(
                (sub.title || '').toLowerCase(), 
                searchTerms, 
                searchQuery
              );

              const totalRelevance = nameRelevance * 2 + descRelevance + titleRelevance * 1.5;
              
              // Boost score based on subscriber count (more active = better)
              const subscriberBoost = Math.min(50, Math.log10(sub.subscribers) * 10);
              const finalRelevance = totalRelevance + subscriberBoost;

              if (finalRelevance > 25) { // Only include semantically relevant subreddits
                const existingRelevance = subredditCandidates.get(sub.name) || 0;
                subredditCandidates.set(sub.name, Math.max(existingRelevance, finalRelevance));
              }
            }
          });

          await new Promise(resolve => setTimeout(resolve, 150)); // Rate limiting
        } catch (error) {
          console.log(`Could not search subreddits for: ${searchQuery}`);
        }
      }

      // Convert to array and sort by relevance
      const sortedSubreddits = Array.from(subredditCandidates.entries())
        .map(([name, relevance]) => ({ name, relevance }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 8); // Top 8 most relevant subreddits

      console.log(`🎯 Found ${sortedSubreddits.length} relevant subreddits:`, 
        sortedSubreddits.map(s => `r/${s.name} (${s.relevance.toFixed(1)})`));

      return sortedSubreddits;

    } catch (error) {
      console.error("Error finding relevant subreddits:", error);
      return [];
    }
  }

  // Main search method - SUBREDDIT-FIRST approach
  async searchRelevantPosts(
    query: string,
    timeframe: Timeframe
  ): Promise<RedditPost[]> {
    console.log(`🔍 Subreddit-first semantic search for: "${query}" within ${timeframe}`);

    const allPosts: RedditPost[] = [];
    const seenPostIds = new Set<string>();
    const timeThreshold = this.getTimeThreshold(timeframe);

    try {
      // Extract search terms generically
      const searchTerms = this.extractSearchTerms(query);
      console.log(`📝 Extracted terms:`, {
        coreKeywords: searchTerms.coreKeywords.slice(0, 5),
        phrases: searchTerms.phrases.slice(0, 3),
        synonyms: searchTerms.synonyms.slice(0, 5)
      });

      // STEP 1: Find most relevant subreddits (including direct matches)
      const relevantSubreddits = await this.findRelevantSubreddits(searchTerms);
      
      if (relevantSubreddits.length === 0) {
        console.log("⚠️ No relevant subreddits found, falling back to general search");
        // Fallback to general Reddit search if no relevant subreddits found
        const searchVariations = this.generateSearchVariations(searchTerms, query);
        const results = await this.searchPostsByKeyword(searchVariations[0], timeframe, 20);
        results.forEach(post => {
          if (!seenPostIds.has(post.id)) {
            seenPostIds.add(post.id);
            allPosts.push(post);
          }
        });
      } else {
        // STEP 2: Search ONLY within the discovered relevant subreddits
        console.log(`🎯 Searching exclusively in ${relevantSubreddits.length} relevant subreddits...`);
        
        const searchVariations = this.generateSearchVariations(searchTerms, query);
        
        for (const subredditInfo of relevantSubreddits) {
          const subreddit = subredditInfo.name;
          const maxVariations = subredditInfo.relevance > 500 ? 4 : 2; // More variations for highly relevant subreddits
          
          for (let i = 0; i < Math.min(maxVariations, searchVariations.length); i++) {
            try {
              const variation = searchVariations[i];
              const postsPerSearch = subredditInfo.relevance > 500 ? 15 : 10;
              const results = await this.searchPostsByKeyword(variation, timeframe, postsPerSearch, subreddit);
              
              results.forEach(post => {
                if (!seenPostIds.has(post.id)) {
                  seenPostIds.add(post.id);
                  allPosts.push(post);
                }
              });

              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
              console.log(`⚠️ Error searching r/${subreddit} with "${searchVariations[i]}":`, error);
            }
          }
        }
      }

      console.log(`📊 Found ${allPosts.length} total posts from relevant subreddits`);

      // STEP 3: Apply semantic filtering and ranking (same as before)
      const filteredPosts = allPosts
        .filter(post => {
          // Basic filters
          if (post.created_utc < timeThreshold) return false;
          if (!post.title && !post.selftext) return false;
          if (post.score < -10) return false;
          
          return true;
        })
        .map(post => {
          // Calculate semantic relevance
          const titleRelevance = this.calculateSemanticRelevance(post.title, searchTerms, query);
          const contentRelevance = this.calculateSemanticRelevance(post.selftext, searchTerms, query);
          const totalRelevance = titleRelevance + (contentRelevance * 0.5);

          return {
            ...post,
            relevanceScore: totalRelevance,
          };
        })
        .filter(post => post.relevanceScore > 10) // Lower threshold since we're already in relevant subreddits
        .sort((a, b) => {
          // Primary sort: semantic relevance
          if (Math.abs(a.relevanceScore - b.relevanceScore) > 20) {
            return b.relevanceScore - a.relevanceScore;
          }

          // Secondary sort: engagement quality
          const engagementA = Math.max(0, a.score) + (a.num_comments * 2.5);
          const engagementB = Math.max(0, b.score) + (b.num_comments * 2.5);
          
          // Tertiary sort: recency
          if (Math.abs(engagementA - engagementB) < 10) {
            return b.created_utc - a.created_utc;
          }
          
          return engagementB - engagementA;
        });

      console.log(`✅ Returning ${filteredPosts.length} semantically relevant posts from targeted subreddits`);

      // Debug output
      if (filteredPosts.length > 0) {
        console.log(`🏆 Top result: "${filteredPosts[0].title.substring(0, 60)}..." from r/${filteredPosts[0].subreddit} (Score: ${filteredPosts[0].relevanceScore.toFixed(1)})`);
      }

      // Return clean results
      return filteredPosts
        .map(({ relevanceScore, ...post }) => post)
        .slice(0, 30); // Return top 30 results

    } catch (error) {
      console.error("❌ Error in subreddit-first search:", error);
      return [];
    }
  }

  async getPostByUrl(postUrl: string): Promise<RedditPost | null> {
    try {
      const match = postUrl.match(/\/comments\/([a-z0-9]+)\//i);
      const postId = match?.[1];

      if (!postId) {
        throw new Error(`Invalid Reddit post URL: ${postUrl}`);
      }

      const data = await this.fetchFromReddit("/api/info", {
        id: `t3_${postId}`,
      });

      const post = data?.data?.children?.[0]?.data;
      if (!post) return null;

      const now = Math.floor(Date.now() / 1000);
      const oneYearAgo = now - 60 * 60 * 24 * 365;
      if (post.created_utc < oneYearAgo) return null;

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
      console.error("Failed to fetch Reddit post by URL:", postUrl, err);
      return null;
    }
  }

  async searchSubreddits(query: string, limit = 10): Promise<SubredditProps[]> {
    const data = await this.fetchFromReddit(`/subreddits/search`, {
      q: query,
      limit,
      sort: "relevance",
    });

    return (data.data?.children || []).map((child: any) => {
      const sub = child.data;
      return {
        id: sub.id,
        name: sub.display_name,
        title: sub.title,
        description: sub.public_description,
        subscribers: sub.subscribers,
        url: `https://www.reddit.com${sub.url}`,
      };
    });
  }

  async getSubredditPosts(
    subreddit: string,
    sort: "hot" | "new" | "top" = "new",
    limit = 5
  ): Promise<RedditPost[]> {
    const data = await this.fetchFromReddit(`/r/${subreddit}/${sort}`, {
      limit,
    });

    return (data.data?.children || []).map((child: any) => {
      const post = child.data;
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
    });
  }

  async getComments(postId: string): Promise<RedditComment[]> {
    const token = await this.authenticate();

    const res = await fetch(
      `https://oauth.reddit.com/comments/${postId}?depth=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": process.env.REDDIT_USER_AGENT || "",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error fetching comments: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const comments = data[1]?.data?.children || [];

    return comments
      .filter((c: any) => c.kind === "t1")
      .map((comment: any) => {
        const d = comment.data;
        return {
          id: d.id,
          body: d.body,
          author: d.author,
          score: d.score,
          created_utc: d.created_utc,
        };
      });
  }
}

const redditService = new RedditService();
export default redditService;