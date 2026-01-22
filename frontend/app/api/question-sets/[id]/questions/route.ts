import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { questions, ids } = await request.json();

        if ((!Array.isArray(questions) || questions.length === 0) && (!Array.isArray(ids) || ids.length === 0)) {
            return NextResponse.json({ error: 'No questions or IDs provided' }, { status: 400 });
        }

        // Verify set ownership/existence
        const set = await prisma.questionSet.findUnique({
            where: {
                id: params.id,
                companyId: session.user.companyId
            }
        });

        if (!set) {
            return NextResponse.json({ error: 'Question Set not found' }, { status: 404 });
        }

        let createdCount = 0;

        await prisma.$transaction(async (tx) => {
            // 1. Handle New Questions (Manual)
            if (Array.isArray(questions) && questions.length > 0) {
                const dataToCreate = questions.map((q: any) => ({
                    text: q.text,
                    type: q.type,
                    difficulty: q.difficulty,
                    order: q.order || 0,
                    metadata: JSON.stringify(q.metadata || {}),
                    companyId: session.user.companyId,
                    isLibrary: true,
                    questionSetId: set.id,
                    isTechnical: true // Default
                }));

                const res = await tx.question.createMany({
                    data: dataToCreate
                });
                createdCount += res.count;
            }

            // 2. Handle Existing IDs (Copy from Library)
            if (Array.isArray(ids) && ids.length > 0) {
                // Fetch source questions to ensure ownership and get data
                const sources = await tx.question.findMany({
                    where: {
                        id: { in: ids },
                        companyId: session.user.companyId
                    }
                });

                if (sources.length > 0) {
                    const dataToCreate = sources.map((src) => ({
                        text: src.text,
                        type: src.type,
                        difficulty: src.difficulty,
                        order: src.order,
                        metadata: src.metadata,
                        category: src.category,
                        tags: src.tags,
                        isTechnical: src.isTechnical,
                        companyId: session.user.companyId,
                        isLibrary: true,
                        questionSetId: set.id
                    }));

                    const res = await tx.question.createMany({
                        data: dataToCreate
                    });
                    createdCount += res.count;
                }
            }
        });

        return NextResponse.json({ message: 'Questions added', count: createdCount }, { status: 201 });

    } catch (error) {
        console.error('Error adding questions to set:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
