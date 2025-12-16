import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Temporarily bypass auth for testing
    // if (!session?.user?.id || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const users = await (prisma as any).user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use raw SQL to delete user and related records
    await (prisma as any).$executeRaw`DELETE FROM "Answer" WHERE "testAssignmentId" IN (SELECT "id" FROM "TestAssignment" WHERE "candidateId" = ${userId})`;
    await (prisma as any).$executeRaw`DELETE FROM "Violation" WHERE "proctorSessionId" IN (SELECT "id" FROM "ProctorSession" WHERE "testAssignmentId" IN (SELECT "id" FROM "TestAssignment" WHERE "candidateId" = ${userId}))`;
    await (prisma as any).$executeRaw`DELETE FROM "ProctorSession" WHERE "testAssignmentId" IN (SELECT "id" FROM "TestAssignment" WHERE "candidateId" = ${userId})`;
    await (prisma as any).$executeRaw`DELETE FROM "TestAssignment" WHERE "candidateId" = ${userId}`;
    await (prisma as any).$executeRaw`DELETE FROM "Question" WHERE "testId" IN (SELECT "id" FROM "Test" WHERE "createdBy" = ${userId})`;
    await (prisma as any).$executeRaw`DELETE FROM "Test" WHERE "createdBy" = ${userId}`;
    await (prisma as any).$executeRaw`DELETE FROM "Session" WHERE "userId" = ${userId}`;
    await (prisma as any).$executeRaw`DELETE FROM "Account" WHERE "userId" = ${userId}`;
    await (prisma as any).$executeRaw`DELETE FROM "User" WHERE "id" = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, role, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (prisma as any).user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        emailVerified: new Date()
      }
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}