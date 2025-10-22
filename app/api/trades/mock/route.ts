import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/utils/auth';
import { checkKYCStatus, checkInvestmentLimit } from '@/lib/middleware/requireKYC';

const inMemoryTrades: Array<{
  id: string;
  userId: string;
  tokenId: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  settlementMethod: 'demo' | 'upi' | 'cbdc';
  createdAt: string;
}> = [];

function buildTradeRecord(params: {
  userId: string;
  tokenId: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  settlementMethod: 'demo' | 'upi' | 'cbdc';
}) {
  const totalAmount = params.quantity * params.price;
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    tokenId: params.tokenId,
    side: params.side,
    quantity: params.quantity,
    price: params.price,
    totalAmount,
    settlementMethod: params.settlementMethod,
    createdAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // ✅ KYC CHECK - Users must have approved KYC to trade
    console.log('[Trade API] Checking KYC status for user:', decoded.userId);
    const kycCheck = await checkKYCStatus(token);
    
    if (!kycCheck.allowed) {
      console.log('[Trade API] ❌ KYC check failed:', kycCheck.kycStatus);
      return NextResponse.json({
        error: 'KYC verification required to trade',
        kycRequired: true,
        kycStatus: kycCheck.kycStatus,
        message: kycCheck.message,
        redirectTo: '/settings/kyc'
      }, { status: 403 });
    }
    
    console.log('[Trade API] ✅ KYC approved, proceeding with trade');

    const { tokenId, side, quantity, price, settlementMethod = 'demo' } = await request.json();

    if (!tokenId || !side || !quantity || !price) {
      return NextResponse.json({ error: 'tokenId, side, quantity, and price are required' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'side must be "buy" or "sell"' }, { status: 400 });
    }

    const qty = Number(quantity);
    const prc = Number(price);
    if (Number.isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 });
    }
    if (Number.isNaN(prc) || prc <= 0) {
      return NextResponse.json({ error: 'price must be a positive number' }, { status: 400 });
    }

    // ✅ INVESTMENT LIMIT CHECK - Only for buy orders
    if (side === 'buy') {
      const totalAmount = qty * prc;
      const limitCheck = await checkInvestmentLimit(decoded.userId, totalAmount);
      
      if (!limitCheck.allowed) {
        console.log('[Trade API] ❌ Investment limit exceeded');
        return NextResponse.json({
          error: 'Investment limit exceeded',
          message: limitCheck.message,
          remainingLimit: limitCheck.limit,
          requestedAmount: totalAmount
        }, { status: 403 });
      }
      
      console.log('[Trade API] ✅ Investment limit check passed');
    }

    const trade = buildTradeRecord({
      userId: decoded.userId,
      tokenId,
      side,
      quantity: qty,
      price: prc,
      settlementMethod,
    });

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from('transactions').insert({
        id: trade.id,
        transaction_type: 'trade',
        from_user_id: side === 'sell' ? decoded.userId : null,
        to_user_id: side === 'buy' ? decoded.userId : null,
        token_id: trade.tokenId,
        quantity: trade.quantity,
        price: trade.price,
        total_amount: trade.totalAmount,
        settlement_method: trade.settlementMethod,
        settlement_status: 'completed',
        metadata: {
          mockTrade: true,
          simulated: true,
        },
      });

      if (error) {
        console.error('Mock trade insertion error:', error);
      }
    } else {
      inMemoryTrades.unshift(trade);
      if (inMemoryTrades.length > 25) {
        inMemoryTrades.pop();
      }
    }

    return NextResponse.json({ success: true, trade }, { status: 201 });
  } catch (error) {
    console.error('Mock trade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('id, token_id, transaction_type, quantity, price, total_amount, settlement_method, settlement_status, created_at')
        .eq('transaction_type', 'trade')
        .eq('to_user_id', decoded.userId)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) {
        console.error('Fetch trades error:', error);
        return NextResponse.json({ success: true, trades: inMemoryTrades, fallback: true }, { status: 200 });
      }

      const transformed = (data ?? []).map((tx) => ({
        id: tx.id,
        userId: decoded.userId,
        tokenId: tx.token_id,
        side: 'buy',
        quantity: Number(tx.quantity ?? 0),
        price: Number(tx.price ?? 0),
        totalAmount: Number(tx.total_amount ?? 0),
        settlementMethod: (tx.settlement_method as 'demo' | 'upi' | 'cbdc') ?? 'demo',
        settlementStatus: tx.settlement_status,
        createdAt: tx.created_at,
      }));

      return NextResponse.json({ success: true, trades: transformed, fallback: false }, { status: 200 });
    }

    return NextResponse.json({ success: true, trades: inMemoryTrades, fallback: true }, { status: 200 });
  } catch (error) {
    console.error('Get mock trades error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
