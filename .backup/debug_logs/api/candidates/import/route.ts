import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type CandidateInput = {
  name: string;
  email: string;
  resumeUrl?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'interviewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidates } = await request.json() as { candidates: CandidateInput[] };

    // Validate candidates array
    if (!Array.isArray(candidates)) {
      return NextResponse.json(
        { error: 'Invalid candidates data' },
        { status: 400 }
      );
    }

    // Validate each candidate
    for (const candidate of candidates) {
      if (!candidate.name || !candidate.email) {
        return NextResponse.json(
          { error: 'Each candidate must have a name and email' },
          { status: 400 }
        );
      }
    }

    // Check for existing candidates by email
    const emails = candidates.map((c: CandidateInput) => c.email.toLowerCase().trim());
    const existingCandidates = await (prisma as any).candidate.findMany({
      where: {
        email: { in: emails }
      },
      select: { email: true }
    });

    const existingEmails = new Set(existingCandidates.map((c: { email: string }) => c.email));
    const newCandidates = candidates.filter((c: CandidateInput) => !existingEmails.has(c.email.toLowerCase().trim()));

    if (newCandidates.length === 0) {
      return NextResponse.json(
        { error: 'All candidates already exist' },
        { status: 400 }
      );
    }

    // Create only new candidates
    const createdCandidates = await (prisma as any).candidate.createMany({
      data: newCandidates.map(candidate => ({
        name: candidate.name,
        email: candidate.email.toLowerCase().trim(),
        resumeUrl: candidate.resumeUrl
      }))
    });

    return NextResponse.json({ 
      count: createdCandidates.count,
      skipped: candidates.length - newCandidates.length
    });
  } catch (error) {
    console.error('Error importing candidates:', error);
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A candidate with this email already exists' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Error importing candidates. Please try again.' },
      { status: 500 }
    );
  }
}
