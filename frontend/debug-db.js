const { PrismaClient } = require('@prisma/client');

async function debugDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Try raw SQL query
    const rawUsers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM User`;
    console.log('Raw SQL count:', rawUsers);
    
    // Try Prisma query
    const prismaCount = await prisma.user.count();
    console.log('Prisma count:', prismaCount);
    
    // Try to get actual users
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    console.log('First user:', users[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();