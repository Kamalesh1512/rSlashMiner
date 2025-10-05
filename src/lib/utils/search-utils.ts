
export function isValidRedditUrl(url: string): boolean {
  return url.includes('reddit.com') && 
         url.includes('/r/') && 
         url.includes('/comments/') &&
         !url.includes('[deleted]') &&
         !url.includes('[removed]') &&
         !url.includes('m.reddit.com') &&
         !url.includes('old.reddit.com');
}

export function isWithinTimeRange(createdUtc: number, timeRange: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const postAge = now - createdUtc;
  
  const timeRanges = {
    'day': 24 * 60 * 60,
    'week': 7 * 24 * 60 * 60,
    'month': 30 * 24 * 60 * 60
  };
  
  const maxAge = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges.week;
  return postAge <= maxAge;
}
