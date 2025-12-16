import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based filtering
    let whereClause: any = { companyId: session.user.companyId };

    if (session.user.role === 'COMPANY_ADMIN') {
      // Company Admin can filter by any org in their company
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
    } else if (session.user.role === 'RECRUITER') {
      // Recruiter: if organizationId is provided, verify access.
      // If NOT provided, fetch tests from ALL assigned organizations.
      if (organizationId) {
        const access = await prisma.recruiterOrganization.findUnique({
          where: {
            recruiterId_organizationId: {
              recruiterId: session.user.id,
              organizationId
            }
          }
        });

        if (!access) {
          return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
        }
        whereClause.organizationId = organizationId;
      } else {
        // Fetch all assigned organizations
        const assignments = await prisma.recruiterOrganization.findMany({
          where: { recruiterId: session.user.id },
          select: { organizationId: true }
        });

        const orgIds = assignments.map(a => a.organizationId);
        whereClause.organizationId = { in: orgIds };
      }
    } else if (session.user.role === 'SUPER_ADMIN') {
      // Super admin logic (if applicable, normally super admin is platform level)
      // For now, restrict to company context or return empty if no companyId
      return NextResponse.json({ tests: [] });
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      include: {
        assignments: {
          include: {
            candidate: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, jobDescription, duration, requiresSecondaryCamera, organizationId } = await request.json();

    if (!title || !duration || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify organization access
    if (session.user.role === 'RECRUITER') {
      const access = await prisma.recruiterOrganization.findUnique({
        where: {
          recruiterId_organizationId: {
            recruiterId: session.user.id,
            organizationId
          }
        }
      });

      if (!access) {
        return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
      }
    } else {
      // Company Admin verification
      const org = await prisma.organization.findFirst({
        where: { id: organizationId, companyId: session.user.companyId }
      });
      if (!org) {
        return NextResponse.json({ error: 'Invalid organization' }, { status: 400 });
      }
    }

    const test = await prisma.test.create({
      data: {
        title,
        jobDescription,
        duration,
        requiresSecondaryCamera: Boolean(requiresSecondaryCamera),
        companyId: session.user.companyId,
        organizationId,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
