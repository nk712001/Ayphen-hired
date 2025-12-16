import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching assignments for user:', session.user.id, 'email:', session.user.email, 'role:', session.user.role);

    // Only get assignments for the current user
    const assignments = await prisma.testAssignment.findMany({
      where: {
        candidateId: session.user.id
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            jobDescription: true,
            duration: true,
            mcqQuestions: true,
            conversationalQuestions: true,
            codingQuestions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found assignments:', assignments.length);
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    return NextResponse.json(
      { error: 'Error fetching assignments' },
      { status: 500 }
    );
  }
}