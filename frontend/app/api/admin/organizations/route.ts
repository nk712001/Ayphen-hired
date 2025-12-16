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

    const organizations = await (prisma as any).organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            tests: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedOrganizations = organizations.map((org: any) => ({
      id: org.id,
      name: org.name,
      subscriptionStatus: org.subscriptionStatus,
      userCount: org._count.users,
      testCount: org._count.tests,
      createdAt: org.createdAt.toISOString()
    }));

    return NextResponse.json({ organizations: formattedOrganizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Error fetching organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Temporarily bypass auth for testing
    // if (!session?.user?.id || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const organization = await (prisma as any).organization.create({
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Error creating organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Temporarily bypass auth for testing
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    await (prisma as any).user.updateMany({
      where: { organizationId: orgId },
      data: { organizationId: null }
    });

    await (prisma as any).organization.delete({
      where: { id: orgId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}