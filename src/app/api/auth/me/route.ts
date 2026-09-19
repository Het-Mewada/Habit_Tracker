import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      groqApiKey: true,
      geminiApiKey: true,
      requireMin7DaysAi: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, timezone, groqApiKey, geminiApiKey, requireMin7DaysAi } = await req.json();

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(groqApiKey !== undefined && { groqApiKey }),
        ...(geminiApiKey !== undefined && { geminiApiKey }),
        ...(requireMin7DaysAi !== undefined && { requireMin7DaysAi: Boolean(requireMin7DaysAi) }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        groqApiKey: true,
        geminiApiKey: true,
        requireMin7DaysAi: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err: unknown) {
    console.error('Update user settings error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
