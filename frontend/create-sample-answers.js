const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleAnswers() {
  try {
    const assignmentId = 'cmi6jop4q0003xzdwkj54k4fc';
    const testId = 'cmi6jjzua0001xzdwwf0pluvj';
    
    // Get questions for this test
    const questions = await prisma.question.findMany({
      where: { testId },
      orderBy: { order: 'asc' }
    });
    
    console.log(`Found ${questions.length} questions`);
    
    // Create sample answers
    const sampleAnswers = [
      'I have 3 years of experience with React and have worked on several large-scale applications.',
      'I use Redux for state management in complex applications, along with Context API for simpler state needs.',
      'function fetchUsers() {\n  return fetch("/api/users")\n    .then(res => res.json())\n    .then(users => {\n      return users.map(user => <UserCard key={user.id} user={user} />);\n    });\n}'
    ];
    
    for (let i = 0; i < Math.min(questions.length, sampleAnswers.length); i++) {
      await prisma.answer.create({
        data: {
          questionId: questions[i].id,
          testAssignmentId: assignmentId,
          content: sampleAnswers[i],
          submittedAt: new Date()
        }
      });
      console.log(`Created answer for question ${i + 1}`);
    }
    
    console.log('Sample answers created successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAnswers();