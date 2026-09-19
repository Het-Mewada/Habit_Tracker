import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateString, DEFAULT_TIMEZONE } from '@/lib/date-utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const existingHabit = await db.habit.findUnique({ where: { id } });
    if (!existingHabit || existingHabit.userId !== session.userId) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, icon, color, category, isArchived, isTimeSpecific, startTime, endTime } = body;

    const updated = await db.habit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(category !== undefined && { category }),
        ...(isArchived !== undefined && { isArchived: Boolean(isArchived) }),
        ...(isTimeSpecific !== undefined && { isTimeSpecific: Boolean(isTimeSpecific) }),
        ...(startTime !== undefined && { startTime: isTimeSpecific ? startTime : null }),
        ...(endTime !== undefined && { endTime: isTimeSpecific ? endTime : null }),
      },
    });

    if (isArchived !== undefined && Boolean(isArchived) !== existingHabit.isArchived) {
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { timezone: true },
      });
      const userTimezone = user?.timezone || DEFAULT_TIMEZONE;
      const todayStr = getTodayDateString(userTimezone);

      await db.habitEvent.create({
        data: {
          userId: session.userId,
          habitId: updated.id,
          habitName: updated.name,
          icon: updated.icon,
          category: updated.category,
          eventType: Boolean(isArchived) ? 'ARCHIVED' : 'RESTORED',
          date: todayStr,
        },
      });
    }

    return NextResponse.json({ habit: updated });
  } catch (err: unknown) {
    console.error('Update habit error:', err);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const existingHabit = await db.habit.findUnique({ where: { id } });
    if (!existingHabit || existingHabit.userId !== session.userId) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { timezone: true },
    });
    const userTimezone = user?.timezone || DEFAULT_TIMEZONE;
    const todayStr = getTodayDateString(userTimezone);

    // Record DELETED event before removing the habit record
    await db.habitEvent.create({
      data: {
        userId: session.userId,
        habitId: existingHabit.id,
        habitName: existingHabit.name,
        icon: existingHabit.icon,
        category: existingHabit.category,
        eventType: 'DELETED',
        date: todayStr,
      },
    });

    await db.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete habit error:', err);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
