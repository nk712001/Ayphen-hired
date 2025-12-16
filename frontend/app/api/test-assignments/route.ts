import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId || (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const candidateId = searchParams.get('candidateId');
    const status = searchParams.get('status');
    const organizationId = searchParams.get('organizationId');

    // Build where clause
    const where: any = {
      companyId: session.user.companyId
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (testId) {
      where.testId = testId;
    }

    if (candidateId) {
      where.candidateId = candidateId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch assignments with related data
    const assignments = await prisma.testAssignment.findMany({
      where,
      include: {
        test: {
          select: {
            id: true,
            title: true,
            duration: true,
            requiresSecondaryCamera: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enhance assignments with additional data
    const enhancedAssignments = assignments.map((assignment: any) => ({
      id: assignment.id,
      uniqueLink: assignment.uniqueLink,
      status: assignment.status,
      createdAt: assignment.createdAt,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt,
      test: assignment.test,
      candidate: assignment.candidate,
      testAttempt: null, // Will be fetched separately if needed
      emailSent: true, // We'll assume email was sent for now
      lastActivity: assignment.startedAt || assignment.createdAt
    }));

    return NextResponse.json({
      assignments: enhancedAssignments,
      total: enhancedAssignments.length
    });

  } catch (error) {
    console.error('Error fetching test assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test assignments' },
      { status: 500 }
    );
  }
}
