import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { emailService } from '@/lib/email-service';

// Migration applied: emailSent field is now available in TestAssignment model

export async function POST(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ['INTERVIEWER', 'COMPANY_ADMIN', 'RECRUITER'];
    if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
      console.log('Authorization failed:', { hasSession: !!session, userId: session?.user?.id, role: session?.user?.role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      candidateId,
      sendEmail = true,
      companyName = 'Our Company',
      customMessage,
      resumeUrl
    } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Get test and candidate data
    const [test, candidate] = await Promise.all([
      prisma.test.findUnique({
        where: { id: params.testId },
        select: {
          id: true,
          title: true,
          duration: true,
          requiresSecondaryCamera: true,
          jobDescription: true,
          resumeUrl: true,
          companyId: true,
          organizationId: true
        }
      }),
      prisma.candidate.findUnique({
        where: { id: candidateId },
        select: {
          id: true,
          name: true,
          email: true,
          resumeUrl: true
        }
      })
    ]);

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to test' }, { status: 403 });
    }

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Check if candidate already has an assignment for this test
    const existingAssignment = await prisma.testAssignment.findFirst({
      where: {
        testId: params.testId,
        candidateId
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        error: 'Candidate already has an assignment for this test'
      }, { status: 400 });
    }

    // Generate unique link
    const uniqueLink = randomBytes(16).toString('hex');

    // Create test assignment with enhanced data
    const assignment = await prisma.testAssignment.create({
      data: {
        testId: params.testId,
        candidateId,
        uniqueLink,
        status: 'pending',
        companyId: test.companyId,
        organizationId: test.organizationId
      },
      include: {
        test: {
          select: {
            title: true,
            duration: true,
            requiresSecondaryCamera: true,
            jobDescription: true,
            resumeUrl: true
          }
        },
        candidate: {
          select: {
            name: true,
            email: true,
            resumeUrl: true
          }
        }
      }
    });

    // Update candidate resume if provided
    let finalResumeUrl = candidate.resumeUrl;
    if (resumeUrl) {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { resumeUrl: resumeUrl }
      });
      finalResumeUrl = resumeUrl;
    } else if (test.resumeUrl) {
      // Fallback to test resume if candidate has none
      finalResumeUrl = test.resumeUrl;
    }

    // Generate AI-based questions for this specific assignment
    let questionCounts = { mcqCount: 3, conversationalCount: 2, codingCount: 1 };

    try {
      if (finalResumeUrl) {
        // Generate personalized questions based on resume and job description
        const questionsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/generate-test-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: params.testId,
            candidateId,
            mcqCount: questionCounts.mcqCount,
            conversationalCount: questionCounts.conversationalCount,
            codingCount: questionCounts.codingCount,
            resumeUrl: finalResumeUrl // Explicitly pass the resume URL
          })
        });

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          console.log(`Generated ${questionsData.questions?.length || 0} AI questions for assignment ${assignment.id}`);
        }
      }
    } catch (error) {
      console.error('Error generating AI questions during assignment:', error);
      // Continue with assignment even if AI question generation fails
    }

    // Send email invitation if requested
    let emailSent = false;
    if (sendEmail) {
      try {
        const emailData = {
          candidateName: candidate.name || 'Candidate',
          candidateEmail: candidate.email || '',
          testTitle: test.title,
          testDuration: test.duration,
          uniqueLink: assignment.uniqueLink,
          companyName,
          interviewerName: session.user.name || 'Interview Team',
          testPreview: {
            mcqCount: questionCounts.mcqCount,
            conversationalCount: questionCounts.conversationalCount,
            codingCount: questionCounts.codingCount,
            requiresSecondaryCamera: test.requiresSecondaryCamera
          }
        };

        // Validate email before sending
        if (!emailData.candidateEmail) {
          console.warn('Candidate email is missing, cannot send invitation');
          emailSent = false;
        } else {
          emailSent = await emailService.sendTestInvitation(emailData);

          if (!emailSent) {
            console.warn(`Failed to send email to ${candidate.email}, but assignment was created`);
          }
        }
      } catch (error) {
        console.error('Error sending email invitation:', error);
        // Don't fail the assignment creation if email fails
      }
    }

    // Update the assignment with the email status
    // Note: emailSent field added via migration 20251127111836_add_email_sent_to_test_assignment
    // Using raw query to avoid Prisma client cache issues
    await prisma.$executeRaw`
      UPDATE TestAssignment 
      SET emailSent = ${emailSent ? 1 : 0}
      WHERE id = ${assignment.id}
    `;

    // Create a test preview for this specific assignment
    const testPreview = {
      assignmentId: assignment.id,
      testTitle: test.title,
      duration: test.duration,
      questionCounts,
      requiresSecondaryCamera: test.requiresSecondaryCamera,
      uniqueLink: assignment.uniqueLink,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      status: 'pending',
      createdAt: assignment.createdAt
    };

    return NextResponse.json({
      assignment: {
        ...assignment,
        testPreview
      },
      emailSent,
      message: emailSent
        ? 'Test assigned successfully and invitation email sent'
        : 'Test assigned successfully (email not sent - check email configuration)'
    });

  } catch (error) {
    console.error('Error assigning test with email:', error);
    return NextResponse.json(
      { error: 'Failed to assign test' },
      { status: 500 }
    );
  }
}
