import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await (prisma as any).company.findUnique({
      where: { id: params.id },
      include: {
        companySettings: true,
        _count: { select: { users: true, organizations: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (!company.companySettings) {
      const newSettings = await (prisma as any).companySettings.upsert({
        where: { companyId: params.id },
        update: {},
        create: { companyId: params.id }
      });
      company.companySettings = newSettings;
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Company API error:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  console.log('[COMPANY_UPDATE] === Company Update API Called ===');
  console.log('[COMPANY_UPDATE] Company ID:', params.id);

  try {
    const session = await getServerSession(authOptions);
    console.log('[COMPANY_UPDATE] Session:', {
      userId: session?.user?.id,
      role: session?.user?.role
    });

    if (!session?.user?.id) {
      console.log('[COMPANY_UPDATE] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[COMPANY_UPDATE] Request body:', body);

    const { name, domain, emailDomain, ssoEnabled, customBranding, aiProctoringLevel, logoUrl, primaryColor } = body;

    // First, check if the company exists
    console.log('[COMPANY_UPDATE] Checking if company exists');
    const existingCompany = await (prisma as any).company.findUnique({
      where: { id: params.id }
    });

    if (!existingCompany) {
      console.log('[COMPANY_UPDATE] Company not found');
      return NextResponse.json({
        error: 'Company not found',
        details: `No company found with ID: ${params.id}`
      }, { status: 404 });
    }
    console.log('[COMPANY_UPDATE] Company exists:', existingCompany.name);

    // Update company basic info
    console.log('[COMPANY_UPDATE] Updating company basic info:', { name, domain });
    try {
      const company = await (prisma as any).company.update({
        where: { id: params.id },
        data: {
          name: name || existingCompany.name,
          domain: domain || existingCompany.domain
        },
      });
      console.log('[COMPANY_UPDATE] Company updated successfully');
    } catch (companyError: any) {
      console.error('[COMPANY_UPDATE] Error updating company:', companyError);
      console.error('[COMPANY_UPDATE] Error code:', companyError.code);
      console.error('[COMPANY_UPDATE] Error meta:', companyError.meta);

      return NextResponse.json({
        error: 'Failed to update company basic info',
        details: companyError.message || 'Unknown database error',
        code: companyError.code
      }, { status: 500 });
    }

    // Update or create company settings
    console.log('[COMPANY_UPDATE] Updating company settings:', {
      emailDomain,
      ssoEnabled,
      customBranding,
      aiProctoringLevel,
      logoUrl,
      primaryColor
    });

    try {
      const settingsData = {
        emailDomain: emailDomain || null,
        ssoEnabled: ssoEnabled === true || ssoEnabled === 'true',
        customBranding: customBranding === true || customBranding === 'true',
        aiProctoringLevel: aiProctoringLevel || 'standard',
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#3B82F6'
      };

      console.log('[COMPANY_UPDATE] Prepared settings data:', settingsData);

      await (prisma as any).companySettings.upsert({
        where: { companyId: params.id },
        update: settingsData,
        create: {
          companyId: params.id,
          ...settingsData
        }
      });
      console.log('[COMPANY_UPDATE] Company settings updated successfully');
    } catch (settingsError: any) {
      console.error('[COMPANY_UPDATE] Error updating company settings:', settingsError);
      console.error('[COMPANY_UPDATE] Error code:', settingsError.code);
      console.error('[COMPANY_UPDATE] Error meta:', settingsError.meta);

      return NextResponse.json({
        error: 'Failed to update company settings',
        details: settingsError.message || 'Unknown database error',
        code: settingsError.code
      }, { status: 500 });
    }

    console.log('[COMPANY_UPDATE] Update completed successfully');
    return NextResponse.json({ success: true, message: 'Company settings updated successfully' });
  } catch (error: any) {
    console.error('[COMPANY_UPDATE] === CRITICAL ERROR ===');
    console.error('[COMPANY_UPDATE] Error details:', error);
    console.error('[COMPANY_UPDATE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[COMPANY_UPDATE] Error code:', error.code);

    return NextResponse.json({
      error: 'Failed to update company',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: error.code
    }, { status: 500 });
  }
}