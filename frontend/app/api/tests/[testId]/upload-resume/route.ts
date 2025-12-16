import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ['INTERVIEWER', 'COMPANY_ADMIN', 'RECRUITER'];
    if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const candidateId = formData.get('candidateId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.'
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File size too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `resume_${params.testId}_${candidateId}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const resumeUrl = `/uploads/resumes/${filename}`;

    // Update test with resume URL
    await prisma.test.update({
      where: { id: params.testId },
      data: { resumeUrl }
    });

    // Analyze resume with AI
    let analysisResult = null;
    try {
      const analysisResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/analyze-resume`, {
        method: 'POST',
        body: formData // Forward the same FormData
      });

      if (analysisResponse.ok) {
        analysisResult = await analysisResponse.json();
      }
    } catch (error) {
      console.error('Resume analysis failed:', error);
      // Continue without analysis
    }

    return NextResponse.json({
      success: true,
      resumeUrl,
      filename,
      analysis: analysisResult?.analysis || null,
      message: 'Resume uploaded and analyzed successfully'
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}
