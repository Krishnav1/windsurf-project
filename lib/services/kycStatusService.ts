/**
 * KYC Status Service
 * Centralized service for updating user KYC status
 * Prevents race conditions by providing single source of truth
 */

import { supabaseAdmin } from '@/lib/supabase/client';

export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface BatchResult {
  userId: string;
  status?: KycStatus;
  error?: string;
}

/**
 * Calculate and update user's overall KYC status based on their documents
 * This is the single source of truth for status calculation
 */
export async function updateUserKycStatus(userId: string): Promise<KycStatus> {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not initialized');
  }

  // Fetch all user's KYC documents
  const { data: allUserDocs, error } = await supabaseAdmin
    .from('kyc_documents')
    .select('status')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch user documents: ${error.message}`);
  }

  // Handle edge cases - always update DB
  if (!allUserDocs || allUserDocs.length === 0) {
    // No documents = pending, update DB before returning
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ kyc_status: 'pending' })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update user status: ${updateError.message}`);
    }

    return 'pending';
  }

  // Calculate status
  const hasRejected = allUserDocs.some(doc => doc.status === 'rejected');
  const allApproved = allUserDocs.every(doc => doc.status === 'approved');

  let userKycStatus: KycStatus;
  if (allApproved) {
    userKycStatus = 'approved';
  } else if (hasRejected) {
    userKycStatus = 'rejected';
  } else {
    userKycStatus = 'pending';
  }

  // Update user record
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ kyc_status: userKycStatus })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update user status: ${updateError.message}`);
  }

  return userKycStatus;
}

/**
 * Batch update KYC status for multiple users
 * Prevents race conditions by processing sequentially
 * Returns both successes and failures for proper error handling
 */
export async function batchUpdateKycStatus(
  userIds: string[]
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  
  // Process sequentially to avoid race conditions
  for (const userId of userIds) {
    try {
      const status = await updateUserKycStatus(userId);
      results.push({ userId, status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to update status for user ${userId}:`, errorMessage);
      results.push({ userId, error: errorMessage });
    }
  }
  
  return results;
}
