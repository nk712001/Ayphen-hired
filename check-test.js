const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function checkTest() {
  try {
    const testId = 'cmi5zekbz000mxz0zgk2i1q4g';
    
    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        assignments: {
          include: {
            candidate: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    
    if (test) {
      console.log('✅ Test found:', {
        id: test.id,
        title: test.title,
        createdBy: test.createdBy,
        assignments: test.assignments.length
      });
    } else {
      console.log('❌ Test not found with ID:', testId);
      
      // List all tests to see what's available
      const allTests = await prisma.test.findMany({
        select: { id: true, title: true, createdBy: true }
      });
      console.log('\n📋 Available tests:');
      allTests.forEach(t => console.log(`  - ${t.id}: ${t.title} (by ${t.createdBy})`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTest();