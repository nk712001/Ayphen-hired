import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Auth & Permission Check
        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Create Organization + Audit Log
        const org = await prisma.$transaction(async (tx: any) => {
            const organization = await tx.organization.create({
                data: {
                    name,
                    description,
                    companyId: session.user.companyId!
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'ORGANIZATION_CREATED',
                    entityType: 'Organization',
                    entityId: organization.id,
                    userId: session.user.id,
                    companyId: session.user.companyId,
                    metadata: JSON.stringify({ orgName: name })
                }
            });

            return organization;
        });

        return NextResponse.json(org, { status: 201 });

    } catch (error) {
        console.error('Create organization error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isRecruiter = session.user.role === 'RECRUITER';
        if (session.user.role !== 'COMPANY_ADMIN' && !isRecruiter) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let whereClause: any = { companyId: session.user.companyId };

        // If Recruiter, filter by assignments
        if (isRecruiter) {
            const assignments = await prisma.recruiterOrganization.findMany({
                where: { recruiterId: session.user.id },
                select: { organizationId: true }
            });
            const orgIds = assignments.map((a: any) => a.organizationId);
            whereClause.id = { in: orgIds };
        }

        const orgs = await prisma.organization.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { recruiters: true, tests: true, candidates: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orgs);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
