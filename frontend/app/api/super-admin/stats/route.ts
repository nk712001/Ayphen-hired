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

        const [
            totalCompanies,
            totalUsers,
            totalTests,
            activeCompanies,
        ] = await Promise.all([
            prisma.company.count(),
            prisma.user.count(),
            prisma.test.count(),
            prisma.company.count({ where: { subscriptionStatus: 'active' } }),
        ]);

        return NextResponse.json({
            totalCompanies,
            totalUsers,
            totalTests,
            activeCompanies,
            systemHealth: 'Healthy'
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
