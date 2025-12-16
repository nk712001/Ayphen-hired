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

    const companyId = params.id;

    const [userCount, testCount, completedTests] = await Promise.all([
      (prisma as any).user.count({ where: { companyId } }),
      (prisma as any).test.count({ where: { organization: { companyId } } }),
      (prisma as any).testAssignment.count({ 
        where: { 
          status: 'completed',
          test: { organization: { companyId } }
        }
      })
    ]);

    const stats = {
      totalUsers: userCount,
      activeTests: testCount,
      completedTests,
      averageScore: 85,
      monthlyGrowth: 12,
      upcomingDeadlines: 3
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}