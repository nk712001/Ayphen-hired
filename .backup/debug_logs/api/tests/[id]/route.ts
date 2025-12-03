import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const test = await (prisma as any).test.findUnique({
      where: {
        id: params.id,
        createdBy: session.user.id
      },
      include: {
        assignments: {
          include: {
            candidate: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Error fetching test' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the test exists and belongs to this interviewer
    const test = await (prisma as any).test.findUnique({
      where: {
        id: params.id,
        createdBy: session.user.id
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Delete the test
    await (prisma as any).test.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json(
      { error: 'Error deleting test' },
      { status: 500 }
    );
  }
}
