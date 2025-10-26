/**
 * Health Check API
 * Monitor system health and performance
 */

import { NextResponse } from 'next/server';
import { HealthCheck } from '@/lib/monitoring/errorTracking';

export async function GET() {
  try {
    const health = await HealthCheck.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: (error as Error).message
    }, { status: 500 });
  }
}
