const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Question Bank...');
    try {
        const total = await prisma.question.count();
        const libraryCount = await prisma.question.count({
            where: { isLibrary: true }
        });

        console.log(`Total Questions: ${total}`);
        console.log(`Library Questions: ${libraryCount}`);

        if (libraryCount > 0) {
            const qs = await prisma.question.findMany({
                where: { isLibrary: true },
                take: 3
            });
            console.log('Sample Library Questions:', JSON.stringify(qs, null, 2));
        } else {
            console.log('No library questions found.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
