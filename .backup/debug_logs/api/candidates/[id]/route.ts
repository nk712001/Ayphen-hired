import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the candidate exists
    const candidate = await (prisma as any).candidate.findUnique({
      where: {
        id: params.id
      },
      include: {
        assignments: true
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Delete all test assignments for this candidate first
    if (candidate.assignments.length > 0) {
      await (prisma as any).testAssignment.deleteMany({
        where: {
          candidateId: params.id
        }
      });
    }

    // Delete the candidate
    await (prisma as any).candidate.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Error deleting candidate' },
      { status: 500 }
    );
  }
}
