/**
 * API Type Definitions
 * Centralized types to replace 'any' across the codebase
 */

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'issuer' | 'investor';
  full_name?: string;
  mobile?: string;
  kyc_status?: 'pending' | 'approved' | 'rejected';
  wallet_address?: string;
  created_at?: string;
  updated_at?: string;
  two_factor_enabled?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
}

// Document Types
export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  file_path?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_hash: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  verification_level?: string;
  uploaded_at: string;
  users?: User;
}

export interface IssuerDocument {
  id: string;
  token_id: string;
  issuer_id: string;
  document_type: string;
  document_category: string;
  file_url: string;
  file_path?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_hash: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
}

// Token Types
export interface Token {
  id: string;
  issuer_id: string;
  token_name: string;
  token_symbol: string;
  total_supply: string; // Use string to prevent precision loss for large numbers
  price_per_token: string; // Use string for precise decimal values
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'deployed';
  contract_address?: string;
  blockchain_tx_hash?: string;
  deployed_at?: string;
  created_at: string;
  updated_at?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Request Body Types
export interface KYCVerificationRequest {
  documentId: string;
  action: 'approve' | 'reject' | 'flag';
  comments?: string;
  verificationLevel?: 'L1' | 'L2' | 'L3';
}

export interface BulkActionRequest {
  documentIds: string[];
  action: 'approve' | 'reject';
  comments?: string;
}

// Blockchain Types
export interface BlockchainTransaction {
  hash: string;
  blockNumber?: number;
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  created_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}
