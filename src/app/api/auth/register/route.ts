import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, name, timezone } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        timezone: timezone || 'UTC',
      },
    });

    // Seed default sample habits with vector keys and muted architectural colors
    const defaultHabits = [
      { name: 'Code for 1 hour', icon: 'code', color: '#4a5d4e', category: 'Growth & Study' },
      { name: 'Study Core CS', icon: 'book', color: '#4a5d4e', category: 'Growth & Study' },
      { name: 'Workout / Exercise', icon: 'workout', color: '#4a5d4e', category: 'Health & Body' },
      { name: 'Daily Hydration', icon: 'water', color: '#4a5d4e', category: 'Health & Body' },
    ];

    for (const h of defaultHabits) {
      await db.habit.create({
        data: {
          userId: user.id,
          name: h.name,
          icon: h.icon,
          color: h.color,
          category: h.category,
        },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, timezone: user.timezone },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
