// @/lib/utils/retryHandler.ts
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    const {
      maxRetries,
      baseDelay,
      maxDelay,
      backoffFactor,
      retryCondition = () => true,
    } = options;

    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );
        
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  static isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // HTTP status codes that might be temporary
    if (error.response?.status) {
      const status = error.response.status;
      return status === 429 || status === 502 || status === 503 || status === 504;
    }
    
    // Rate limit errors
    if (error.message?.includes('rate limit')) {
      return true;
    }
    
    return false;
  }
}