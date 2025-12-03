const { PrismaClient } = require('@prisma/client');

async function checkDB(dbPath) {
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } }
  });
  
  try {
    const users = await prisma.user.count();
    console.log(`${dbPath}: ${users} users`);
    return users;
  } catch (error) {
    console.log(`${dbPath}: Error - ${error.message}`);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dbs = [
    './prisma/dev.db',
    './frontend/prisma/dev.db', 
    './prisma/prisma/dev.db'
  ];
  
  for (const db of dbs) {
    await checkDB(db);
  }
}

main();