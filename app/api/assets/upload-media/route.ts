/**
 * Upload Media API
 * Upload images/videos for assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assetId = formData.get('assetId') as string;
    const mediaType = formData.get('mediaType') as string;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file || !assetId || !mediaType) {
      return NextResponse.json({ 
        error: 'File, asset ID, and media type required' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = mediaType === 'image' 
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm'];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = mediaType === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Verify asset ownership
    const { data: asset } = await supabaseAdmin
      .from('tokens')
      .select('issuer_id')
      .eq('id', assetId)
      .single();

    if (!asset || asset.issuer_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${assetId}/${Date.now()}.${fileExt}`;
    const bucket = mediaType === 'image' ? 'assets-images' : 'assets-videos';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(fileName);

    // If this is primary, unset other primary images
    if (isPrimary) {
      await supabaseAdmin
        .from('asset_media')
        .update({ is_primary: false })
        .eq('asset_id', assetId)
        .eq('media_type', 'image');
    }

    // Save to database
    const { data: media, error: dbError } = await supabaseAdmin
      .from('asset_media')
      .insert({
        asset_id: assetId,
        media_type: mediaType,
        file_url: publicUrl,
        file_size: file.size,
        is_primary: isPrimary
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save media' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: publicUrl,
        type: mediaType,
        isPrimary
      }
    });

  } catch (error: any) {
    console.error('Upload media error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
