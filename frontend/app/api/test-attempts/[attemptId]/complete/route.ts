import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { answers } = await request.json();

    // Get the test assignment
    const assignment = await prisma.testAssignment.findUnique({
      where: { uniqueLink: params.attemptId },
      select: { id: true, testId: true }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Update test assignment status
    await prisma.testAssignment.update({
      where: { uniqueLink: params.attemptId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Save all answers - create questions if they don't exist
    for (const [questionId, answer] of Object.entries(answers)) {
      // Check if question exists, if not create it
      let question = await prisma.question.findUnique({
        where: { id: questionId }
      });
      
      if (!question) {
        // Create the question if it doesn't exist
        question = await prisma.question.create({
          data: {
            id: questionId,
            testId: assignment.testId,
            type: 'short_answer',
            text: `Generated question ${questionId}`,
            order: parseInt(questionId.split('_')[1]) || 1
          }
        });
      }
      
      await prisma.answer.create({
        data: {
          questionId,
          testAssignmentId: assignment.id,
          content: answer as string,
          submittedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing test:', error);
    return NextResponse.json({ error: 'Failed to complete test' }, { status: 500 });
  }
}