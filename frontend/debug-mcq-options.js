const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignment() {
    const assignmentId = 'cmj6wykyf00dvxzuk7mlzcclu';
    console.log('Checking assignment:', assignmentId);

    const assignment = await prisma.testAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            test: {
                include: {
                    questions: {
                        orderBy: { order: 'asc' }
                    }
                }
            },
            answers: true
        }
    });

    if (!assignment) {
        console.log('Assignment not found');
        return;
    }

    console.log('Test Title:', assignment.test.title);
    console.log('Total Questions:', assignment.test.questions.length);
    console.log('Total Answers Saved:', assignment.answers.length);

    console.log('\n--- Questions ---');
    assignment.test.questions.forEach(q => {
        console.log(`[${q.type}] ID: ${q.id}`);
        console.log(`  Text: ${q.text.substring(0, 40)}...`);
        console.log(`  Metadata Type: ${typeof q.metadata}`);
        console.log(`  Metadata:`, q.metadata);
        // Check options specifically for MCQ
        if (q.type === 'multiple_choice') {
            const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
            console.log(`  Parsed Options:`, meta?.options);
        }
    });

    console.log('\n--- Answers ---');
    assignment.answers.forEach(a => {
        console.log(`QuestionID: ${a.questionId} | Content: "${a.content}"`);
    });
}

checkAssignment()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
