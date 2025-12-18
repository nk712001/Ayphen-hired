import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { extractTextFromFile, analyzeResumeWithAI } from '@/lib/resume-service';
import { analyzeResumeIntelligently } from '@/lib/intelligent-fallback';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based filtering
    let whereClause: any = { companyId: session.user.companyId };

    if (session.user.role === 'COMPANY_ADMIN') {
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
    } else if (session.user.role === 'RECRUITER') {
      if (organizationId) {
        // Verify access to this organization
        const access = await prisma.recruiterOrganization.findUnique({
          where: {
            recruiterId_organizationId: {
              recruiterId: session.user.id,
              organizationId
            }
          }
        });

        if (!access) {
          return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
        }
        whereClause.organizationId = organizationId;
      } else {
        // Fetch all assigned organizations
        const assignments = await prisma.recruiterOrganization.findMany({
          where: { recruiterId: session.user.id },
          select: { organizationId: true }
        });

        const orgIds = assignments.map((a: any) => a.organizationId);
        whereClause.organizationId = { in: orgIds };
      }
    } else {
      return NextResponse.json({ candidates: [] });
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Status filter
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      whereClause.assignments = {
        some: {
          status: status
        }
      };
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        include: {
          assignments: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              completedAt: true,
              test: { select: { title: true } } // Reduced selection for list view perf
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.candidate.count({ where: whereClause })
    ]);

    // Decrypt phone numbers
    const decryptedCandidates = candidates.map((c: any) => ({
      ...c,
      phone: c.phone ? decrypt(c.phone) : c.phone
    }));

    return NextResponse.json({
      candidates: decryptedCandidates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    let email, name, phone, resumeUrl, organizationId, resumeFile, resumeText;
    let resumeAnalysis: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      email = formData.get('email') as string;
      name = formData.get('name') as string;
      phone = formData.get('phone') as string;
      organizationId = formData.get('organizationId') as string;
      resumeFile = formData.get('resume') as File;

      // Handle File Upload
      if (resumeFile) {
        // Process in memory only - Vercel is Read-Only
        const bytes = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // We cannot save the file to disk on Vercel without external storage (S3/Blob).
        // We will proceed with AI analysis using the memory buffer.
        resumeUrl = ''; // Or a placeholder if needed

        // Parse & Analyze
        try {
          // 1. Try to extract text for Regex Fallback & Indexing
          resumeText = await extractTextFromFile(resumeFile);

          // 2. Perform AI Analysis (Preferring Vision/Buffer)
          // We pass the BUFFER to Gemini so it sees the original layout/scan
          resumeAnalysis = await analyzeResumeWithAI(buffer, resumeFile.type || 'application/pdf');

        } catch (e) {
          console.error('Resume Analysis Failed:', e);
          // 3. Last Resort Fallback (if AI crashed completely and didn't trigger internal fallback)
          resumeAnalysis = analyzeResumeIntelligently(resumeText || '');
        }
      }

    } else {
      // JSON Fallback
      const body = await request.json();
      email = body.email;
      name = body.name;
      phone = body.phone;
      resumeUrl = body.resumeUrl;
      organizationId = body.organizationId;
    }

    if (!email || !organizationId) {
      return NextResponse.json({ error: 'Email and Organization ID are required' }, { status: 400 });
    }

    // Access check
    if (session.user.role === 'RECRUITER') {
      const access = await prisma.recruiterOrganization.findUnique({
        where: {
          recruiterId_organizationId: {
            recruiterId: session.user.id,
            organizationId
          }
        }
      });
      if (!access) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    } else {
      const org = await prisma.organization.findFirst({
        where: { id: organizationId, companyId: session.user.companyId }
      });
      if (!org) return NextResponse.json({ error: 'Invalid organization' }, { status: 400 });
    }

    // Check availability
    const existing = await prisma.candidate.findFirst({
      where: {
        email,
        organizationId,
        companyId: session.user.companyId
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Candidate already exists in this organization' }, { status: 409 });
    }

    // Prepare derived fields
    const analysisJson = JSON.stringify(resumeAnalysis);
    const skillsString = Array.isArray(resumeAnalysis?.skills) ? resumeAnalysis.skills.join(', ') : '';
    // Heuristic for experience years from "5 years" string
    let expYears = 0;
    if (resumeAnalysis?.experience) {
      const match = resumeAnalysis.experience.match(/(\d+)\+?\s*years?/i);
      if (match) expYears = parseInt(match[1], 10);
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone: phone ? encrypt(phone) : null,
        resumeUrl: resumeUrl || '',
        resumeData: analysisJson,
        skills: skillsString,
        experienceYears: expYears,
        companyId: session.user.companyId,
        organizationId
      }
    });

    const returnedCandidate = {
      ...candidate,
      phone: phone,
      analysis: resumeAnalysis
    };

    return NextResponse.json({ candidate: returnedCandidate }, { status: 201 });

  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
