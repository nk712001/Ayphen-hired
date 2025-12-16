import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentResults = await prisma.testAssignment.findUnique({
      where: { id: params.id },
      include: {
        answers: {
          include: {
            question: {
              select: { id: true, text: true, type: true, order: true, difficulty: true }
            }
          },
          orderBy: { question: { order: 'asc' } }
        },
        candidate: {
          select: { id: true, name: true, email: true }
        },
        test: {
          include: {
            questions: {
              select: { id: true, text: true, type: true, order: true, difficulty: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!assignmentResults) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Only allow access if user is the interviewer who created the test
    if (assignmentResults.test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only view results for tests you created' }, { status: 403 });
    }

    // Filter questions to match what the candidate saw (same logic as assignment API)
    if (assignmentResults.test.questions) {
      // 1. Identify answered questions
      const answeredQuestionIds = new Set(assignmentResults.answers.map(a => a.questionId));

      // 2. Deduplicate by TEXT, prioritizing answered questions
      const uniqueQuestions = new Map<string, any>();

      // Sort by order first to keep the "original" or intended order preference
      assignmentResults.test.questions.sort((a, b) => a.order - b.order);

      for (const q of assignmentResults.test.questions) {
        const existing = uniqueQuestions.get(q.text);

        if (!existing) {
          // New text encountered, add it
          uniqueQuestions.set(q.text, q);
        } else {
          // Text already exists. Check if we should replace it.
          // Replace if the current question 'q' was answered but 'existing' was not.
          if (answeredQuestionIds.has(q.id) && !answeredQuestionIds.has(existing.id)) {
            uniqueQuestions.set(q.text, q);
          }
        }
      }

      const distinctQuestions = Array.from(uniqueQuestions.values());

      // 2. Apply type-based slicing on the UNIQUE set
      const mcqQuestions = distinctQuestions.filter(q => q.type === 'multiple_choice').slice(0, assignmentResults.test.mcqQuestions);
      const conversationalQuestions = distinctQuestions.filter(q => q.type === 'conversational' || q.type === 'essay').slice(0, assignmentResults.test.conversationalQuestions);
      const codingQuestions = distinctQuestions.filter(q => q.type === 'code' || q.type === 'coding').slice(0, assignmentResults.test.codingQuestions);

      assignmentResults.test.questions = [...mcqQuestions, ...conversationalQuestions, ...codingQuestions]
        .sort((a, b) => a.order - b.order);
    }

    return NextResponse.json(assignmentResults);
  } catch (error) {
    console.error('Error fetching assignment results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}