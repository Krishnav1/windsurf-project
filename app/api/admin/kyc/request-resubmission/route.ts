/**
 * Admin Request Document Resubmission API
 * Allows admin to request specific document resubmission from user
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, documentId, documentType, reason } = await request.json();

    if (!userId || !documentType || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Mark document as requiring resubmission
    if (documentId) {
      await supabaseAdmin
        .from('kyc_documents')
        .update({
          status: 'resubmission_required',
          rejection_reason: reason,
          reviewed_by: decoded.userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', documentId);
    }

    // Create notification for user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'kyc_resubmission_required',
        title: 'Document Resubmission Required',
        message: `Please reupload your ${documentType.replace('_', ' ')}. Reason: ${reason}`,
        priority: 'high',
        metadata: {
          document_type: documentType,
          document_id: documentId,
          reason: reason,
          requested_by: decoded.userId
        },
        created_at: new Date().toISOString()
      });

    // Log audit
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'kyc_resubmission_requested',
        resource_type: 'kyc_documents',
        resource_id: documentId,
        details: {
          target_user_id: userId,
          document_type: documentType,
          reason: reason
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: 'Resubmission request sent to user'
    });

  } catch (error) {
    logError('Request Resubmission', error as Error);
    return NextResponse.json(
      { error: 'Failed to send resubmission request' },
      { status: 500 }
    );
  }
}
