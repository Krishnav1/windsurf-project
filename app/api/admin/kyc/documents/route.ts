/**
 * Admin KYC Documents API
 * GET: List all KYC submissions
 * Supports filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
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
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('kyc_documents')
      .select(`
        *,
        users!kyc_documents_user_id_fkey (
          id,
          full_name,
          email,
          mobile,
          kyc_status
        )
      `, { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: documents, error, count } = await query;

    if (error) {
      throw error;
    }

    // Group documents by user
    const groupedByUser = documents?.reduce((acc: any, doc: any) => {
      const userId = doc.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user: doc.users,
          documents: []
        };
      }
      acc[userId].documents.push({
        id: doc.id,
        document_type: doc.document_type,
        file_url: doc.file_url,
        file_name: doc.file_name,
        file_hash: doc.file_hash,
        status: doc.status,
        uploaded_at: doc.uploaded_at,
        reviewed_by: doc.reviewed_by,
        reviewed_at: doc.reviewed_at,
        rejection_reason: doc.rejection_reason
      });
      return acc;
    }, {});

    const submissions = Object.values(groupedByUser || {});

    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Get KYC documents error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
