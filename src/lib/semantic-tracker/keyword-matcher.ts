// lib/semantic-tracker/keyword-matcher.ts
import  AhoCorasick  from 'ahocorasick';

export class KeywordMatcher {
  private ac: AhoCorasick;
  private keywords: Set<string>;
  private excludedKeywords: Set<string>;

  constructor(keywords: string[], excludedKeywords: string[] = []) {
    this.keywords = new Set(keywords.map(k => k.toLowerCase()));
    this.excludedKeywords = new Set(excludedKeywords.map(k => k.toLowerCase()));
    
    // Build Aho-Corasick automaton for fast string matching
    this.ac = new AhoCorasick(Array.from(this.keywords));
  }

  findExactMatches(text: string): string[] {
    const matches: string[] = [];
    const results = this.ac.search(text.toLowerCase());
    
    for (const result of results) {
      const matchedKeyword = result[1][0] as string;
      
      // Check if any excluded keywords are present
      let hasExcluded = false;
      for (const excluded of this.excludedKeywords) {
        if (text.toLowerCase().includes(excluded)) {
          hasExcluded = true;
          break;
        }
      }
      
      if (!hasExcluded) {
        matches.push(matchedKeyword);
      }
    }
    
    return Array.from(new Set(matches)); // Remove duplicates
  }

  hasExactMatch(text: string): boolean {
    return this.findExactMatches(text).length > 0;
  }
}
