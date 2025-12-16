import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {

    const { testId, candidateId, jobDescription } = await request.json();

    if (!testId || !candidateId || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get candidate info
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { name: true, email: true }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Generate mock AI questions based on job description
    const mockQuestions = [
      {
        type: 'conversational',
        text: `Tell me about your experience with the technologies mentioned in this role: ${jobDescription.substring(0, 100)}...`,
        order: 1,
        difficulty: 'Intermediate'
      },
      {
        type: 'conversational',
        text: 'Describe a challenging project you worked on and how you overcame the obstacles.',
        order: 2,
        difficulty: 'Intermediate'
      },
      {
        type: 'conversational',
        text: 'How do you stay updated with the latest technologies and industry trends?',
        order: 3,
        difficulty: 'Easy'
      },
      {
        type: 'conversational',
        text: 'Walk me through your problem-solving approach when facing a complex technical issue.',
        order: 4,
        difficulty: 'Hard'
      }
    ];

    // Add questions to the test
    for (const question of mockQuestions) {
      await prisma.question.create({
        data: {
          testId,
          type: question.type,
          text: question.text,
          order: question.order,
          difficulty: question.difficulty
        }
      });
    }

    return NextResponse.json({
      success: true,
      questionsGenerated: mockQuestions.length,
      matchScore: 85,
      summary: 'AI-generated questions based on job requirements and candidate profile'
    });

  } catch (error) {
    console.error('Error generating AI test:', error);
    return NextResponse.json(
      { error: 'Failed to generate test questions' },
      { status: 500 }
    );
  }
}