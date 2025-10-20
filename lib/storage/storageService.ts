/**
 * Storage Service Wrapper
 * Provides robust error handling for Supabase Storage operations
 */

import { supabaseAdmin } from '@/lib/supabase/client';

export interface UploadResult {
  publicUrl: string;
  filePath: string;
}

/**
 * Upload file and get public URL with proper error handling
 */
export async function uploadWithPublicUrl(
  bucket: string,
  fileName: string,
  file: File | Buffer,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<UploadResult> {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not initialized');
  }

  // Upload file
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType: options?.contentType,
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false
    });

  if (uploadError || !uploadData?.path) {
    throw new Error(`Upload failed: ${uploadError?.message || 'No path returned'}`);
  }

  // Use the actual uploaded path from Supabase (may differ from fileName)
  const actualPath = uploadData.path;

  // Get public URL using the actual path
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(actualPath);

  if (!urlData?.publicUrl) {
    // Rollback: delete uploaded file using actual path
    await supabaseAdmin.storage.from(bucket).remove([actualPath]);
    throw new Error('Failed to get public URL');
  }

  return {
    publicUrl: urlData.publicUrl,
    filePath: actualPath // Return actual path, not input fileName
  };
}

/**
 * Delete file from storage with error handling
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
