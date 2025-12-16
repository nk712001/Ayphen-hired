import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// GET: Fetch company settings
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            include: { companySettings: true }
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: company.id,
            name: company.name,
            domain: company.domain,
            logo: company.logo,
            primaryColor: company.primaryColor,
            subscriptionTier: company.subscriptionTier,
            subscriptionStatus: company.subscriptionStatus,
            settings: company.companySettings
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// PUT: Update company settings
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'COMPANY_ADMIN' || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, primaryColor, logo, emailDomain, customBranding } = await req.json();

        // 1. Upsert Settings
        const settings = await prisma.companySettings.upsert({
            where: { companyId: session.user.companyId! },
            create: {
                companyId: session.user.companyId!,
                emailDomain,
                customBranding: customBranding ?? true,
            },
            update: {
                emailDomain,
                customBranding
            }
        });

        // 2. Update Company Core Fields
        const company = await prisma.company.update({
            where: { id: session.user.companyId! },
            data: {
                name,
                primaryColor,
                logo
            }
        });

        // 3. Audit (Non-blocking / Outside critical path)
        await createAuditLog({
            action: 'UPDATE_COMPANY',
            entityType: 'Company',
            entityId: company.id,
            userId: session.user.id,
            companyId: company.id,
            metadata: { changes: { name, primaryColor, emailDomain } }
        });

        return NextResponse.json({ ...company, settings });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
