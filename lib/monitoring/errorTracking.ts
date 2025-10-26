/**
 * Error Tracking and Monitoring
 * Centralized error handling and logging
 */

interface ErrorContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    timestamp: Date;
    error: Error;
    context: ErrorContext;
  }> = [];

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Track an error
   */
  trackError(error: Error, context: ErrorContext = {}) {
    const errorData = {
      timestamp: new Date(),
      error,
      context
    };

    // Log to console
    console.error('[Error Tracker]', {
      message: error.message,
      stack: error.stack,
      ...context
    });

    // Store in memory (in production, send to Sentry/LogRocket)
    this.errors.push(errorData);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    // In production, send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorData);
    }
  }

  /**
   * Track API error
   */
  trackAPIError(error: Error, endpoint: string, method: string, statusCode: number, userId?: string) {
    this.trackError(error, {
      userId,
      endpoint,
      method,
      statusCode,
      metadata: {
        type: 'API_ERROR'
      }
    });
  }

  /**
   * Track blockchain error
   */
  trackBlockchainError(error: Error, txHash?: string, userId?: string) {
    this.trackError(error, {
      userId,
      metadata: {
        type: 'BLOCKCHAIN_ERROR',
        txHash
      }
    });
  }

  /**
   * Track payment error
   */
  trackPaymentError(error: Error, orderId: string, userId?: string) {
    this.trackError(error, {
      userId,
      metadata: {
        type: 'PAYMENT_ERROR',
        orderId
      }
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10) {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Get error stats
   */
  getErrorStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errorsLastHour = this.errors.filter(e => e.timestamp > oneHourAgo).length;
    const errorsLastDay = this.errors.filter(e => e.timestamp > oneDayAgo).length;

    return {
      total: this.errors.length,
      lastHour: errorsLastHour,
      lastDay: errorsLastDay
    };
  }

  /**
   * Send to external monitoring service (Sentry, LogRocket, etc.)
   */
  private async sendToExternalService(errorData: any) {
    try {
      // In production, integrate with Sentry or similar
      // Example: Sentry.captureException(errorData.error, { contexts: errorData.context });
      
      // For now, just log
      console.log('[Error Tracker] Would send to external service:', errorData);
    } catch (err) {
      console.error('[Error Tracker] Failed to send to external service:', err);
    }
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }
}

export const errorTracker = ErrorTracker.getInstance();

/**
 * Global error handler wrapper
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.trackError(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track operation duration
   */
  trackDuration(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const durations = this.metrics.get(operation)!;
    durations.push(duration);

    // Keep only last 100 measurements
    if (durations.length > 100) {
      durations.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) return 0;
    
    const sum = durations.reduce((a, b) => a + b, 0);
    return sum / durations.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result: Record<string, { avg: number; count: number; max: number; min: number }> = {};
    
    this.metrics.forEach((durations, operation) => {
      if (durations.length > 0) {
        result[operation] = {
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
          count: durations.length,
          max: Math.max(...durations),
          min: Math.min(...durations)
        };
      }
    });

    return result;
  }

  /**
   * Measure async function execution time
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.trackDuration(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.trackDuration(operation, duration);
      throw error;
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Health check service
 */
export class HealthCheck {
  static async checkDatabase(): Promise<boolean> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  static async checkRedis(): Promise<boolean> {
    try {
      const { CacheService } = await import('@/lib/cache/redis');
      await CacheService.set('health_check', 'ok', 10);
      const value = await CacheService.get('health_check');
      return value === 'ok';
    } catch {
      return false;
    }
  }

  static async checkBlockchain(): Promise<boolean> {
    try {
      const { JsonRpcProvider } = await import('ethers');
      const provider = new JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL
      );
      const blockNumber = await provider.getBlockNumber();
      return blockNumber > 0;
    } catch {
      return false;
    }
  }

  static async getHealthStatus() {
    const [database, redis, blockchain] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkBlockchain()
    ]);

    const healthy = database && redis && blockchain;

    return {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: database ? 'up' : 'down',
        redis: redis ? 'up' : 'down',
        blockchain: blockchain ? 'up' : 'down'
      },
      errors: errorTracker.getErrorStats(),
      performance: performanceMonitor.getAllMetrics()
    };
  }
}

export default errorTracker;
