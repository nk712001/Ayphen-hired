import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Auth & Permission Check
        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recruiterId, organizationId } = await req.json();

        if (!recruiterId || !organizationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify ownership: both recruiter and organization must belong to this company
        const [recruiter, organization] = await Promise.all([
            prisma.user.findFirst({
                where: { id: recruiterId, companyId: session.user.companyId }
            }),
            prisma.organization.findFirst({
                where: { id: organizationId, companyId: session.user.companyId }
            })
        ]);

        if (!recruiter || !organization) {
            return NextResponse.json({ error: 'Invalid recruiter or organization' }, { status: 400 });
        }

        // Create assignment
        const assignment = await prisma.recruiterOrganization.create({
            data: {
                recruiterId,
                organizationId,
                assignedBy: session.user.id
            }
        });

        // Audit Log
        // Audit Log
        await createAuditLog({
            action: 'ASSIGN_RECRUITER',
            entityType: 'RecruiterOrganization',
            entityId: assignment.id,
            userId: session.user.id,
            companyId: session.user.companyId,
            metadata: { recruiterId, organizationId }
        });

        return NextResponse.json(assignment, { status: 201 });

    } catch (error) {
        // Check for unique constraint violation (already assigned)
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'Recruiter already assigned to this organization' }, { status: 409 });
        }
        console.error('Assignment error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// Get organizations assigned to a specific recruiter
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get('recruiterId');

        if (!recruiterId) {
            return NextResponse.json({ error: 'Recruiter ID required' }, { status: 400 });
        }

        // Ensure we are querying a recruiter from our company
        const recruiter = await prisma.user.findFirst({
            where: { id: recruiterId, companyId: session.user.companyId }
        });

        if (!recruiter) {
            return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
        }

        const assignments = await prisma.recruiterOrganization.findMany({
            where: { recruiterId },
            include: {
                organization: true
            }
        });

        return NextResponse.json(assignments);

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
