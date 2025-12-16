const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@ayphen.com' },
      update: {},
      create: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@ayphen.com',
        role: 'ADMIN',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'interviewer@ayphen.com' },
      update: {},
      create: {
        id: 'interviewer-1',
        name: 'Interviewer User',
        email: 'interviewer@ayphen.com',
        role: 'INTERVIEWER',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'user@ayphen.com' },
      update: {},
      create: {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@ayphen.com',
        role: 'USER',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    }),
  ]);
  
  console.log('Created users:', users.length);
  
  const count = await prisma.user.count();
  console.log('Total users in database:', count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
