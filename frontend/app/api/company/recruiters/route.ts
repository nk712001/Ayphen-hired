import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Auth & Permission Check
        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const recruiters = await prisma.user.findMany({
            where: {
                companyId: session.user.companyId,
                role: 'RECRUITER'
            },
            include: {
                _count: {
                    select: { recruiterOrgs: true, createdTests: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(recruiters);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Auth & Permission Check
        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction: Create User + Audit Log
        const recruiter = await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'RECRUITER',
                    companyId: session.user.companyId!, // ! safe because of check above
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'CREATE_USER',
                    entityType: 'User',
                    entityId: user.id,
                    userId: session.user.id,
                    companyId: session.user.companyId,
                    metadata: JSON.stringify({ recruiterEmail: email })
                }
            });

            return user;
        });

        return NextResponse.json({
            id: recruiter.id,
            name: recruiter.name,
            email: recruiter.email
        }, { status: 201 });

    } catch (error) {
        console.error('Create recruiter error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
