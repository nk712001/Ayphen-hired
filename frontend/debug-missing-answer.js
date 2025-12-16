const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMissingAnswer() {
    const assignmentId = 'cmj6wykyf00dvxzuk7mlzcclu';

    console.log(`Analyzing answers for Assignment: ${assignmentId}`);

    // 1. Get all answers for this assignment
    const answers = await prisma.answer.findMany({
        where: { testAssignmentId: assignmentId },
        include: { question: true }
    });

    console.log(`\nTotal Answers Found: ${answers.length}`);

    console.log('\n--- Answer Dump ---');
    answers.forEach((a, i) => {
        console.log(`\n[Answer ${i + 1}]`);
        console.log(`ID: ${a.id}`);
        console.log(`Question ID: ${a.questionId}`);
        console.log(`Question Text: "${a.question?.text.substring(0, 50)}..."`);
        console.log(`Answer Value: "${a.value}"`);
    });

    // 2. Find the specific question user mentioned
    const targetTextStart = "Given your experience with , how do you ensure seamless";
    console.log(`\nSearching for question starting with: "${targetTextStart}"`);

    const targetQuestions = await prisma.question.findMany({
        where: {
            text: { contains: "ensure seamless integration between frontend and backend" }
        }
    });

    console.log(`Found ${targetQuestions.length} questions matching criteria in the ENTIRE DB (for this test).`);
    targetQuestions.forEach(q => {
        console.log(`- ID: ${q.id} | TestID: ${q.testId} | Text: "${q.text.substring(0, 50)}..."`);
        // Check if this question has an answer linked
        const linkedAnswer = answers.find(a => a.questionId === q.id);
        console.log(`  -> Has Answer in this assignment? ${linkedAnswer ? 'YES: ' + linkedAnswer.value : 'NO'}`);
    });

}

debugMissingAnswer()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
