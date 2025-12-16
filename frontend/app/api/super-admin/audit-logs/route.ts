import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const companyId = searchParams.get('companyId');
        const entityType = searchParams.get('entityType');

        const whereClause: any = {};

        if (companyId) {
            whereClause.companyId = companyId;
        }

        if (entityType) {
            whereClause.entityType = entityType;
        }

        const auditLogs = await prisma.auditLog.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { name: true, email: true }
                },
                company: {
                    select: { name: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return NextResponse.json({ auditLogs });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
