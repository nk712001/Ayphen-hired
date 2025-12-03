import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tests = await (prisma as any).test.findMany({
      where: {
        createdBy: session.user.id
      },
      include: {
        assignments: {
          include: {
            candidate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Error fetching tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, jobDescription, duration, requiresSecondaryCamera } = await request.json();

    if (!title || typeof duration !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const test = await (prisma as any).test.create({
      data: {
        title,
        jobDescription,
        duration,
        requiresSecondaryCamera: Boolean(requiresSecondaryCamera),
        createdBy: session.user.id
      }
    });

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { error: 'Error creating test' },
      { status: 500 }
    );
  }
}
