import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: { recruitersId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assignments = await prisma.recruiterOrganization.findMany({
            where: {
                recruiterId: params.recruitersId,
                organization: {
                    companyId: session.user.companyId
                }
            },
            select: {
                organizationId: true
            }
        });

        return NextResponse.json(assignments);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: { recruitersId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { organizationIds } = await req.json();

        // Security check: Ensure orgs belong to this company
        const validOrgs = await prisma.organization.count({
            where: {
                id: { in: organizationIds },
                companyId: session.user.companyId
            }
        });

        if (validOrgs !== organizationIds.length) {
            return NextResponse.json({ error: 'Invalid organization IDs' }, { status: 400 });
        }

        // Transaction: Clear old -> Create new
        await prisma.$transaction(async (tx) => {
            // Delete all existing assignments for this recruiter
            await tx.recruiterOrganization.deleteMany({
                where: { recruiterId: params.recruitersId }
            });

            // Create new ones
            if (organizationIds.length > 0) {
                await tx.recruiterOrganization.createMany({
                    data: organizationIds.map((orgId: string) => ({
                        recruiterId: params.recruitersId,
                        organizationId: orgId
                    }))
                });
            }

            // Log action
            await tx.auditLog.create({
                data: {
                    action: 'UPDATE_USER',
                    entityType: 'User',
                    entityId: params.recruitersId,
                    userId: session.user.id,
                    companyId: session.user.companyId,
                    metadata: JSON.stringify({
                        action: 'update_org_assignments',
                        count: organizationIds.length
                    })
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Assignment error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
