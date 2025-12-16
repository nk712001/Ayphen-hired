const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllData() {
  try {
    const users = await prisma.user.count();
    const tests = await prisma.test.count();
    const questions = await prisma.question.count();
    const assignments = await prisma.testAssignment.count();
    
    console.log('📊 Database Summary:');
    console.log(`   Users: ${users}`);
    console.log(`   Tests: ${tests}`);
    console.log(`   Questions: ${questions}`);
    console.log(`   Assignments: ${assignments}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();