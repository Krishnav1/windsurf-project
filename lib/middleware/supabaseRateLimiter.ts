/**
 * Supabase Rate Limiter
 * Database-backed rate limiting using rate_limits table
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 60,
};

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
  request: NextRequest,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const endpoint = request.nextUrl.pathname;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Get or create rate limit entry
    const { data: existing } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('identifier', ip)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (existing) {
      // Update existing entry
      const newCount = existing.request_count + 1;
      
      await supabaseAdmin
        .from('rate_limits')
        .update({ 
          request_count: newCount,
          updated_at: now.toISOString()
        })
        .eq('id', existing.id);

      const allowed = newCount <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - newCount);
      const resetAt = new Date(existing.window_start).getTime() + config.windowMs;

      return { allowed, remaining, resetAt };
    } else {
      // Create new entry
      await supabaseAdmin
        .from('rate_limits')
        .insert({
          identifier: ip,
          endpoint,
          request_count: 1,
          window_start: now.toISOString()
        });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now.getTime() + config.windowMs
      };
    }
  } catch (error) {
    console.error('[Rate Limiter] Error:', error);
    // On error, allow the request
    return { 
      allowed: true, 
      remaining: config.maxRequests, 
      resetAt: now.getTime() + config.windowMs 
    };
  }
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    const { data: existing } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('identifier', userId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (existing) {
      const newCount = existing.request_count + 1;
      
      await supabaseAdmin
        .from('rate_limits')
        .update({ 
          request_count: newCount,
          updated_at: now.toISOString()
        })
        .eq('id', existing.id);

      const allowed = newCount <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - newCount);
      const resetAt = new Date(existing.window_start).getTime() + config.windowMs;

      return { allowed, remaining, resetAt };
    } else {
      await supabaseAdmin
        .from('rate_limits')
        .insert({
          identifier: userId,
          endpoint,
          request_count: 1,
          window_start: now.toISOString()
        });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now.getTime() + config.windowMs
      };
    }
  } catch (error) {
    console.error('[Rate Limiter] Error:', error);
    return { 
      allowed: true, 
      remaining: config.maxRequests, 
      resetAt: now.getTime() + config.windowMs 
    };
  }
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest) => {
    const { allowed, remaining, resetAt } = await rateLimitByIP(request, config);

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config?.maxRequests.toString() || defaultConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetAt.toString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const response = await handler(request);
    
    response.headers.set('X-RateLimit-Limit', config?.maxRequests.toString() || defaultConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetAt.toString());

    return response;
  };
}

/**
 * Clean old rate limit entries
 */
export async function cleanOldRateLimits() {
  try {
    await supabaseAdmin.rpc('clean_old_rate_limits');
  } catch (error) {
    console.error('[Rate Limiter] Error cleaning old entries:', error);
  }
}

/**
 * Strict rate limit for sensitive endpoints
 */
export const strictRateLimit = {
  windowMs: 60000,
  maxRequests: 10,
};

/**
 * Moderate rate limit for API endpoints
 */
export const moderateRateLimit = {
  windowMs: 60000,
  maxRequests: 30,
};

/**
 * Lenient rate limit for public endpoints
 */
export const lenientRateLimit = {
  windowMs: 60000,
  maxRequests: 100,
};
