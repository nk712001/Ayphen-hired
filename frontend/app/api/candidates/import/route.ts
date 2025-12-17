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

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { candidates, organizationId } = await request.json() as {
      candidates: CandidateInput[],
      organizationId: string
    };

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Role-based access control
    if (session.user.role === 'RECRUITER') {
      const access = await prisma.recruiterOrganization.findUnique({
        where: {
          recruiterId_organizationId: {
            recruiterId: session.user.id,
            organizationId
          }
        }
      });
      if (!access) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    } else {
      const org = await prisma.organization.findFirst({
        where: { id: organizationId, companyId: session.user.companyId }
      });
      if (!org) return NextResponse.json({ error: 'Invalid organization' }, { status: 400 });
    }

    // Validate candidates array
    if (!Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Invalid candidates data' }, { status: 400 });
    }

    for (const candidate of candidates) {
      if (!candidate.name || !candidate.email) {
        return NextResponse.json({ error: 'Name and email required for all candidates' }, { status: 400 });
      }
    }

    // Check for existing candidates in this organization
    const emails = candidates.map(c => c.email.toLowerCase().trim());
    const existingCandidates = await prisma.candidate.findMany({
      where: {
        companyId: session.user.companyId,
        organizationId,
        email: { in: emails }
      },
      select: { email: true }
    });

    const existingEmails = new Set(existingCandidates.map((c: any) => c.email));

    // Filter new candidates
    const newCandidates = candidates.filter(c => !existingEmails.has(c.email.toLowerCase().trim()));

    if (newCandidates.length === 0) {
      return NextResponse.json({
        count: 0,
        skipped: candidates.length
      });
    }

    // Create assignments
    const created = await prisma.candidate.createMany({
      data: newCandidates.map(c => ({
        name: c.name,
        email: c.email.toLowerCase().trim(),
        resumeUrl: c.resumeUrl,
        companyId: session.user.companyId!,
        organizationId
      }))
    });

    return NextResponse.json({
      count: created.count,
      skipped: candidates.length - newCandidates.length
    });

  } catch (error) {
    console.error('Error importing candidates:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
