
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

        const { title, level, count, organizationId } = await request.json();

        if (!title || !level || !count || !organizationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch random questions matching criteria
        // Since Prisma doesn't support RANDOM(), we fetch IDs first or use a raw query.
        // For simplicity with Prisma + small dataset, fetching matching IDs and shuffling in JS is acceptable.
        // For larger datasets, raw query is better. Let's stick to findMany with shuffling for now as it's safer/portable.

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

        // 2. Fetch full question details to clone them
        const questionsToClone = await prisma.question.findMany({
            where: { id: { in: selectedIds } }
        });

        // 3. Create Test
        // Map Level to Job Description equivalent text
        const levelMap: Record<string, string> = {
            'Easy': 'Intern / Junior Developer',
            'Medium': 'Mid-Level Developer',
            'Hard': 'Senior / Lead Developer'
        };

        const newTest = await prisma.test.create({
            data: {
                title,
                jobDescription: `Auto-generated test for ${levelMap[level] || level}`,
                duration: count * 15, // Approx 15 mins per question logic
                companyId: session.user.companyId,
                organizationId,
                createdBy: session.user.id,
                requiresSecondaryCamera: false
            }
        });

        // 4. Clone Questions into Test
        // We create NEW question entries linked to this Test.
        // If we linked existing library questions, modifying them in the test might affect the library (depending on logic).
        // The Schema has `testId` as nullable. A question belongs to EITHER a test OR the library (usually). 
        // IF we re-use the same ID, deleting the test might delete the question (Cascade).
        // SAFE APPROACH: Clone them.

        for (let i = 0; i < questionsToClone.length; i++) {
            const q = questionsToClone[i];
            await prisma.question.create({
                data: {
                    testId: newTest.id, // Link to new test
                    type: q.type,
                    text: q.text,
                    difficulty: q.difficulty,
                    timeToStart: q.timeToStart,
                    order: i + 1,
                    metadata: q.metadata,
                    isTechnical: q.isTechnical,
                    companyId: session.user.companyId, // Still belongs to company
                    // Not a library question anymore, it's a test instance question
                    isLibrary: false
                }
            });
        }

        return NextResponse.json({ testId: newTest.id, count: selectedIds.length });

    } catch (error) {
        console.error('Error generating questionnaire:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
