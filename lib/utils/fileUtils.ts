/**
 * File Utility Functions
 * Robust file handling utilities
 */

import crypto from 'crypto';

/**
 * Extract file extension safely
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex <= 0) return ''; // No extension or hidden file
  return filename.substring(lastDotIndex + 1);
}

/**
 * Generate unique filename with UUID
 */
export function generateUniqueFilename(
  prefix: string,
  originalFilename: string
): string {
  const ext = getFileExtension(originalFilename);
  const uniqueId = crypto.randomUUID();
  return ext ? `${prefix}_${uniqueId}.${ext}` : `${prefix}_${uniqueId}`;
}

/**
 * Generate unique path for file storage
 * Handles trailing slashes to avoid double slashes
 */
export function generateFilePath(
  basePath: string,
  filename: string
): string {
  const normalizedBase = basePath.replace(/\/+$/, ''); // Remove trailing slashes
  return `${normalizedBase}/${filename}`;
}

/**
 * Extract file path from Supabase public URL
 */
export function extractFilePathFromUrl(
  url: string,
  bucketName: string
): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucketName);
    
    if (bucketIndex === -1) {
      return null;
    }
    
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    return null;
  }
}
