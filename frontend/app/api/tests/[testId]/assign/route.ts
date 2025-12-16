import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ['INTERVIEWER', 'COMPANY_ADMIN', 'RECRUITER'];
    if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId, personalizedQuestions, resumeUploaded } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Verify test belongs to user's organization (if applicable)
    const whereClause: any = { id: params.testId, createdBy: session.user.id };
    // Organization filtering is handled by the companyId check implicitly via the Test's ownership
    // If further organization restriction is needed, it should be query-based

    const test = await prisma.test.findUnique({
      where: whereClause,
      select: {
        id: true,
        companyId: true,
        organizationId: true
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found or access denied' }, { status: 404 });
    }

    // Generate unique link
    const uniqueLink = randomBytes(16).toString('hex');

    // Create the assignment
    const assignment = await prisma.testAssignment.create({
      data: {
        testId: params.testId,
        candidateId,
        uniqueLink,
        status: 'pending',
        companyId: test.companyId,
        organizationId: test.organizationId
      },
      include: {
        test: { select: { title: true } },
        candidate: { select: { name: true, email: true } }
      }
    });

    // If personalized questions were generated, save them
    if (personalizedQuestions && personalizedQuestions.length > 0) {
      await prisma.question.createMany({
        data: personalizedQuestions.map((q: any, index: number) => ({
          id: `${assignment.id}_${q.type}_${index + 1}`,
          testId: params.testId,
          type: q.type,
          text: q.text,
          metadata: JSON.stringify(q.metadata ? {
            ...q.metadata,
            personalized: true,
            resumeUploaded: !!resumeUploaded,
            assignmentId: assignment.id
          } : {
            personalized: true,
            resumeUploaded: !!resumeUploaded,
            assignmentId: assignment.id
          }),
          difficulty: q.difficulty || 'Medium',
          order: q.order || index + 1
        }))
      });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Error assigning test:', error);
    return NextResponse.json(
      { error: 'Failed to assign test' },
      { status: 500 }
    );
  }
}