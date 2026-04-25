import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const COOKIE_NAME = 'mcp_session';
const ALG = 'HS256';

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short');
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  uid: string;
  username: string;
  role: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      uid: String(payload.uid),
      username: String(payload.username),
      role: String(payload.role ?? 'user'),
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const s = await readSession();
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.uid } });
}
