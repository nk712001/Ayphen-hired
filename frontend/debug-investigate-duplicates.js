const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
    const assignmentId = 'cmj6wykyf00dvxzuk7mlzcclu';

    // 1. Check Assignment & Test
    const assignment = await prisma.testAssignment.findUnique({
        where: { id: assignmentId },
        select: { testId: true, answers: true }
    });

    if (!assignment) {
        console.log('Assignment not found');
        return;
    }

    console.log(`Test ID: ${assignment.testId}`);
    console.log(`Total Saved Answers: ${assignment.answers.length}`);

    // 2. Check Duplicates in Test Questions
    const questions = await prisma.question.findMany({
        where: { testId: assignment.testId }
    });

    console.log(`Total Questions in Test: ${questions.length}`);
    const textMap = new Map();
    questions.forEach(q => {
        const count = textMap.get(q.text) || 0;
        textMap.set(q.text, count + 1);
    });

    const duplicates = [...textMap.entries()].filter(([k, v]) => v > 1);
    if (duplicates.length > 0) {
        console.log('⚠️ Duplicates STILL EXIST!');
        duplicates.forEach(([text, count]) => {
            console.log(`- "${text.substring(0, 30)}..." : ${count} copies`);
        });
    } else {
        console.log('✅ No duplicates found in Question table.');
    }

    // 3. Analyze Answers vs Questions
    console.log('\n--- Answer Analysis ---');
    let answerMatchCount = 0;
    let answerMismatchCount = 0;

    for (const answer of assignment.answers) {
        const q = questions.find(q => q.id === answer.questionId);
        if (q) {
            answerMatchCount++;
        } else {
            answerMismatchCount++;
            // Check if the answer points to a question that NO LONGER EXISTS
            // This happens if I deleted the 'Loser' question but the answer was pointing to it.
            // But I migrated them first! 
            // ... Unless the migration failed for some?
            const deletedQ = await prisma.question.findUnique({ where: { id: answer.questionId } });
            console.log(`❌ Answer ${answer.id} points to missing QuestionID: ${answer.questionId}`);
        }
    }

    console.log(`Answers linking to valid questions: ${answerMatchCount}`);
    console.log(`Answers linking to MISSING questions: ${answerMismatchCount}`);

}

investigate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
