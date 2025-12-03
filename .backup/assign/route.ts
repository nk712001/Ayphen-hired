import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId, candidateIds } = await request.json();

    // Create assignments for each candidate
    const assignments = await Promise.all(
      candidateIds.map(async (candidateId: string) => {
        const uniqueLink = nanoid(10); // Generate unique test link
        return prisma.testAssignment.create({
          data: {
            testId,
            candidateId,
            uniqueLink,
            status: 'pending'
          },
          include: {
            candidate: true,
            test: true
          }
        });
      })
    );

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error assigning test:', error);
    return NextResponse.json(
      { error: 'Error assigning test' },
      { status: 500 }
    );
  }
}
