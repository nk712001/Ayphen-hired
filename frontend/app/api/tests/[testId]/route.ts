import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause with organization filter if applicable
    // Build where clause with tenant isolation
    const whereClause: any = { id: params.testId };

    if (!session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    whereClause.companyId = session.user.companyId;

    // Get the test without assignments first
    const test = await prisma.test.findUnique({
      where: whereClause
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Create a mutable response object
    const responseTest: any = { ...test };

    // Get assignments for this test
    try {
      console.log('Fetching assignments for testId:', params.testId);
      const assignments = await prisma.testAssignment.findMany({
        where: {
          testId: params.testId
        }
      });
      console.log('Found assignments:', assignments.length, assignments);

      // Get candidate data for each assignment
      const assignmentsWithCandidates = [];
      for (const assignment of assignments) {
        if (assignment.candidateId) {
          const candidate = await prisma.candidate.findUnique({
            where: { id: assignment.candidateId },
            select: { id: true, name: true, email: true }
          });
          if (candidate) {
            assignmentsWithCandidates.push({ ...assignment, candidate });
          } else {
            console.log('Candidate not found for ID:', assignment.candidateId);
          }
        }
      }
      console.log('Assignments with candidates:', assignmentsWithCandidates.length);

      responseTest.assignments = assignmentsWithCandidates;
    } catch (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      responseTest.assignments = [];
    }

    return NextResponse.json({ test: responseTest });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Error fetching test', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, jobDescription, duration, requiresSecondaryCamera, mcqQuestions, conversationalQuestions, codingQuestions } = await request.json();

    // Verify ownership first
    const existingTest = await prisma.test.findFirst({
      where: {
        id: params.testId,
        companyId: session.user.companyId
      }
    });

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found or access denied' }, { status: 404 });
    }

    const test = await prisma.test.update({
      where: { id: params.testId },
      data: {
        title,
        jobDescription,
        duration,
        requiresSecondaryCamera,
        mcqQuestions: mcqQuestions || 5,
        conversationalQuestions: conversationalQuestions || 3,
        codingQuestions: codingQuestions || 2
      }
    });

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json(
      { error: 'Error updating test', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both RECRUITER and COMPANY_ADMIN to delete tests (if they own them or are admin)
    if (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the test exists and belongs to this interviewer AND company
    const test = await prisma.test.findFirst({
      where: {
        id: params.testId,
        companyId: session.user.companyId
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // For RECRUITERS, enforce ownership. COMPANY_ADMIN can delete any test in their company.
    if (session.user.role === 'RECRUITER' && test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the test
    await prisma.test.delete({
      where: {
        id: params.testId
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
