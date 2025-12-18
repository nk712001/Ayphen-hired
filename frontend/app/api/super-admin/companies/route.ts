import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search } }, // SQLite contains is case-insensitive usually, but strict mode might vary
                { domain: { contains: search } }
            ];
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: { users: true, organizations: true, tests: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.company.count({ where: whereClause })
        ]);

        return NextResponse.json({
            companies,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, domain, subscriptionTier, adminName, adminEmail, adminPassword } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Validate admin details
        if (!adminEmail || !adminPassword || !adminName) {
            return NextResponse.json({ error: 'Admin details are required' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Use transaction to create company and admin user together
        const company = await prisma.$transaction(async (tx) => {
            const newCompany = await tx.company.create({
                data: {
                    name,
                    domain,
                    subscriptionTier: subscriptionTier || 'trial',
                    subscriptionStatus: 'active',
                    companySettings: {
                        create: {
                            emailDomain: domain
                        }
                    }
                }
            });

            await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'COMPANY_ADMIN',
                    companyId: newCompany.id,
                    isActive: true
                }
            });

            return newCompany;
        });

        await createAuditLog({
            action: 'CREATE_COMPANY',
            entityType: 'Company',
            entityId: company.id,
            metadata: { name: company.name, adminEmail },
            userId: session.user.id
        });

        return NextResponse.json({ company }, { status: 201 });
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
