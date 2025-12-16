
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: { testId: string } }
) {
    try {
        const testId = params.testId;

        if (!testId) {
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        const test = await prisma.test.findUnique({
            where: { id: testId }
        });

        if (!test) {
            return NextResponse.json({ primaryColor: null, customBranding: false });
        }

        const user = await prisma.user.findUnique({
            where: { id: test.createdBy },
            include: {
                company: {
                    include: {
                        companySettings: true
                    }
                }
            }
        });

        if (!user || !user.company) {
            return NextResponse.json({ primaryColor: null, customBranding: false });
        }

        const company = user.company;
        const settings = company.companySettings;

        return NextResponse.json({
            primaryColor: company.primaryColor,
            customBranding: settings?.customBranding ?? true, // Default to true if not set
            companyName: company.name,
            logo: company.logo
        });

    } catch (error) {
        console.error('Error fetching test branding:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
