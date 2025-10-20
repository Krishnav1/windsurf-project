/**
 * Centralized Error Handler
 * Sanitizes errors for production to prevent information leakage
 */

export function sanitizeError(error: Error | unknown): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Internal server error';
  }
  
  // In production, return generic message
  return 'Internal server error';
}

export function logError(context: string, error: Error | unknown, metadata?: Record<string, unknown>): void {
  const errorInfo: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    metadata
  };

  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.name = error.name;
    errorInfo.stack = error.stack;
  } else {
    errorInfo.error = String(error);
  }

  console.error(`[${context}]`, errorInfo);
}
