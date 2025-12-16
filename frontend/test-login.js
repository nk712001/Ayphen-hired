const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('Testing login flow...');
  
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: 'interviewer@ayphen.com' }
  });
  
  console.log('User found:', !!user);
  if (user) {
    console.log('User role:', user.role);
    console.log('User has password:', !!user.password);
    
    // Test password
    const isValid = await bcrypt.compare('interviewer123', user.password);
    console.log('Password valid:', isValid);
  }
  
  await prisma.$disconnect();
}

testLogin().catch(console.error);