/**
 * Redis Cache Service
 * Using Upstash Redis for serverless caching
 */

import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://your-redis-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'your-token',
});

export class CacheService {
  
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value as T;
    } catch (error) {
      console.error('[Cache] Error getting key:', key, error);
      return null;
    }
  }

  /**
   * Set cache value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Cache] Error setting key:', key, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('[Cache] Error deleting key:', key, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('[Cache] Error deleting pattern:', pattern, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('[Cache] Error checking existence:', key, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  static async increment(key: string, ttlSeconds: number = 60): Promise<number> {
    try {
      const value = await redis.incr(key);
      await redis.expire(key, ttlSeconds);
      return value;
    } catch (error) {
      console.error('[Cache] Error incrementing:', key, error);
      return 0;
    }
  }

  /**
   * Cache token prices
   */
  static async cacheTokenPrice(tokenId: string, price: number, ttl: number = 60) {
    return this.set(`token:price:${tokenId}`, price, ttl);
  }

  /**
   * Get cached token price
   */
  static async getTokenPrice(tokenId: string): Promise<number | null> {
    return this.get<number>(`token:price:${tokenId}`);
  }

  /**
   * Cache user session
   */
  static async cacheUserSession(userId: string, sessionData: any, ttl: number = 3600) {
    return this.set(`session:${userId}`, sessionData, ttl);
  }

  /**
   * Get cached user session
   */
  static async getUserSession(userId: string): Promise<any | null> {
    return this.get(`session:${userId}`);
  }

  /**
   * Cache KYC status
   */
  static async cacheKYCStatus(userId: string, status: string, ttl: number = 300) {
    return this.set(`kyc:${userId}`, status, ttl);
  }

  /**
   * Get cached KYC status
   */
  static async getKYCStatus(userId: string): Promise<string | null> {
    return this.get<string>(`kyc:${userId}`);
  }

  /**
   * Invalidate user cache
   */
  static async invalidateUserCache(userId: string) {
    await this.deletePattern(`session:${userId}*`);
    await this.deletePattern(`kyc:${userId}*`);
    await this.deletePattern(`holdings:${userId}*`);
  }
}

export default CacheService;
