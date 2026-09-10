import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@workspace/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth(req);
    if (error) return error;

    await prisma.session.update({
      where: { id: session.session.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
