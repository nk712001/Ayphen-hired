const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignment() {
    const assignmentId = 'cmj6wj3r700d5xzukx9hg8sif';
    console.log('Checking assignment:', assignmentId);

    const assignment = await prisma.testAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            test: {
                include: {
                    questions: true
                }
            }
        }
    });

    if (!assignment) {
        console.log('Assignment not found');
        return;
    }

    const t = assignment.test;
    console.log('Test Title:', t.title);
    console.log('Total Linked Questions:', t.questions.length);

    if (t.questions.length === 0) {
        console.log('WARNING: No questions linked to this test!');
    } else {
        console.log('First 5 Questions:');
        t.questions.slice(0, 5).forEach(q => {
            console.log(`- ID: ${q.id} | Type: ${q.type} | Text: ${q.text.substring(0, 20)}...`);
        });
    }
}

checkAssignment()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
