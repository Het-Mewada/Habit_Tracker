import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'habit_tracker_super_secret_jwt_key_2026_production'
);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('habit_session')?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function ensureUserInDb(session: JWTPayload) {
  let user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    user = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
    if (!user) {
      user = await db.user.create({
        data: {
          id: session.userId,
          email: session.email.toLowerCase(),
          name: session.name || 'User',
          passwordHash: '$2a$10$e8T1l2g9b0/examplehash',
          timezone: 'UTC',
        },
      });
    }
  }
  return user;
}

export const COOKIE_NAME = 'habit_session';
