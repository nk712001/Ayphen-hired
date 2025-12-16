import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface TestAssignment {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  rating?: number | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  test: {
    id: string;
    title: string;
  };
  candidate: {
    id: string;
    name: string;
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId || (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get test assignments with their statuses
    // Filter by companyId for tenant isolation
    const whereClause: any = {
      companyId: session.user.companyId
    };

    // Add organization filter if provided
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const assignments = await (prisma as any).testAssignment.findMany({
      where: whereClause,
      include: {
        test: {
          select: {
            id: true,
            title: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter out assignments with null candidates
    const validAssignments = assignments.filter((assignment: any) => assignment.candidate !== null);

    // Calculate statistics
    const pendingCount = validAssignments.filter((assignment: any) => assignment.status === 'pending').length;
    const inProgressCount = validAssignments.filter((assignment: any) => assignment.status === 'in_progress').length;
    const completedCount = validAssignments.filter((assignment: any) => assignment.status === 'completed').length;

    // Calculate average rating (if you have ratings)
    const completedWithRatings = validAssignments.filter((assignment: any) =>
      assignment.status === 'completed' && assignment.rating !== null && assignment.rating !== undefined
    );
    const averageRating = completedWithRatings.length > 0
      ? completedWithRatings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / completedWithRatings.length
      : null;

    // Get recent activity (last 10 events)
    const recentActivity = validAssignments.slice(0, 10).map((assignment: any) => ({
      id: assignment.id,
      type: assignment.status === 'pending' ? 'assigned' : assignment.status,
      candidateName: assignment.candidate.name,
      testTitle: assignment.test.title,
      date: assignment.updatedAt?.toISOString() || assignment.createdAt.toISOString()
    }));

    // Get upcoming interviews (pending, in-progress, and completed)
    const upcomingInterviews = validAssignments
      .slice(0, 10)
      .map((assignment: any) => ({
        id: assignment.id,
        testId: assignment.test.id,
        candidateName: assignment.candidate.name,
        candidateEmail: assignment.candidate.email,
        testTitle: assignment.test.title,
        status: assignment.status,
        emailSent: assignment.emailSent || false,
        date: (assignment.startedAt || assignment.createdAt).toISOString()
      }));

    return NextResponse.json({
      stats: {
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        averageRating
      },
      recentActivity,
      upcomingInterviews
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Error fetching dashboard data' },
      { status: 500 }
    );
  }
}
