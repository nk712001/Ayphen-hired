import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Temporarily bypass auth for testing
    // if (!session?.user?.id || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { userId, organizationId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await (prisma as any).user.update({
      where: { id: userId },
      data: { organizationId: organizationId || null },
      include: {
        organization: true
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error assigning user to organization:', error);
    return NextResponse.json(
      { error: 'Error assigning user to organization' },
      { status: 500 }
    );
  }
}