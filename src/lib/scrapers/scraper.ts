// lib/scrapers/scraper.ts
import { chromium, Browser, Page } from "playwright";
import axios, { AxiosInstance } from "axios";
import HttpsProxyAgent from "https-proxy-agent";

interface ScraperConfig {
  useProxy?: boolean;
  maxRetries?: number;
  timeout?: number;
  userAgent?: string;
}

interface ScraperLogger {
  info: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
}

/**
 * Base scraper class with proxy support, retry logic, and user-agent rotation
 */
export class BaseScraper {
  protected config: Required<ScraperConfig>;
  protected logger: ScraperLogger;
  protected browser: Browser | null = null;
  protected axiosInstance: AxiosInstance;

  // User agent pool for rotation
  private userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  ];

  constructor(config: ScraperConfig = {}) {
    this.config = {
      useProxy: config.useProxy ?? true,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000,
      userAgent: config.userAgent ?? this.getRandomUserAgent(),
    };

    this.logger = this.createLogger();
    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Create JSON logger for structured logging
   */
  private createLogger(): ScraperLogger {
    return {
      info: (msg: string, meta?: any) => {
        console.log(
          JSON.stringify({
            level: "info",
            message: msg,
            ...meta,
            timestamp: new Date().toISOString(),
          })
        );
      },
      error: (msg: string, meta?: any) => {
        console.error(
          JSON.stringify({
            level: "error",
            message: msg,
            ...meta,
            timestamp: new Date().toISOString(),
          })
        );
      },
      warn: (msg: string, meta?: any) => {
        console.warn(
          JSON.stringify({
            level: "warn",
            message: msg,
            ...meta,
            timestamp: new Date().toISOString(),
          })
        );
      },
    };
  }

  /**
   * Get random user agent from pool
   */
  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Get proxy configuration from environment
   */
  protected getProxyConfig(): string | null {
    const proxyUrl = process.env.PROXY_URL;
    const proxyUser = process.env.PROXY_USER;
    const proxyPass = process.env.PROXY_PASS;

    if (!proxyUrl) return null;

    if (proxyUser && proxyPass) {
      const url = new URL(proxyUrl);
      url.username = proxyUser;
      url.password = proxyPass;
      return url.toString();
    }

    return proxyUrl;
  }

  /**
   * Create axios instance with proxy support
   */
  private createAxiosInstance(): AxiosInstance {
    const proxyUrl = this.config.useProxy ? this.getProxyConfig() : null;

    const config: any = {
      timeout: this.config.timeout,
      headers: {
        "User-Agent": this.config.userAgent,
      },
    };

    if (proxyUrl) {
      config.httpsAgent = HttpsProxyAgent(proxyUrl);
      config.httpAgent = HttpsProxyAgent(proxyUrl);

      this.logger.info("Using proxy for HTTP requests", {
        proxy: proxyUrl.replace(/:[^:]*@/, ":***@"),
      });
    }

    return axios.create(config);
  }

  /**
   * Fetch HTML content using axios with retry logic
   */
  protected async fetchHTML(url: string, retries = 0): Promise<string> {
    try {
      this.logger.info("Fetching HTML", { url, attempt: retries + 1 });

      const response = await this.axiosInstance.get(url, {
        headers: {
          "User-Agent": this.getRandomUserAgent(), // Rotate on each request
        },
      });

      this.logger.info("Successfully fetched HTML", {
        url,
        statusCode: response.status,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error("Failed to fetch HTML", {
        url,
        attempt: retries + 1,
        error: error.message,
        statusCode: error.response?.status,
      });

      if (retries < this.config.maxRetries) {
        const delay = this.getBackoffDelay(retries);
        this.logger.info("Retrying after delay", {
          url,
          delay,
          nextAttempt: retries + 2,
        });
        await this.sleep(delay);
        return this.fetchHTML(url, retries + 1);
      }

      throw new Error(
        `Failed to fetch ${url} after ${this.config.maxRetries + 1} attempts`
      );
    }
  }

  /**
   * Initialize Playwright browser with proxy
   */
  protected async initBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;

    const proxyUrl = this.config.useProxy ? this.getProxyConfig() : null;

    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    };

    if (proxyUrl) {
      const url = new URL(proxyUrl);
      launchOptions.proxy = {
        server: `${url.protocol}//${url.host}`,
        username: url.username || undefined,
        password: url.password || undefined,
      };
      this.logger.info("Using proxy for browser", {
        proxy: `${url.protocol}//${url.host}`,
      });
    }

    this.browser = await chromium.launch(launchOptions);
    this.logger.info("Browser initialized");
    return this.browser;
  }

  /**
   * Fetch JS-rendered content using Playwright
   */
  protected async fetchWithBrowser(url: string, retries = 0): Promise<string> {
    let page: Page | null = null;

    try {
      this.logger.info("Fetching with browser", { url, attempt: retries + 1 });

      const browser = await this.initBrowser();
      page = await browser.newPage({
        userAgent: this.getRandomUserAgent(),
      });

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: this.config.timeout,
      });

      const content = await page.content();
      this.logger.info("Successfully fetched with browser", { url });

      await page.close();
      return content;
    } catch (error: any) {
      this.logger.error("Failed to fetch with browser", {
        url,
        attempt: retries + 1,
        error: error.message,
      });

      if (page) await page.close().catch(() => {});

      if (retries < this.config.maxRetries) {
        const delay = this.getBackoffDelay(retries);
        this.logger.info("Retrying browser fetch after delay", {
          url,
          delay,
          nextAttempt: retries + 2,
        });
        await this.sleep(delay);
        return this.fetchWithBrowser(url, retries + 1);
      }

      throw new Error(
        `Failed to fetch ${url} with browser after ${
          this.config.maxRetries + 1
        } attempts`
      );
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  protected getBackoffDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.info("Browser cleaned up");
    }
  }

  /**
   * Check if robots.txt allows scraping a path
   */
  async checkRobotsTxt(baseUrl: string, path: string): Promise<boolean> {
    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      const response = await this.axiosInstance.get(robotsUrl);
      const robotsTxt = response.data;

      // Simple robots.txt parser (basic implementation)
      const lines = robotsTxt.split("\n");
      let isUserAgentMatch = false;
      let isDisallowed = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        if (trimmed.startsWith("user-agent:")) {
          const agent = trimmed.substring(11).trim();
          isUserAgentMatch = agent === "*" || agent === "claudebot";
        }

        if (isUserAgentMatch && trimmed.startsWith("disallow:")) {
          const disallowPath = trimmed.substring(9).trim();
          if (disallowPath === "/" || path.startsWith(disallowPath)) {
            isDisallowed = true;
            break;
          }
        }
      }

      if (isDisallowed) {
        this.logger.warn("Path disallowed by robots.txt", { baseUrl, path });
      }

      return !isDisallowed;
    } catch (error) {
      // If robots.txt doesn't exist or can't be fetched, assume allowed
      this.logger.warn("Could not fetch robots.txt, assuming allowed", {
        baseUrl,
      });
      return true;
    }
  }
}
