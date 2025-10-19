/**
 * Authentication Utilities
 * 
 * Provides password hashing, JWT token generation, and 2FA functionality
 * Used for secure user authentication and session management
 */

import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export type AuthRole = 'investor' | 'issuer' | 'admin' | 'auditor';

export type AuthTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  role: AuthRole;
};

/**
 * Hash password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for authenticated user
 * @param userId - User ID
 * @param email - User email
 * @param role - User role
 * @returns JWT token string
 */
export function generateToken(userId: string, email: string, role: AuthRole): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error verifying token:', error.message);
    }
    return null;
  }
}

/**
 * Canonicalize JSON object for consistent string representation
 * @param obj - JSON object to canonicalize
 * @returns Canonicalized JSON string
 */
export function canonicalJSON<T extends Record<string, unknown>>(obj: T): string {
  const canonical = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = obj[key];
      return accumulator;
    }, {});

  return JSON.stringify(canonical);
}

/**
 * Generate 2FA secret for user
 * @param userEmail - User's email address
 * @returns Object containing secret and QR code data URL
 */
export async function generate2FASecret(userEmail: string): Promise<{
  secret: string;
  qrCode: string;
}> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `TokenPlatform (${userEmail})`,
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

  return {
    secret: secret.base32,
    qrCode,
  };
}

/**
 * Verify 2FA token
 * @param token - 6-digit token from authenticator app
 * @param secret - User's 2FA secret
 * @returns True if token is valid
 */
export function verify2FAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after for clock drift
  });
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and error message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
}
