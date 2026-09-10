import { requireAuth } from '@/lib/auth-helpers';
import { auth } from '@workspace/auth/server';
import { passwordSchema } from '@workspace/contracts';
import { prisma } from '@workspace/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { error, session } = await requireAuth(req);
    if (error) return error;

    // Check if user has a password in their account
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'credential',
      },
      select: {
        password: true,
      },
    });

    const hasPassword = !!account?.password;

    return NextResponse.json({ hasPassword });
  } catch (error) {
    console.error('Error checking password status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, session } = await requireAuth(req);
    if (error) return error;

    const { newPassword } = await req.json();

    const { success, error: validationError } = passwordSchema.safeParse(newPassword);
    if (validationError || !success) {
      return NextResponse.json(
        { error: 'Password must be 8-100 characters long' },
        { status: 400 },
      );
    }

    // Check if user already has a credential account with password
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'credential',
      },
    });

    if (existingAccount?.password) {
      return NextResponse.json(
        {
          error: 'Password already exists. Please use change password instead.',
        },
        { status: 400 },
      );
    }

    const result = await auth.api.setPassword({
      body: { newPassword },
      headers: req.headers,
    });

    if (!result.status) {
      return NextResponse.json({ error: 'Failed to set password' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
