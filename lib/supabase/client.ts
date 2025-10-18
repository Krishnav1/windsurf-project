/**
 * Supabase Client Configuration
 * 
 * This file provides Supabase client instances for both client-side and server-side operations.
 * - Client-side: Uses anon key with Row Level Security (RLS)
 * - Server-side: Uses service role key for admin operations
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase instance
 * Uses anon key - safe for browser usage with RLS enabled
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase instance (Admin)
 * Uses service role key - bypasses RLS, use with caution
 * Only use in API routes or server components
 */
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Database types for TypeScript
export type User = {
  id: string;
  email: string;
  full_name: string;
  mobile?: string;
  country?: string;
  government_id_type?: string;
  government_id_number?: string;
  role: 'investor' | 'issuer' | 'admin' | 'auditor';
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_documents?: any;
  wallet_address?: string;
  two_fa_enabled: boolean;
  demo_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Token = {
  id: string;
  token_symbol: string;
  token_name: string;
  asset_type: string;
  total_supply: number;
  decimals: number;
  issuer_id: string;
  issuer_legal_name?: string;
  asset_description?: string;
  asset_valuation?: number;
  metadata_hash: string;
  contract_address?: string;
  token_id?: string;
  mint_tx_hash?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'frozen';
  is_frozen: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  token_id: string;
  order_type: 'buy' | 'sell';
  order_side: 'market' | 'limit';
  quantity: number;
  price: number;
  filled_quantity: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  transaction_type: 'mint' | 'transfer' | 'trade' | 'settlement' | 'freeze' | 'unfreeze';
  from_user_id?: string;
  to_user_id?: string;
  token_id?: string;
  quantity?: number;
  price?: number;
  total_amount?: number;
  settlement_method?: 'cbdc' | 'upi' | 'crypto' | 'demo';
  settlement_status: 'pending' | 'completed' | 'failed';
  blockchain_tx_hash?: string;
  created_at: string;
};

export type Portfolio = {
  id: string;
  user_id: string;
  token_id: string;
  balance: number;
  locked_balance: number;
  average_buy_price?: number;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  details?: any;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
};
