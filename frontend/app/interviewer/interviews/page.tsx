import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import InterviewsList from './InterviewsList';

import { Test } from '@/types';

export default async function InterviewsPage() {
  const session = await getServerSession(authOptions);

  // Check if user is logged in and is an interviewer
  if (!session?.user?.id || session.user.role !== 'INTERVIEWER') {
    redirect('/auth/interviewer/login');
  }

  // Get tests created by this interviewer
  const tests = (await (prisma as any).test.findMany({
    where: {
      createdBy: session.user.id
    },
    include: {
      assignments: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          candidateId: true
        }
      }
    }
  })) as any[];

  // Manually fetch candidate data for each assignment
  const testsWithCandidates = await Promise.all(
    tests.map(async (test) => {
      const assignmentsWithCandidates = await Promise.all(
        test.assignments.map(async (assignment: any) => {
          if (assignment.candidateId) {
            try {
              const candidate = await prisma.user.findUnique({
                where: { id: assignment.candidateId },
                select: { id: true, name: true, email: true }
              });
              return { ...assignment, candidate };
            } catch {
              return { ...assignment, candidate: null };
            }
          }
          return { ...assignment, candidate: null };
        })
      );
      return { ...test, assignments: assignmentsWithCandidates };
    })
  );

  return <InterviewsList initialTests={testsWithCandidates as Test[]} />;
}
