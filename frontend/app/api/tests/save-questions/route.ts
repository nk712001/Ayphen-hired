import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { testId, questions } = await request.json();

    if (!testId || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('Saving questions for test:', testId);
    console.log('Questions to save:', questions.length);

    // First, delete existing questions for this test to prevent duplicates
    await prisma.question.deleteMany({
      where: { testId }
    });

    console.log('Deleted existing questions for test:', testId);

    // Create new questions with fresh IDs
    const savedQuestions = await Promise.all(
      questions.map(async (question: any, index: number) => {
        const savedQuestion = await prisma.question.create({
          data: {
            testId,
            type: question.type,
            text: question.text,
            metadata: typeof question.metadata === 'object' ? JSON.stringify(question.metadata) : (question.metadata || null),
            order: question.order || (index + 1),
            difficulty: question.difficulty || 'Medium'
          }
        });

        console.log(`Created question ${index + 1}: ${savedQuestion.id} (${savedQuestion.type})`);
        return savedQuestion;
      })
    );

    console.log('Successfully saved', savedQuestions.length, 'questions');

    return NextResponse.json({
      success: true,
      message: 'Questions saved successfully',
      count: savedQuestions.length,
      questions: savedQuestions.map(q => ({ id: q.id, type: q.type, order: q.order }))
    });

  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
  }
}