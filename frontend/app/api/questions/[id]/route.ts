import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Type assertion to access the question model
const prismaClient = prisma as any;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const question = await prismaClient.question.findUnique({
      where: { id: params.id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Parse metadata
    const parsedQuestion = {
      ...question,
      metadata: question.metadata ? JSON.parse(question.metadata) : {},
    };

    return NextResponse.json({ question: parsedQuestion });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Error fetching question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Prepare metadata based on question type
    let metadata: any = {};
    
    switch (data.type) {
      case 'multiple_choice':
        metadata = {
          options: data.options || [],
          correctAnswer: data.correctAnswer,
          points: data.points || 1
        };
        break;
        
      case 'short_answer':
        metadata = {
          expectedAnswer: data.expectedAnswer,
          acceptAlternateAnswers: data.acceptAlternateAnswers || false,
          alternateAnswers: data.alternateAnswers || [],
          points: data.points || 1
        };
        break;
        
      case 'essay':
        metadata = {
          minWords: data.minWords || 50,
          maxWords: data.maxWords || 1000,
          evaluationCriteria: data.evaluationCriteria || [],
          points: data.points || 10
        };
        break;
        
      case 'code':
        metadata = {
          language: data.language || 'javascript',
          starterCode: data.starterCode || '',
          testCases: data.testCases || [],
          timeLimit: data.timeLimit || 30,
          memoryLimit: data.memoryLimit || 512,
          points: data.points || 20
        };
        break;
    }

    const updatedQuestion = await prismaClient.question.update({
      where: { id: params.id },
      data: {
        type: data.type,
        text: data.text,
        difficulty: data.difficulty || 'Medium',
        timeToStart: data.timeLimit,
        order: data.order || 0,
        metadata: JSON.stringify(metadata)
      },
    });

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Error updating question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if question exists
    const question = await prismaClient.question.findUnique({
      where: { id: params.id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Delete the question
    await prismaClient.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Error deleting question' },
      { status: 500 }
    );
  }
}
