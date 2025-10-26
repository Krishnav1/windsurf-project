/**
 * Supabase Cache Service
 * Database-backed caching using cache_entries table
 */

import { supabaseAdmin } from '@/lib/supabase/client';

export class SupabaseCacheService {
  
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cache_entries')
        .select('cache_value, expires_at')
        .eq('cache_key', key)
        .single();

      if (error || !data) return null;

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        // Delete expired entry
        await this.delete(key);
        return null;
      }

      return data.cache_value as T;
    } catch (error) {
      console.error('[Supabase Cache] Error getting key:', key, error);
      return null;
    }
  }

  /**
   * Set cache value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const { error } = await supabaseAdmin
        .from('cache_entries')
        .upsert({
          cache_key: key,
          cache_value: value,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      return !error;
    } catch (error) {
      console.error('[Supabase Cache] Error setting key:', key, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('cache_entries')
        .delete()
        .eq('cache_key', key);

      return !error;
    } catch (error) {
      console.error('[Supabase Cache] Error deleting key:', key, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('cache_entries')
        .delete()
        .like('cache_key', pattern);

      return !error;
    } catch (error) {
      console.error('[Supabase Cache] Error deleting pattern:', pattern, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const { data } = await supabaseAdmin
        .from('cache_entries')
        .select('id')
        .eq('cache_key', key)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Increment counter (using database)
   */
  static async increment(key: string, ttlSeconds: number = 60): Promise<number> {
    try {
      const current = await this.get<number>(key);
      const newValue = (current || 0) + 1;
      await this.set(key, newValue, ttlSeconds);
      return newValue;
    } catch (error) {
      console.error('[Supabase Cache] Error incrementing:', key, error);
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
    await this.deletePattern(`session:${userId}%`);
    await this.deletePattern(`kyc:${userId}%`);
    await this.deletePattern(`holdings:${userId}%`);
  }

  /**
   * Clean expired cache entries
   */
  static async cleanExpired() {
    try {
      await supabaseAdmin.rpc('clean_expired_cache');
    } catch (error) {
      console.error('[Supabase Cache] Error cleaning expired:', error);
    }
  }
}

export default SupabaseCacheService;
