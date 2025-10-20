/**
 * Admin KYC Verification API
 * POST: Approve or reject KYC documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { EncryptionService } from '@/lib/security/encryption';
import { updateUserKycStatus } from '@/lib/services/kycStatusService';
import { KYCRegistrationService } from '@/lib/blockchain/kycRegistration';
import { sanitizeError, logError } from '@/lib/utils/errorHandler';

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

    // Verify admin role
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { documentId, action, comments, verificationLevel } = body;

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'Document ID and action required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Validate verificationLevel if provided
    const validLevels = ['L1', 'L2', 'L3'];
    if (verificationLevel && !validLevels.includes(verificationLevel)) {
      return NextResponse.json(
        { error: 'Invalid verification level. Must be L1, L2, or L3' },
        { status: 400 }
      );
    }

    // Get document
    const { data: document, error: docError } = await supabaseAdmin
      .from('kyc_documents')
      .select('*, users!kyc_documents_user_id_fkey(*)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Encrypt comments if provided
    let encryptedComments = null;
    if (comments) {
      const encrypted = EncryptionService.encrypt(comments);
      encryptedComments = {
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      };
    }

    // Update document status
    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged';
    
    // Encrypt rejection reason if provided
    let encryptedRejection = null;
    if (action === 'reject' && comments) {
      const encrypted = EncryptionService.encrypt(comments);
      encryptedRejection = JSON.stringify({
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      });
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('kyc_documents')
      .update({
        status: newStatus,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: encryptedRejection,
        verification_level: verificationLevel || 'L1'
      })
      .eq('id', documentId);
    
    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    // Log verification history
    const { error: historyError } = await supabaseAdmin
      .from('document_verification_history')
      .insert({
        document_id: documentId,
        document_table: 'kyc_documents',
        action,
        performed_by: admin.id,
        comments_encrypted: encryptedComments?.encrypted,
        comments_iv: encryptedComments?.iv,
        comments_auth_tag: encryptedComments?.authTag,
        previous_status: document.status,
        new_status: newStatus,
        verification_method: 'manual',
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Failed to log verification history:', historyError);
      // Consider whether to fail the request or continue
    }

    // Update user's overall KYC status using centralized service
    const userKycStatus = await updateUserKycStatus(document.user_id);

    // BLOCKCHAIN REGISTRATION: If all documents approved, register on-chain
    let blockchainTxHash = null;
    if (action === 'approve' && userKycStatus === 'approved') {
      try {
        const user = document.users;
        
        // Check if user has wallet address
        if (user?.wallet_address) {
          console.log('[Blockchain] Registering KYC on-chain for user:', user.email);
          
          // Get IPFS hash from document
          const ipfsHash = document.ipfs_hash || 'default-hash';
          
          // Set KYC expiry to 1 year from now (IFSCA requirement)
          const kycExpiryDate = new Date();
          kycExpiryDate.setFullYear(kycExpiryDate.getFullYear() + 1);
          
          // Register on blockchain
          const blockchainResult = await KYCRegistrationService.registerKYCOnChain(
            user.wallet_address,
            ipfsHash,
            user.id,
            kycExpiryDate
          );
          
          blockchainTxHash = blockchainResult.txHash;
          
          console.log('[Blockchain] ✅ KYC registered on-chain:', blockchainTxHash);
          
          // Update user record with blockchain info
          await supabaseAdmin
            .from('users')
            .update({
              blockchain_kyc_verified: true,
              blockchain_kyc_tx_hash: blockchainTxHash,
              blockchain_kyc_expiry: kycExpiryDate.toISOString()
            })
            .eq('id', user.id);
          
          // Log blockchain registration
          await KYCRegistrationService.logBlockchainRegistration(
            user.id,
            user.wallet_address,
            blockchainTxHash,
            blockchainResult.identityHash,
            blockchainResult.kycExpiry
          );
          
        } else {
          console.warn('[Blockchain] User has no wallet address, skipping on-chain registration');
        }
      } catch (blockchainError: any) {
        // Log error but don't fail the approval
        console.error('[Blockchain] Failed to register on-chain:', blockchainError);
        logError('Blockchain KYC Registration', blockchainError, {
          userId: document.user_id,
          documentId,
          note: 'KYC approved in DB but blockchain registration failed'
        });
      }
    }

    // Create notification (without exposing sensitive comments)
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: document.user_id,
        type: 'kyc_status_update',
        title: `KYC ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Flagged'}`,
        message: action === 'approve'
          ? `Your ${document.document_type} document has been approved. Overall KYC status: ${userKycStatus}.`
          : action === 'reject'
          ? `Your ${document.document_type} document requires resubmission. Please check your email for details.`
          : 'Your KYC document has been flagged for additional review.',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      });
    
    if (notificationError) {
      logError('KYC Notification', notificationError, { documentId, userId: document.user_id });
      // Non-critical, continue
    }

    // Log audit
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: admin.id,
        action: `kyc_${action}`,
        resource_type: 'kyc_document',
        resource_id: documentId,
        details: {
          targetUser: document.users?.email || 'unknown',
          documentType: document.document_type,
          action,
          hasComments: !!comments,
          newUserStatus: userKycStatus
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });
    
    if (auditError) {
      logError('KYC Audit Log', auditError, { documentId, adminId: admin.id });
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      message: `Document ${action}ed successfully`,
      userKycStatus,
      blockchainRegistered: !!blockchainTxHash,
      blockchainTxHash
    });

  } catch (error) {
    logError('KYC Verification', error as Error);
    return NextResponse.json({ error: sanitizeError(error as Error) }, { status: 500 });
  }
}
