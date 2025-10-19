/**
 * Cryptographic Hashing Utilities
 * 
 * Provides SHA-256 hashing for document verification and on-chain anchoring
 * Used for creating immutable proofs of asset documents and metadata
 */

import crypto from 'crypto';

/**
 * Compute SHA-256 hash of a string
 * @param data - Input string to hash
 * @returns Hexadecimal hash string
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compute SHA-256 hash of a file buffer
 * @param buffer - File buffer to hash
 * @returns Hexadecimal hash string
 */
export function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Create canonical JSON string for consistent hashing
 * Ensures field order is deterministic for reproducible hashes
 * 
 * @param obj - Object to canonicalize
 * @returns Canonical JSON string
 */
export function canonicalJSON<T extends Record<string, unknown>>(obj: T): string {
  // Sort keys alphabetically for consistent ordering
  const sortedKeys = Object.keys(obj).sort();
  const canonical: Record<string, unknown> = {};

  sortedKeys.forEach((key) => {
    canonical[key] = obj[key];
  });

  return JSON.stringify(canonical);
}

/**
 * Compute metadata hash for token issuance
 * Creates a deterministic hash from token metadata
 * 
 * @param metadata - Token metadata object
 * @returns SHA-256 hash of canonical metadata
 */
export function computeMetadataHash(metadata: {
  issuerLegalName: string;
  assetType: string;
  assetUID: string;
  valuationDate: string;
  valuationAmount: number;
  custodianName?: string;
  custodyProofID?: string;
  timestamp: string;
}): string {
  const canonical = canonicalJSON(metadata);
  return sha256(canonical);
}

/**
 * Compute deterministic identity hash compatible with on-chain bytes32 requirements
 */
export function computeIdentityHash(identity: Record<string, unknown>): string {
  const canonical = canonicalJSON(identity);
  const digest = sha256(canonical);
  return `0x${digest}`;
}

/**
 * Verify document hash matches expected hash
 * Used for audit and compliance verification
 * 
 * @param documentBuffer - Document file buffer
 * @param expectedHash - Expected SHA-256 hash
 * @returns True if hashes match
 */
export function verifyDocumentHash(documentBuffer: Buffer, expectedHash: string): boolean {
  const computedHash = sha256Buffer(documentBuffer);
  return computedHash === expectedHash;
}

/**
 * Generate unique asset UID
 * Combines issuer info and timestamp for uniqueness
 * 
 * @param issuerName - Legal name of issuer
 * @param assetType - Type of asset
 * @returns Unique asset identifier
 */
export function generateAssetUID(issuerName: string, assetType: string): string {
  const timestamp = Date.now();
  const data = `${issuerName}-${assetType}-${timestamp}`;
  return sha256(data).substring(0, 16).toUpperCase();
}
