const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'superadmin@ayphen.com';
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });
  
  console.log('Created Super Admin:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
