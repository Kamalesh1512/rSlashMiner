//  @/lib/utils/healthCheck.ts
export interface HealthStatus {
  platform: string;
  healthy: boolean;
  lastChecked: Date;
  latency?: number;
  error?: string;
}

export class HealthChecker {
  private static statuses: Map<string, HealthStatus> = new Map();
  
  static async checkPlatformHealth(platform: string): Promise<HealthStatus> {
    const startTime = Date.now();
    let healthy = false;
    let error: string | undefined;
    
    try {
      switch (platform) {
        case 'reddit':
          await fetch('https://www.reddit.com/api/v1/me', { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          });
          healthy = true;
          break;
          
        case 'twitter':
          await fetch('https://api.twitter.com/2/tweets/search/recent?query=test', { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          });
          healthy = true;
          break;
          
        case 'bluesky':
          await fetch('https://bsky.social/xrpc/com.atproto.server.describeServer', { 
            signal: AbortSignal.timeout(10000)
          });
          healthy = true;
          break;
          
        case 'linkedin':
          await fetch('https://www.linkedin.com', { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          });
          healthy = true;
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
    
    const status: HealthStatus = {
      platform,
      healthy,
      lastChecked: new Date(),
      latency: Date.now() - startTime,
      error,
    };
    
    this.statuses.set(platform, status);
    return status;
  }
  
  static async checkAllPlatforms(): Promise<HealthStatus[]> {
    const platforms = ['reddit', 'twitter', 'bluesky', 'linkedin'];
    const checks = platforms.map(platform => this.checkPlatformHealth(platform));
    return Promise.all(checks);
  }
  
  static getLastStatus(platform: string): HealthStatus | null {
    return this.statuses.get(platform) || null;
  }
  
  static getAllStatuses(): HealthStatus[] {
    return Array.from(this.statuses.values());
  }
}
