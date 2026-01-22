import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Debugging: Check available models
        console.log('Prisma Models:', Object.keys(prisma));

        const { title, level, count, organizationId } = await request.json();

        if (!title || !level || !count) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch random questions matching criteria
        const matchingQuestions = await prisma.question.findMany({
            where: {
                companyId: session.user.companyId,
                isLibrary: true,
                difficulty: level // 'Easy', 'Medium', 'Hard'
            },
            select: { id: true }
        });

        if (matchingQuestions.length === 0) {
            return NextResponse.json({
                error: `No ${level} questions found in library. Please add some questions first.`
            }, { status: 400 });
        }

        // Use available questions if less than requested
        const finalCount = Math.min(count, matchingQuestions.length);

        // Shuffle and slice
        const shuffled = matchingQuestions.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, finalCount).map(q => q.id);

        // 2. Create Question Set and Link Questions
        const newSet = await prisma.questionSet.create({
            data: {
                title,
                level,
                description: `Auto-generated set of ${level} questions`,
                companyId: session.user.companyId,
                organizationId: organizationId || undefined,
                createdBy: session.user.id,
                questions: {
                    connect: selectedIds.map(id => ({ id }))
                }
            }
        });

        return NextResponse.json({ id: newSet.id, count: finalCount }, { status: 201 });

    } catch (error) {
        console.error('Error generating question set:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
