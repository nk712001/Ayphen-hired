import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.testId;

    // Get test with assignments and answers
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        assignments: {
          where: { status: 'completed' },
          include: {
            candidate: {
              select: { id: true, name: true, email: true }
            },
            answers: {
              include: {
                question: {
                  select: { id: true, text: true, type: true, order: true }
                }
              },
              orderBy: { question: { order: 'asc' } }
            }
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Only allow access if user is the test creator
    if (test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        jobDescription: test.jobDescription
      },
      assignments: test.assignments
    });

  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json({ error: 'Failed to fetch test results' }, { status: 500 });
  }
}