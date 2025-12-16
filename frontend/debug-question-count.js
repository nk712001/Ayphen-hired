const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugQuestionCount() {
  try {
    console.log('=== DEBUGGING QUESTION COUNT MISMATCH ===\n');
    
    // 1. Check all test configurations
    console.log('1. Checking all test configurations...');
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        mcqQuestions: true,
        conversationalQuestions: true,
        codingQuestions: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${tests.length} tests:`);
    
    tests.forEach((test, index) => {
      const total = test.mcqQuestions + test.conversationalQuestions + test.codingQuestions;
      console.log(`\n${index + 1}. Test: ${test.title}`);
      console.log(`   ID: ${test.id}`);
      console.log(`   MCQ: ${test.mcqQuestions}`);
      console.log(`   Conversational: ${test.conversationalQuestions}`);
      console.log(`   Coding: ${test.codingQuestions}`);
      console.log(`   TOTAL CONFIGURED: ${total}`);
      console.log(`   Created: ${test.createdAt}`);
      
      if (total === 11) {
        console.log('   ⚠️  THIS TEST HAS 11 QUESTIONS CONFIGURED!');
      }
    });
    
    // 2. Check recent test assignments
    console.log('\n\n2. Checking recent test assignments...');
    const assignments = await prisma.testAssignment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        test: {
          select: {
            title: true,
            mcqQuestions: true,
            conversationalQuestions: true,
            codingQuestions: true
          }
        },
        candidate: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`Found ${assignments.length} recent assignments:`);
    
    assignments.forEach((assignment, index) => {
      const total = assignment.test.mcqQuestions + assignment.test.conversationalQuestions + assignment.test.codingQuestions;
      console.log(`\n${index + 1}. Assignment: ${assignment.id}`);
      console.log(`   Test: ${assignment.test.title}`);
      console.log(`   Candidate: ${assignment.candidate.name}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   MCQ: ${assignment.test.mcqQuestions}`);
      console.log(`   Conversational: ${assignment.test.conversationalQuestions}`);
      console.log(`   Coding: ${assignment.test.codingQuestions}`);
      console.log(`   TOTAL CONFIGURED: ${total}`);
      console.log(`   Unique Link: ${assignment.uniqueLink}`);
      
      if (total === 11) {
        console.log('   🎯 THIS IS THE 11-QUESTION TEST!');
        console.log(`   🔗 Test this assignment: /tests/session/${assignment.uniqueLink}`);
      }
    });
    
    // 3. Check if there are any questions actually stored in the database
    console.log('\n\n3. Checking stored questions in database...');
    const storedQuestions = await prisma.question.findMany({
      take: 20,
      include: {
        test: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${storedQuestions.length} stored questions in database:`);
    
    if (storedQuestions.length === 0) {
      console.log('❌ No questions stored in database!');
      console.log('   Questions are generated dynamically in the frontend.');
      console.log('   The issue is likely in the question generation logic.');
    } else {
      // Group by test
      const questionsByTest = {};
      storedQuestions.forEach(q => {
        if (!questionsByTest[q.testId]) {
          questionsByTest[q.testId] = [];
        }
        questionsByTest[q.testId].push(q);
      });
      
      Object.keys(questionsByTest).forEach(testId => {
        const questions = questionsByTest[testId];
        console.log(`\nTest: ${questions[0].test.title}`);
        console.log(`  Stored Questions: ${questions.length}`);
        questions.forEach((q, i) => {
          console.log(`    ${i + 1}. ${q.type}: ${q.text.substring(0, 50)}...`);
        });
      });
    }
    
    // 4. Analysis and recommendations
    console.log('\n\n=== ANALYSIS ===');
    
    const elevenQuestionTests = tests.filter(t => 
      t.mcqQuestions + t.conversationalQuestions + t.codingQuestions === 11
    );
    
    if (elevenQuestionTests.length === 0) {
      console.log('❌ No tests found with 11 questions configured.');
      console.log('   Please check the test creation or update the test configuration.');
    } else {
      console.log(`✅ Found ${elevenQuestionTests.length} test(s) with 11 questions configured:`);
      elevenQuestionTests.forEach(test => {
        console.log(`   - ${test.title}: ${test.mcqQuestions} MCQ + ${test.conversationalQuestions} Conv + ${test.codingQuestions} Code = 11`);
      });
      
      console.log('\n🔍 POSSIBLE ISSUES:');
      console.log('1. Question generation logic might have an off-by-one error');
      console.log('2. Array bounds checking might be limiting questions');
      console.log('3. Frontend might be filtering or limiting questions');
      console.log('4. AI question generation might be failing and falling back to limited set');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuestionCount();
