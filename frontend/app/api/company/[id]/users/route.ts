import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await (prisma as any).user.findMany({
      where: { companyId: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();
    
    const existingUser = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const user = await (prisma as any).user.update({
        where: { email },
        data: { companyId: params.id },
      });
      return NextResponse.json({ user });
    }

    const user = await (prisma as any).user.create({
      data: {
        email,
        role,
        companyId: params.id,
        name: email.split('@')[0],
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}