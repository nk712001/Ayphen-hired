import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sets = await prisma.questionSet.findMany({
            where: {
                companyId: session.user.companyId
            },
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(sets);

    } catch (error) {
        console.error('Error fetching question sets:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
