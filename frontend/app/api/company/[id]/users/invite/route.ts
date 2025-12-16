import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();
    const companyId = params.id;

    const existingUser = await (prisma as any).user.findUnique({
      where: { email }
    });

    if (existingUser) {
      await (prisma as any).user.update({
        where: { email },
        data: { companyId }
      });
      return NextResponse.json({ user: existingUser });
    }

    const user = await (prisma as any).user.create({
      data: {
        email,
        role: role || 'USER',
        companyId,
        name: email.split('@')[0]
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
  }
}