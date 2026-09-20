import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrGenerateAiInsights } from '@/lib/ai/service';
import { db } from '@/lib/db';
import { DEFAULT_TIMEZONE } from '@/lib/date-utils';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });

  try {
    const { insight, isCached } = await getOrGenerateAiInsights(
      session.userId,
      user?.timezone || DEFAULT_TIMEZONE,
      false // do NOT force refresh on GET, return cached version!
    );

    return NextResponse.json({ insight, isCached });
  } catch (err: unknown) {
    console.error('Fetch insights error:', err);
    return NextResponse.json({ error: 'Failed to fetch AI insights' }, { status: 500 });
  }
}

export async function POST() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });

  try {
    const { insight, isCached } = await getOrGenerateAiInsights(
      session.userId,
      user?.timezone || DEFAULT_TIMEZONE,
      true // FORCE REFRESH when user clicks refresh button or explicitly posts!
    );

    return NextResponse.json({ insight, isCached });
  } catch (err: unknown) {
    console.error('Generate insights error:', err);
    return NextResponse.json({ error: 'Failed to generate AI insights' }, { status: 500 });
  }
}
