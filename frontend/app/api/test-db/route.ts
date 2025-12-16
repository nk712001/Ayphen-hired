import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    
    const users = await prisma.user.findMany({
      select: { email: true, role: true, name: true }
    });

    // Check company tables with raw SQL
    let companyCount = 0;
    try {
      const companies = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Company"`;
      companyCount = Number((companies as any)[0]?.count) || 0;
    } catch (e) {
      // Company table doesn't exist
    }

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        orgCount,
        companyCount,
        users: users.slice(0, 5), // First 5 users
        databasePath: process.env.DATABASE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databasePath: process.env.DATABASE_URL
    }, { status: 500 });
  }
}