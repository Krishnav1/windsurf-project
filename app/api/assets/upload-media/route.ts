/**
 * Upload Media API
 * Upload images/videos for assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import crypto from 'crypto';
import { uploadWithPublicUrl } from '@/lib/storage/storageService';
import { sanitizeError, logError } from '@/lib/utils/errorHandler';

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

    // Upload to Supabase Storage with proper error handling
    const lastDotIndex = file.name.lastIndexOf('.');
    const fileExt = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
    const uniqueId = crypto.randomUUID();
    const fileName = fileExt ? `${assetId}/${uniqueId}.${fileExt}` : `${assetId}/${uniqueId}`;
    const bucket = mediaType === 'image' ? 'assets-images' : 'assets-videos';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl: string;
    let filePath: string;
    
    try {
      const uploadResult = await uploadWithPublicUrl(
        bucket,
        fileName,
        buffer,
        { contentType: file.type, upsert: false }
      );
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
    } catch (uploadError) {
      logError('Asset Media Upload', uploadError as Error, { assetId });
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Save to database with file_path first
    const { data: media, error: dbError } = await supabaseAdmin
      .from('asset_media')
      .insert({
        asset_id: assetId,
        media_type: mediaType,
        file_url: publicUrl,
        file_path: filePath,
        file_size: file.size,
        is_primary: false // Always insert as false first
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete uploaded file to prevent orphaned files
      try {
        await supabaseAdmin.storage
          .from(bucket)
          .remove([filePath]);
      } catch (cleanupError) {
        logError('File Cleanup Failed', cleanupError as Error, { filePath, assetId });
      }
      logError('Asset Media DB Insert', dbError, { assetId });
      return NextResponse.json({ error: 'Failed to save media' }, { status: 500 });
    }

    // If this should be primary, use atomic single query to prevent race condition
    let finalIsPrimary = false;
    if (isPrimary && mediaType === 'image') {
      // Atomic update: set all to false, then set this one to true in a single transaction
      const { error: atomicError } = await supabaseAdmin.rpc('set_primary_media', {
        p_asset_id: assetId,
        p_media_id: media.id,
        p_media_type: mediaType
      });
      
      if (atomicError) {
        // Fallback to sequential updates if RPC doesn't exist
        logError('Atomic Primary Update Failed, using fallback', atomicError, { assetId });
        
        const { error: resetError } = await supabaseAdmin
          .from('asset_media')
          .update({ is_primary: false })
          .eq('asset_id', assetId)
          .eq('media_type', 'image');
        
        if (!resetError) {
          const { error: setPrimaryError } = await supabaseAdmin
            .from('asset_media')
            .update({ is_primary: true })
            .eq('id', media.id);
          
          finalIsPrimary = !setPrimaryError;
          
          if (setPrimaryError) {
            logError('Set Primary Failed', setPrimaryError, { mediaId: media.id });
          }
        }
      } else {
        finalIsPrimary = true;
      }
    }

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: publicUrl,
        type: mediaType,
        isPrimary: finalIsPrimary // Return actual state from DB, not input
      }
    });

  } catch (error) {
    logError('Upload Media', error as Error);
    return NextResponse.json(
      { error: sanitizeError(error as Error) },
      { status: 500 }
    );
  }
}
