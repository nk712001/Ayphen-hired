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

    if (!session?.user?.id || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assignment to check if it can be canceled
    const assignment = await prisma.testAssignment.findUnique({
      where: { id: params.id },
      select: { status: true }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if assignment can be canceled
    if (assignment.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot cancel completed assignments' 
      }, { status: 400 });
    }

    // Delete the assignment
    await prisma.testAssignment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Assignment canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling assignment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel assignment' },
      { status: 500 }
    );
  }
}
