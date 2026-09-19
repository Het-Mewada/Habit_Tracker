import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

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

    await db.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete habit error:', err);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
