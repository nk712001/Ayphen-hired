import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/tests/[testId]/questions - Fetch all questions for a test
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const allowedRoles = ['INTERVIEWER', 'COMPANY_ADMIN', 'RECRUITER'];
    if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = params;

    // Verify test exists and user owns it
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { creator: true }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch questions
    const questions = await prisma.question.findMany({
      where: { testId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      questions: questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        metadata: q.metadata,
        difficulty: q.difficulty,
        order: q.order,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/tests/[testId]/questions - Create/Update questions for a test
export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const allowedRoles = ['INTERVIEWER', 'COMPANY_ADMIN', 'RECRUITER'];
    if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = params;
    const { questions, replaceAll = false } = await request.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid questions data' }, { status: 400 });
    }

    // Verify test exists and user owns it
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { creator: true }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate questions
    for (const question of questions) {
      if (!question.type || !question.text || question.order === undefined) {
        return NextResponse.json({
          error: 'Each question must have type, text, and order'
        }, { status: 400 });
      }

      if (!['multiple_choice', 'essay', 'code'].includes(question.type)) {
        return NextResponse.json({
          error: 'Invalid question type'
        }, { status: 400 });
      }

      // Validate MCQ questions have options
      if (question.type === 'multiple_choice') {
        if (!question.metadata?.options || !Array.isArray(question.metadata.options) ||
          question.metadata.options.length < 2) {
          return NextResponse.json({
            error: 'Multiple choice questions must have at least 2 options'
          }, { status: 400 });
        }

        if (question.metadata.correctAnswer === undefined ||
          question.metadata.correctAnswer < 0 ||
          question.metadata.correctAnswer >= question.metadata.options.length) {
          return NextResponse.json({
            error: 'Multiple choice questions must have a valid correct answer'
          }, { status: 400 });
        }
      }
    }

    // If replaceAll is true, delete existing questions and their answers
    if (replaceAll) {
      // First get all question IDs for this test
      const existingQuestions = await prisma.question.findMany({
        where: { testId },
        select: { id: true }
      });

      const existingQuestionIds = existingQuestions.map((q: any) => q.id);

      // Delete all answers that reference these questions first
      if (existingQuestionIds.length > 0) {
        await prisma.answer.deleteMany({
          where: {
            questionId: {
              in: existingQuestionIds
            }
          }
        });
      }

      // Now delete all questions
      await prisma.question.deleteMany({
        where: { testId }
      });
    }

    // Create/update questions
    const savedQuestions = [];
    for (const questionData of questions) {
      let savedQuestion;

      if (questionData.id && questionData.id.startsWith('manual_') && !replaceAll) {
        // This is a new manual question, create it
        savedQuestion = await prisma.question.create({
          data: {
            testId,
            type: questionData.type,
            text: questionData.text,
            metadata: questionData.metadata ? JSON.stringify(questionData.metadata) : null,
            difficulty: questionData.difficulty || 'Medium',
            order: questionData.order,
            timeToStart: 0
          }
        });
      } else if (questionData.id && !questionData.id.startsWith('manual_')) {
        // This is an existing question, update it
        savedQuestion = await prisma.question.update({
          where: { id: questionData.id },
          data: {
            type: questionData.type,
            text: questionData.text,
            metadata: questionData.metadata ? JSON.stringify(questionData.metadata) : null,
            difficulty: questionData.difficulty || 'Medium',
            order: questionData.order
          }
        });
      } else {
        // Create new question
        savedQuestion = await prisma.question.create({
          data: {
            testId,
            type: questionData.type,
            text: questionData.text,
            metadata: questionData.metadata ? JSON.stringify(questionData.metadata) : null,
            difficulty: questionData.difficulty || 'Medium',
            order: questionData.order,
            timeToStart: 0
          }
        });
      }

      savedQuestions.push(savedQuestion);
    }

    console.log(`Successfully saved ${savedQuestions.length} questions for test ${testId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${savedQuestions.length} questions`,
      questions: savedQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        metadata: q.metadata,
        difficulty: q.difficulty,
        order: q.order
      }))
    });

  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
  }
}

// DELETE /api/tests/[testId]/questions - Delete all questions for a test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const allowedRoles = ['INTERVIEWER', 'COMPANY_ADMIN', 'RECRUITER'];
    if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = params;

    // Verify test exists and user owns it
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { creator: true }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // First, get all question IDs for this test
    const questions = await prisma.question.findMany({
      where: { testId },
      select: { id: true }
    });

    const questionIds = questions.map((q: any) => q.id);

    // Delete all answers that reference these questions first
    const deletedAnswers = await prisma.answer.deleteMany({
      where: {
        questionId: {
          in: questionIds
        }
      }
    });

    // Now delete all questions
    const deletedCount = await prisma.question.deleteMany({
      where: { testId }
    });

    console.log(`Deleted ${deletedAnswers.count} answers and ${deletedCount.count} questions for test ${testId}`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedAnswers.count} answers and ${deletedCount.count} questions`,
      deletedCount: deletedCount.count,
      deletedAnswersCount: deletedAnswers.count
    });

  } catch (error) {
    console.error('Error deleting questions:', error);
    return NextResponse.json({ error: 'Failed to delete questions' }, { status: 500 });
  }
}
