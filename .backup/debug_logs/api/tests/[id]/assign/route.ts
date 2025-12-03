import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateEmail } = await request.json();

    if (!candidateEmail) {
      return NextResponse.json(
        { error: 'Candidate email is required' },
        { status: 400 }
      );
    }

    // Check if the test exists and belongs to this interviewer
    const test = await (prisma as any).test.findUnique({
      where: {
        id: params.id,
        createdBy: session.user.id
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Find or create the candidate
    let candidate = await (prisma as any).candidate.findFirst({
      where: {
        email: candidateEmail.toLowerCase().trim()
      }
    });

    if (!candidate) {
      candidate = await (prisma as any).candidate.create({
        data: {
          email: candidateEmail.toLowerCase().trim(),
          name: candidateEmail.split('@')[0] // Use email username as temporary name
        }
      });
    }

    // Create test assignment
    const assignment = await (prisma as any).testAssignment.create({
      data: {
        testId: test.id,
        candidateId: candidate.id,
        uniqueLink: uuidv4(),
        status: 'pending'
      },
      include: {
        candidate: true,
        test: true
      }
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Error assigning test:', error);
    return NextResponse.json(
      { error: 'Error assigning test' },
      { status: 500 }
    );
  }
}
