import * as crypto from 'crypto';

/**
 * Deterministically hashes a token string into a 24-character hex string.
 * This is used to map an arbitrary authToken header to a valid MongoDB ObjectId.
 */
export function hashTokenToId(token: string): string {
  if (!token) return '';
  // Clean 'Bearer ' prefix if present
  const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
  const hash = crypto.createHash('sha256').update(cleanToken).digest('hex');
  return hash.substring(0, 24); // 24-character hex string
}
