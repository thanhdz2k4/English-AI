import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? 'english_ai_session';
const SESSION_TTL_HOURS =
  Number(process.env.AUTH_SESSION_TTL_HOURS ?? 168) || 168;
const PASSWORD_ITERATIONS =
  Number(process.env.AUTH_PASSWORD_ITERATIONS ?? 100000) || 100000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = 'sha512';
const TOKEN_BYTES = 32;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const hash = crypto
    .pbkdf2Sync(
      password,
      salt,
      PASSWORD_ITERATIONS,
      PASSWORD_KEYLEN,
      PASSWORD_DIGEST
    )
    .toString('hex');

  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  try {
    const [iterationsRaw, salt, expectedHash] = storedHash.split(':');
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !expectedHash) return false;

    const derived = crypto
      .pbkdf2Sync(
        password,
        salt,
        iterations,
        PASSWORD_KEYLEN,
        PASSWORD_DIGEST
      )
      .toString('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const derivedBuffer = Buffer.from(derived, 'hex');
    if (expectedBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
  );

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromToken(token);
}

export async function getUserFromToken(token?: string) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.authSession.delete({ where: { tokenHash } }).catch(() => null);
    return null;
  }

  return session.user;
}

export async function revokeSessionByRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.authSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
