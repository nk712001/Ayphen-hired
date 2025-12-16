import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companies = await (prisma as any).company.findMany({
      where: session.user.role === 'admin' ? {} : { users: { some: { id: session.user.id } } },
      include: {
        _count: { select: { users: true, organizations: true } },
        companySettings: true,
      },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, domain } = await request.json();
    
    const company = await (prisma as any).company.create({
      data: {
        name,
        domain,
        companySettings: {
          create: {
            emailDomain: domain,
          },
        },
      },
      include: { companySettings: true },
    });

    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}