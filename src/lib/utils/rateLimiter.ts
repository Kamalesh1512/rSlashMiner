// utils/rateLimiter.ts
type RateLimitConfig = {
  requestsPerMinute?: number;
  requestsPerHour?: number;
};

export class RateLimiter {
  private perMinuteTimestamps: number[] = [];
  private perHourTimestamps: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private prune(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    this.perMinuteTimestamps = this.perMinuteTimestamps.filter(
      (t) => t > oneMinuteAgo
    );
    this.perHourTimestamps = this.perHourTimestamps.filter(
      (t) => t > oneHourAgo
    );
  }

  private canProceed(): boolean {
    this.prune();

    if (
      this.config.requestsPerMinute !== undefined &&
      this.perMinuteTimestamps.length >= this.config.requestsPerMinute
    ) {
      return false;
    }

    if (
      this.config.requestsPerHour !== undefined &&
      this.perHourTimestamps.length >= this.config.requestsPerHour
    ) {
      return false;
    }

    return true;
  }

  async acquire(): Promise<void> {
    while (!this.canProceed()) {
      // Wait 1 second and recheck
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Log the request
    const now = Date.now();
    this.perMinuteTimestamps.push(now);
    this.perHourTimestamps.push(now);
  }
}
