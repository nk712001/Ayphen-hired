const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
    const assignmentId = 'cmj6wykyf00dvxzuk7mlzcclu';

    // 1. Get Test ID
    const assignment = await prisma.testAssignment.findUnique({
        where: { id: assignmentId },
        select: { testId: true }
    });
    if (!assignment) return;
    const testId = assignment.testId;
    console.log('Cleaning Test ID:', testId);

    // 2. Get all questions
    const questions = await prisma.question.findMany({
        where: { testId: testId },
        include: { _count: { select: { answers: true } } }
    });

    // 3. Group by Text
    const textMap = new Map();
    questions.forEach(q => {
        if (!textMap.has(q.text)) {
            textMap.set(q.text, []);
        }
        textMap.get(q.text).push(q);
    });

    // 4. Process Groups
    for (const [text, instances] of textMap.entries()) {
        if (instances.length > 1) {
            console.log(`\nProcessing: "${text.substring(0, 30)}..." (${instances.length} instances)`);

            // Sort: Prioritize instances with answers, then oldest (created first implies "original")
            // Actually, IDs are CUIDs and sortable by time, so sorting by ID is roughly chronological
            instances.sort((a, b) => {
                // If one has answers and other doesn't, allow answer-holder to win
                if (a._count.answers !== b._count.answers) {
                    return b._count.answers - a._count.answers;
                }
                return a.id.localeCompare(b.id);
            });

            const winner = instances[0];
            const losers = instances.slice(1);

            console.log(`  Winner: ${winner.id} (Answers: ${winner._count.answers})`);

            for (const loser of losers) {
                console.log(`  - Merging Loser: ${loser.id} (Answers: ${loser._count.answers})`);

                // Migrate answers
                if (loser._count.answers > 0) {
                    console.log(`    Migrating ${loser._count.answers} answers to winner...`);
                    await prisma.answer.updateMany({
                        where: { questionId: loser.id },
                        data: { questionId: winner.id }
                    });
                }

                // Delete loser
                console.log(`    Deleting loser question...`);
                await prisma.question.delete({
                    where: { id: loser.id }
                });
            }
        }
    }

    console.log('\nCleanup Complete.');
}

cleanupDuplicates()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
