/**
 * Cryptographic Authentication & Password Management
 * Uses native node:crypto PBKDF2 with salt for server security
 */

import crypto from 'node:crypto';
import type { UserRole } from '../types/index.ts';

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';

export interface HashedPassword {
  hash: string;
  salt: string;
}

export function hashPassword(password: string): HashedPassword {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
}

export interface SessionTokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  companyName?: string;
  address?: string;
  createdAt: number;
  expiresAt: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'aamaster_sokoto_cement_kalambaina_secret_key_v4';
const activeSessions = new Map<string, SessionTokenPayload>();
const revokedTokens = new Set<string>();

export function generateSessionToken(user: {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  companyName?: string;
  address?: string;
}): string {
  const now = Date.now();
  const payload: SessionTokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    companyName: user.companyName,
    address: user.address,
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  const token = `${payloadB64}.${sig}`;
  activeSessions.set(token, payload);
  return token;
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  if (!token || revokedTokens.has(token)) return null;

  // Check signed stateless token format first
  if (token.includes('.')) {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
    if (sig !== expectedSig) return null;
    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as SessionTokenPayload;
      if (Date.now() > payload.expiresAt) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  // Fallback for legacy in-memory token
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSessionToken(token: string): void {
  revokedTokens.add(token);
  activeSessions.delete(token);
}
