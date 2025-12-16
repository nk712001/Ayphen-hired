import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow INTERVIEWER, RECRUITER, and COMPANY_ADMIN roles
    const allowedRoles = ['INTERVIEWER', 'RECRUITER', 'COMPANY_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch assignment with all related data
    const assignment = await prisma.testAssignment.findUnique({
      where: {
        id: params.id
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            duration: true,
            jobDescription: true,
            requiresSecondaryCamera: true,
            mcqQuestions: true,
            conversationalQuestions: true,
            codingQuestions: true,
            resumeUrl: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            resumeUrl: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if there are existing personalized questions for this assignment
    const allQuestions = await prisma.question.findMany({
      where: {
        testId: assignment.test.id
      },
      orderBy: { order: 'asc' }
    });

    // Filter questions that belong to this specific assignment
    const existingQuestions = allQuestions.filter(question => {
      if (!question.metadata || typeof question.metadata !== 'string') return false;
      try {
        const metadata = JSON.parse(question.metadata);
        return metadata && typeof metadata === 'object' && metadata.assignmentId === params.id;
      } catch {
        return false;
      }
    });

    let questions: any[] = existingQuestions;
    let generatedFromResume = existingQuestions.length > 0;

    // If no assignment-specific questions, check if there are any real (non-sample) questions for the test
    if (questions.length === 0 && allQuestions.length > 0) {
      // Use all test questions if they exist (they're real, not samples)
      questions = allQuestions.map(q => ({
        ...q,
        metadata: typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
      }));
      generatedFromResume = true; // Questions exist, so don't show generate button
    }

    // If still no questions, create sample questions
    if (questions.length === 0) {
      questions = await generateSampleQuestions(assignment);
      generatedFromResume = false;
    }

    return NextResponse.json({
      assignment,
      questions,
      generatedFromResume,
      message: 'Assignment preview loaded successfully'
    });

  } catch (error) {
    console.error('Error fetching assignment preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment preview' },
      { status: 500 }
    );
  }
}

async function generateSampleQuestions(assignment: any) {
  const { test } = assignment;
  const sampleQuestions = [];
  let order = 1;

  // Generate sample MCQ questions
  for (let i = 0; i < (test.mcqQuestions || 0); i++) {
    sampleQuestions.push({
      id: `sample_mcq_${i + 1}`,
      type: 'multiple_choice',
      text: `Sample multiple choice question ${i + 1} related to the role requirements`,
      metadata: {
        options: [
          'Option A - Technical approach',
          'Option B - Alternative solution',
          'Option C - Best practice method',
          'Option D - Industry standard'
        ],
        correctAnswer: 0
      },
      difficulty: 'Medium',
      order: order++
    });
  }

  // Generate sample conversational questions
  for (let i = 0; i < (test.conversationalQuestions || 0); i++) {
    sampleQuestions.push({
      id: `sample_conv_${i + 1}`,
      type: 'short_answer',
      text: `Sample conversational question ${i + 1}: Describe your experience with the technologies mentioned in the job description`,
      metadata: { maxLength: 500 },
      difficulty: 'Medium',
      order: order++
    });
  }

  // Generate sample coding questions
  for (let i = 0; i < (test.codingQuestions || 0); i++) {
    sampleQuestions.push({
      id: `sample_code_${i + 1}`,
      type: 'code',
      text: `Sample coding challenge ${i + 1}: Implement a solution related to the role requirements`,
      metadata: {
        language: 'javascript',
        starterCode: `// Sample coding question ${i + 1}\nfunction solution() {\n  // Your implementation here\n  return null;\n}`
      },
      difficulty: 'Hard',
      order: order++
    });
  }

  return sampleQuestions;
}
