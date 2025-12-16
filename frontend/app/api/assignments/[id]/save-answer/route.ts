import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check for unique link token in headers (Magic Link Auth)
    const token = request.headers.get('x-test-token');
    let isTokenAuth = false;

    if (!session?.user?.id && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, content, status } = await request.json();
    const assignmentId = params.id;

    // Log the incoming data for debugging
    console.log('Save answer request:', {
      assignmentId,
      questionId,
      contentLength: content ? content.length : 0,
    });

    // 1. Verify assignment exists and match token if provided
    const assignmentExists = await prisma.testAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        candidate: { select: { id: true, email: true } }
      }
    });

    if (!assignmentExists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // 2. Auth Check: Session vs Token
    if (token) {
      // If token provided, it MUST match the assignment's uniqueLink
      if (assignmentExists.uniqueLink !== token) {
        console.error(`Invalid token attempt for assignment ${assignmentId}`);
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }
      isTokenAuth = true;
    } else if (session?.user?.id) {
      // Session auth check
      const isOwner = assignmentExists.candidateId === session.user.id;
      const isEmailMatch = session.user.email && assignmentExists.candidate.email &&
        session.user.email.toLowerCase() === assignmentExists.candidate.email.toLowerCase();

      if (!isOwner && !isEmailMatch) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // 3. Get assignment context (if needed, though we have existence)
    // We already verified ownership, so we can use assignmentExists.id or fetch again if we need specific fields not in findUnique above?
    // Actually we just need to know it exists to save answer. 
    // Wait, the original code used findFirst expecting it to be found. 
    // We can proceed to save using assignmentId.


    // Check if answer already exists
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        questionId,
        testAssignmentId: assignmentId
      }
    });

    // Normalize content - convert null/undefined to empty string, but preserve actual empty strings
    const normalizedContent = content === null || content === undefined ? '' : content;
    const normalizedStatus = status || 'ANSWERED';

    let answer;
    if (existingAnswer) {
      // Update existing answer
      answer = await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          content: normalizedContent,
          status: normalizedStatus,
          submittedAt: new Date()
        }
      });
      console.log('Updated answer:', existingAnswer.id, 'with content:', normalizedContent);
    } else {
      // Create new answer
      answer = await prisma.answer.create({
        data: {
          questionId,
          testAssignmentId: assignmentId,
          content: normalizedContent,
          status: normalizedStatus,
          submittedAt: new Date()
        }
      });
      console.log('Created new answer:', answer.id, 'with content:', normalizedContent);
    }

    return NextResponse.json({ success: true, answer });

  } catch (error: any) {
    console.error('Error saving answer:', error);
    // Return specific error message for debugging
    return NextResponse.json({
      error: 'Failed to save answer',
      details: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    }, { status: 500 });
  }
}