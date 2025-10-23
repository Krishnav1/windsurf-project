/**
 * Holdings Sync API
 * Sync holdings from blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/auth';
import { TradeExecutor } from '@/lib/blockchain/tradeExecutor';
import { logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { tokenAddress } = await request.json();

    if (!tokenAddress) {
      return NextResponse.json({ error: 'tokenAddress required' }, { status: 400 });
    }

    console.log('[Holdings Sync] Syncing from blockchain for user:', decoded.userId);

    const result = await TradeExecutor.syncHoldingsFromBlockchain(
      decoded.userId,
      tokenAddress
    );

    return NextResponse.json({
      success: true,
      message: 'Holdings synced from blockchain',
      balance: result.balance
    });

  } catch (error) {
    console.error('[Holdings Sync] Error:', error);
    logError('Holdings Sync', error as Error);
    return NextResponse.json({
      error: 'Sync failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}
