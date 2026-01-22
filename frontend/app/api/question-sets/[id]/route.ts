import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const set = await prisma.questionSet.findUnique({
            where: {
                id: params.id,
                companyId: session.user.companyId
            },
            include: {
                questions: true
            }
        });

        if (!set) {
            return NextResponse.json({ error: 'Question Set not found' }, { status: 404 });
        }

        return NextResponse.json(set);
    } catch (error) {
        console.error('Error fetching question set:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId || (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, level } = body;

        const updatedSet = await prisma.questionSet.update({
            where: {
                id: params.id,
                companyId: session.user.companyId
            },
            data: {
                title,
                description,
                level
            }
        });

        return NextResponse.json(updatedSet);
    } catch (error) {
        console.error('Error updating question set:', error);
        return NextResponse.json({ error: 'Error updating question set' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId || (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.questionSet.delete({
            where: {
                id: params.id,
                companyId: session.user.companyId
            }
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting question set:', error);
        return NextResponse.json({ error: 'Error deleting question set' }, { status: 500 });
    }
}
