import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { uniqueLink: string } }
) {
  try {
    const assignment = await prisma.testAssignment.findUnique({
      where: {
        uniqueLink: params.uniqueLink
      },
      include: {
        test: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        answers: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check scheduling status
    const now = new Date();
    let scheduleStatus = 'open'; // 'open', 'upcoming', 'expired'

    if (assignment.isScheduled && assignment.scheduledStartTime && assignment.scheduledEndTime) {
      if (now < assignment.scheduledStartTime) {
        scheduleStatus = 'upcoming';
      } else if (now > assignment.scheduledEndTime) {
        scheduleStatus = 'expired';
      }
    }

    // Mark test as started if not already started AND open
    if (assignment.status === 'pending' && scheduleStatus === 'open') {
      await prisma.testAssignment.update({
        where: { uniqueLink: params.uniqueLink },
        data: {
          status: 'in_progress',
          startedAt: new Date()
        }
      });
    }

    // Filter questions according to test configuration
    if (assignment.test.questions) {
      const mcqQuestions = assignment.test.questions.filter((q: any) => q.type === 'multiple_choice').slice(0, assignment.test.mcqQuestions);
      const conversationalQuestions = assignment.test.questions.filter((q: any) => q.type === 'conversational' || q.type === 'essay').slice(0, assignment.test.conversationalQuestions);
      const codingQuestions = assignment.test.questions.filter((q: any) => q.type === 'code' || q.type === 'coding').slice(0, assignment.test.codingQuestions);

      // Combine and reorder questions
      assignment.test.questions = [...mcqQuestions, ...conversationalQuestions, ...codingQuestions]
        .sort((a: any, b: any) => a.order - b.order);
    }

    console.log('Assignment data:', JSON.stringify(assignment, null, 2));
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Error fetching assignment' },
      { status: 500 }
    );
  }
}