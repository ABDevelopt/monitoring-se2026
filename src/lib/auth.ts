// src/lib/auth.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'monitoring-se2026-ppu-super-secret-key-at-least-32-chars';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
  userId: number;
  username: string;
  nama: string;
  role: 'admin' | 'korlap' | 'pml' | 'pcl';
  idKecamatan: number | null;
  expiresAt: string; // Stored as ISO string to prevent timezone/object serialization issues
}

export async function encrypt(payload: Omit<SessionPayload, 'expiresAt'> & { expiresAt: Date }) {
  const payloadToSign = {
    ...payload,
    expiresAt: payload.expiresAt.toISOString(),
  };

  return new SignJWT(payloadToSign)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session token:', error);
    return null;
  }
}

export async function createSession(user: {
  id: number;
  username: string;
  nama: string;
  role: 'admin' | 'korlap' | 'pml' | 'pcl';
  idKecamatan: number | null;
}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const sessionToken = await encrypt({
    userId: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    idKecamatan: user.idKecamatan,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  return decrypt(sessionToken);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function updateSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;

  const payload = await decrypt(sessionToken);
  if (!payload) return null;

  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset to 7 days
  const updatedToken = await encrypt({
    userId: payload.userId,
    username: payload.username,
    nama: payload.nama,
    role: payload.role,
    idKecamatan: payload.idKecamatan,
    expiresAt: newExpiresAt,
  });

  cookieStore.set('session', updatedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: newExpiresAt,
    sameSite: 'lax',
    path: '/',
  });
  
  return payload;
}
