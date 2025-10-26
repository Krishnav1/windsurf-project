/**
 * Rate Limiting Middleware
 * Prevents spam and abuse by limiting API requests
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs } = config;

  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = identifier;

    if (!store[key] || store[key].resetTime < now) {
      // Create new window
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: store[key].resetTime,
      };
    }

    // Increment count
    store[key].count++;

    if (store[key].count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: store[key].resetTime,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - store[key].count,
      resetTime: store[key].resetTime,
    };
  };
}

// Predefined rate limiters
export const valuationSubmitLimiter = rateLimit({
  maxRequests: 5, // 5 submissions
  windowMs: 24 * 60 * 60 * 1000, // per day
});

export const apiRequestLimiter = rateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
});

export const authLimiter = rateLimit({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
});
