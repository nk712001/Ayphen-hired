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
          select: {
            id: true,
            title: true,
            duration: true,
            requiresSecondaryCamera: true,
            jobDescription: true,
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
      return NextResponse.json({ error: 'Test assignment not found' }, { status: 404 });
    }

    // Generate AI-based questions for preview (without saving to database)
    let questionCounts = { mcqCount: 3, conversationalCount: 2, codingCount: 1 };
    let previewQuestions: any[] = [];

    try {
      // Use the resume from the test (interviewer-uploaded) or candidate profile
      const resumeUrl = assignment.test.resumeUrl || assignment.candidate.resumeUrl;

      if (resumeUrl) {
        // Generate personalized questions based on resume and job description
        const questionsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/generate-test-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: assignment.test.id,
            candidateId: assignment.candidate.id,
            mcqCount: questionCounts.mcqCount,
            conversationalCount: questionCounts.conversationalCount,
            codingCount: questionCounts.codingCount
          })
        });

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          previewQuestions = questionsData.questions || [];
          console.log(`Generated ${previewQuestions.length} AI questions for preview`);
        }
      }
    } catch (error) {
      console.error('Error generating AI questions for preview:', error);
    }

    // If no AI questions generated, create sample questions for preview
    if (previewQuestions.length === 0) {
      previewQuestions = [
        {
          id: 'preview_mcq_1',
          type: 'multiple_choice',
          text: 'Sample multiple choice question about your technical expertise',
          metadata: {
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
          },
          difficulty: 'Medium',
          order: 1
        },
        {
          id: 'preview_conv_1',
          type: 'short_answer',
          text: 'Sample question about your experience with the technologies mentioned in the job description',
          metadata: { maxLength: 500 },
          difficulty: 'Medium',
          order: 2
        },
        {
          id: 'preview_code_1',
          type: 'code',
          text: 'Sample coding challenge related to the role requirements',
          metadata: {
            language: 'javascript',
            starterCode: '// Your solution here\nfunction solution() {\n  // Code here\n}'
          },
          difficulty: 'Hard',
          order: 3
        }
      ];
    }

    // Create test preview with personalized content
    const testPreview = {
      assignmentId: assignment.id,
      testTitle: assignment.test.title,
      duration: assignment.test.duration,
      candidateName: assignment.candidate.name,
      candidateEmail: assignment.candidate.email,
      questionCounts: {
        mcqCount: previewQuestions.filter((q: any) => q.type === 'multiple_choice').length,
        conversationalCount: previewQuestions.filter((q: any) => q.type === 'short_answer' || q.type === 'essay').length,
        codingCount: previewQuestions.filter((q: any) => q.type === 'code').length
      },
      requiresSecondaryCamera: assignment.test.requiresSecondaryCamera,
      uniqueLink: assignment.uniqueLink,
      status: assignment.status,
      createdAt: assignment.createdAt,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt,
      sampleQuestions: previewQuestions.slice(0, 3), // Show first 3 questions as preview
      jobDescription: assignment.test.jobDescription,
      resumeUsed: assignment.test.resumeUrl || assignment.candidate.resumeUrl ? 'Yes' : 'No',
      aiGenerated: previewQuestions.length > 0 ? 'Yes' : 'No'
    };

    return NextResponse.json({
      assignment: testPreview,
      message: 'Test preview generated successfully'
    });

  } catch (error) {
    console.error('Error generating test preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate test preview' },
      { status: 500 }
    );
  }
}
