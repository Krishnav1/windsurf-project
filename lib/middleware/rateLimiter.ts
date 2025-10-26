/**
 * Rate Limiter Middleware
 * Prevents API abuse and DDoS attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache/redis';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000,  // 1 minute
  maxRequests: 60,  // 60 requests per minute
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
  
  const key = `ratelimit:ip:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Get current count
    const count = await CacheService.increment(key, Math.ceil(config.windowMs / 1000));
    
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = now + config.windowMs;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('[Rate Limiter] Error:', error);
    // On error, allow the request
    return { allowed: true, remaining: config.maxRequests, resetAt: now + config.windowMs };
  }
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  
  const key = `ratelimit:user:${userId}`;
  const now = Date.now();

  try {
    const count = await CacheService.increment(key, Math.ceil(config.windowMs / 1000));
    
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = now + config.windowMs;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('[Rate Limiter] Error:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: now + config.windowMs };
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
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config?.maxRequests.toString() || defaultConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetAt.toString());

    return response;
  };
}

/**
 * Strict rate limit for sensitive endpoints
 */
export const strictRateLimit = {
  windowMs: 60000,  // 1 minute
  maxRequests: 10,  // 10 requests per minute
};

/**
 * Moderate rate limit for API endpoints
 */
export const moderateRateLimit = {
  windowMs: 60000,  // 1 minute
  maxRequests: 30,  // 30 requests per minute
};

/**
 * Lenient rate limit for public endpoints
 */
export const lenientRateLimit = {
  windowMs: 60000,  // 1 minute
  maxRequests: 100,  // 100 requests per minute
};
