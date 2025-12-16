const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMissingTest() {
  try {
    // First, create an interviewer user if it doesn't exist
    const hashedPassword = await bcrypt.hash('password123', 10);
    const interviewer = await prisma.user.upsert({
      where: { email: 'interviewer@example.com' },
      update: {},
      create: {
        name: 'Test Interviewer',
        email: 'interviewer@example.com',
        password: hashedPassword,
        role: 'interviewer'
      }
    });

    // Create the specific test with the ID from the URL
    const test = await prisma.test.create({
      data: {
        id: 'cmi5zekbz000mxz0zgk2i1q4g',
        title: 'Frontend Developer Test',
        jobDescription: 'A comprehensive test for frontend developers with React, JavaScript, and CSS skills.',
        duration: 60,
        requiresSecondaryCamera: true,
        mcqQuestions: 5,
        conversationalQuestions: 3,
        codingQuestions: 2,
        createdBy: interviewer.id
      }
    });

    // Create some sample questions for the test
    const questions = [
      {
        testId: test.id,
        type: 'conversational',
        text: 'Tell me about your experience with React hooks.',
        timeToStart: 30,
        difficulty: 'Intermediate',
        order: 1
      },
      {
        testId: test.id,
        type: 'conversational',
        text: 'How do you handle state management in large React applications?',
        timeToStart: 30,
        difficulty: 'Hard',
        order: 2
      },
      {
        testId: test.id,
        type: 'coding',
        text: 'Implement a React component that fetches and displays a list of users from an API.',
        difficulty: 'Intermediate',
        order: 3
      }
    ];

    for (const questionData of questions) {
      await prisma.question.create({
        data: questionData
      });
    }

    console.log('✅ Test created successfully:', {
      id: test.id,
      title: test.title,
      createdBy: test.createdBy,
      questionsCount: questions.length
    });

    // Verify the test exists
    const verifyTest = await prisma.test.findUnique({
      where: { id: 'cmi5zekbz000mxz0zgk2i1q4g' },
      include: {
        questions: true,
        assignments: true
      }
    });

    if (verifyTest) {
      console.log('✅ Test verification successful');
      console.log(`   - Questions: ${verifyTest.questions.length}`);
      console.log(`   - Assignments: ${verifyTest.assignments.length}`);
    }

  } catch (error) {
    console.error('Error creating test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingTest();