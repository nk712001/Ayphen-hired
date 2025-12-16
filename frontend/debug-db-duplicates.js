const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDuplicates() {
    const assignmentId = 'cmj6wykyf00dvxzuk7mlzcclu';

    // 1. Get the Test ID
    const assignment = await prisma.testAssignment.findUnique({
        where: { id: assignmentId },
        select: { testId: true }
    });

    if (!assignment) {
        console.log('Assignment not found');
        return;
    }

    const testId = assignment.testId;
    console.log('Analyzing Test ID:', testId);

    // 2. Get all questions for this test
    const questions = await prisma.question.findMany({
        where: { testId: testId },
        include: { _count: { select: { answers: true } } }
    });

    console.log(`Total Questions in Test: ${questions.length}`);

    // 3. Group by Text
    const textMap = new Map();
    questions.forEach(q => {
        if (!textMap.has(q.text)) {
            textMap.set(q.text, []);
        }
        textMap.get(q.text).push(q);
    });

    console.log(`Unique Question Texts: ${textMap.size}`);

    // 4. Report Duplicates
    console.log('\n--- Duplication Report ---');
    let totalDuplicates = 0;

    for (const [text, instances] of textMap.entries()) {
        if (instances.length > 1) {
            console.log(`\nText: "${text.substring(0, 50)}..."`);
            console.log(`Count: ${instances.length}`);
            instances.forEach(q => {
                console.log(`  - ID: ${q.id} | Type: ${q.type} | Answers Linked: ${q._count.answers}`);
            });
            totalDuplicates += (instances.length - 1);
        }
    }

    console.log(`\nTotal Redundant Questions to Delete: ${totalDuplicates}`);
}

analyzeDuplicates()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
