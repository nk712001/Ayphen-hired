import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { companyName, adminName, adminEmail, adminPassword, domain } = await req.json();

        // 1. Validation
        if (!companyName || !adminName || !adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Check if domain exists (if provided)
        if (domain) {
            const existingDomain = await prisma.company.findUnique({
                where: { domain }
            });

            if (existingDomain) {
                return NextResponse.json(
                    { error: 'Company domain already registered' },
                    { status: 409 }
                );
            }
        }

        // 2. Transaction: Create Company, Admin, Settings, Audit Log
        const result = await prisma.$transaction(async (tx: any) => {
            // Create Company
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    domain: domain || undefined,
                    subscriptionTier: 'trial',
                    companySettings: {
                        create: {
                            customBranding: true,
                            emailDomain: domain || undefined
                        }
                    }
                }
            });

            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Create Company Admin
            const admin = await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'COMPANY_ADMIN',
                    companyId: company.id
                }
            });

            // Create Audit Log
            await tx.auditLog.create({
                data: {
                    action: 'CREATE_COMPANY',
                    entityType: 'Company',
                    entityId: company.id,
                    userId: admin.id,
                    companyId: company.id,
                    metadata: JSON.stringify({
                        ip: req.headers.get('x-forwarded-for') || 'unknown',
                        userAgent: req.headers.get('user-agent')
                    })
                }
            });

            return { company, admin };
        });

        return NextResponse.json(
            {
                message: 'Company created successfully',
                companyId: result.company.id,
                userEmail: result.admin.email
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
