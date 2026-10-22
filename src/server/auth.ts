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
  createdAt: number;
  expiresAt: number;
}

// In-memory token store mapped to session
const activeSessions = new Map<string, SessionTokenPayload>();

export function generateSessionToken(user: { id: string; email: string; fullName: string; role: UserRole }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const payload: SessionTokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: now,
    expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
  };
  activeSessions.set(token, payload);
  return token;
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSessionToken(token: string): void {
  activeSessions.delete(token);
}
