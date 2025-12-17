import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId } = await request.json();
    const { testId } = params;

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Verify the test belongs to the current user
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { createdBy: true }
    });

    if (!test || test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });
    }

    // Find the specific assignment for this candidate
    const assignment = await prisma.testAssignment.findFirst({
      where: {
        testId,
        candidateId,
        status: { in: ['pending', 'in_progress'] } // Only unassign if not completed
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'No active assignment found for this candidate' }, { status: 404 });
    }

    // Delete only this candidate's assignment and related data
    await prisma.$transaction(async (tx: any) => {
      // Delete violations for this specific assignment
      await tx.violation.deleteMany({
        where: {
          proctorSession: {
            testAssignmentId: assignment.id
          }
        }
      });

      // Delete proctor sessions for this assignment
      await tx.proctorSession.deleteMany({
        where: { testAssignmentId: assignment.id }
      });

      // Delete answers for this assignment
      await tx.answer.deleteMany({
        where: { testAssignmentId: assignment.id }
      });

      // Delete only this specific assignment (other candidates keep their assignments)
      await tx.testAssignment.delete({
        where: { id: assignment.id }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error unassigning test:', error);
    return NextResponse.json({ error: 'Failed to unassign test' }, { status: 500 });
  }
}