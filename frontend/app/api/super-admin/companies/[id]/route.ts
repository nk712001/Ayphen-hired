import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company = await prisma.company.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { users: true, organizations: true, tests: true }
                },
                companySettings: true
            }
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({ company });
    } catch (error) {
        console.error('Error fetching company:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, domain, subscriptionTier, subscriptionStatus } = await request.json();

        const company = await prisma.company.update({
            where: { id: params.id },
            data: {
                name,
                domain,
                subscriptionTier,
                subscriptionStatus
            }
        });

        await createAuditLog({
            action: 'UPDATE_COMPANY',
            entityType: 'Company',
            entityId: company.id,
            metadata: {
                name,
                subscriptionStatus,
                updatedBy: session.user.id
            },
            userId: session.user.id
        });

        return NextResponse.json({ company });
    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Deep delete transaction for company
        // Note: Due to foreign keys and Cascade settings, deleting Company SHOULD cascade to most things.
        // However, some relations might not be fully cascaded in SQLite or schema. 
        // Checking Schema: Company has many Users, Orgs, Tests, etc.
        // User -> Company (Cascade)
        // Organization -> Company (Cascade)
        // Test -> Company (Cascade)
        // CompanySettings -> Company (Cascade)

        // So simple delete should work.

        const company = await prisma.company.delete({
            where: { id: params.id }
        });

        await createAuditLog({
            action: 'DELETE_COMPANY',
            entityType: 'Company',
            entityId: params.id, // ID of deleted entity
            metadata: { name: company.name },
            userId: session.user.id
        });

        return NextResponse.json({ success: true, message: 'Company deleted' });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
