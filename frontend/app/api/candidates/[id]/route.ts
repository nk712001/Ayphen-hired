import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId // Enforce tenant isolation
      },
      include: {
        assignments: {
          include: {
            test: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Access control for Recruiter: must be assigned to the organization
    if (session.user.role === 'RECRUITER') {
      const hasAccess = await prisma.recruiterOrganization.findUnique({
        where: {
          recruiterId_organizationId: {
            recruiterId: session.user.id,
            organizationId: candidate.organizationId
          }
        }
      });
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Decrypt phone
    const candidateData = {
      ...candidate,
      phone: candidate.phone ? decrypt(candidate.phone) : candidate.phone
    };

    return NextResponse.json({ candidate: candidateData });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Error fetching candidate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the candidate exists and belongs to company
    const candidate = await prisma.candidate.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        assignments: {
          include: {
            proctorSessions: {
              include: {
                violations: true
              }
            },
            answers: true
          }
        }
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Role check
    if (session.user.role === 'RECRUITER') {
      const hasAccess = await prisma.recruiterOrganization.findUnique({
        where: {
          recruiterId_organizationId: {
            recruiterId: session.user.id,
            organizationId: candidate.organizationId
          }
        }
      });
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Deep delete transaction
    await prisma.$transaction(async (tx) => {
      const testAssignmentIds = candidate.assignments.map(a => a.id);

      if (testAssignmentIds.length > 0) {
        // Get proctor sessions
        const proctorSessions = await tx.proctorSession.findMany({
          where: { testAssignmentId: { in: testAssignmentIds } },
          select: { id: true }
        });

        const proctorSessionIds = proctorSessions.map(ps => ps.id);

        // 1. Delete violations
        if (proctorSessionIds.length > 0) {
          await tx.violation.deleteMany({
            where: { proctorSessionId: { in: proctorSessionIds } }
          });
        }

        // 2. Delete proctor sessions
        if (testAssignmentIds.length > 0) {
          await tx.proctorSession.deleteMany({
            where: { testAssignmentId: { in: testAssignmentIds } }
          });

          // 3. Delete answers
          await tx.answer.deleteMany({
            where: { testAssignmentId: { in: testAssignmentIds } }
          });

          // 4. Delete test assignments
          await tx.testAssignment.deleteMany({
            where: { candidateId: params.id }
          });
        }
      }

      // 5. Delete candidate
      await tx.candidate.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Error deleting candidate' },
      { status: 500 }
    );
  }
}
