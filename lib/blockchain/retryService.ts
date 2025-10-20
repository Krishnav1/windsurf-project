/**
 * Blockchain Retry Service
 * Handles retry logic for blockchain operations with exponential backoff
 */

import { logError } from '@/lib/utils/errorHandler';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === opts.maxRetries) {
        logError(`${context} - All retries exhausted`, error as Error, { 
          attempts: attempt,
          maxRetries: opts.maxRetries 
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );

      logError(`${context} - Retry attempt ${attempt}/${opts.maxRetries}`, error as Error, {
        nextRetryIn: delay,
        attempt
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This line is technically unreachable because the loop always exits via return or throw
  // However, TypeScript requires it for definite assignment analysis
  throw new Error('Retry logic error: maximum retries exceeded without proper exit');
}

/**
 * Process document with blockchain storage and retry logic
 */
export async function processDocumentWithRetry<T = unknown>(
  processFunction: () => Promise<T>,
  documentId: string,
  userId: string,
  options?: RetryOptions
): Promise<T> {
  return withRetry(
    processFunction,
    `Blockchain Document Processing (Doc: ${documentId}, User: ${userId})`,
    options
  );
}
