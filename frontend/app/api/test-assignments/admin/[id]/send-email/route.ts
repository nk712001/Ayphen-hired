import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;

    // Get the test assignment with test and candidate details
    const assignment = await (prisma as any).testAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            duration: true,
            createdBy: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if the assignment belongs to the current interviewer
    if (assignment.test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if email was already sent
    if (assignment.emailSent) {
      return NextResponse.json({ 
        error: 'Email has already been sent for this assignment' 
      }, { status: 400 });
    }

    // Check if assignment is in pending status
    if (assignment.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only send emails for pending assignments' 
      }, { status: 400 });
    }

    // Validate candidate email
    if (!assignment.candidate.email || assignment.candidate.email.trim() === '') {
      return NextResponse.json({ 
        error: 'Candidate does not have a valid email address' 
      }, { status: 400 });
    }

    // Get test preview data
    const questions = await (prisma as any).question.findMany({
      where: { testId: assignment.test.id },
      select: { type: true }
    });

    const testPreview = {
      mcqCount: questions.filter((q: any) => q.type === 'multiple_choice').length,
      conversationalCount: questions.filter((q: any) => q.type === 'essay').length,
      codingCount: questions.filter((q: any) => q.type === 'code').length,
      requiresSecondaryCamera: false // You can get this from test if needed
    };

    // Prepare email data
    const emailData = {
      candidateName: assignment.candidate.name,
      candidateEmail: assignment.candidate.email,
      testTitle: assignment.test.title,
      testDuration: assignment.test.duration,
      uniqueLink: assignment.uniqueLink,
      companyName: process.env.COMPANY_NAME || 'Ayphen Hire',
      interviewerName: session.user.name || 'Interviewer',
      testPreview
    };

    // Validate email before sending
    if (!emailData.candidateEmail) {
      return NextResponse.json({ 
        error: 'Candidate email is missing' 
      }, { status: 400 });
    }

    // Send email invitation
    const emailSent = await emailService.sendTestInvitation(emailData);

    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send email. Check email configuration.' 
      }, { status: 500 });
    }

    // Update the assignment to mark email as sent using raw SQL
    await prisma.$executeRaw`
      UPDATE TestAssignment 
      SET emailSent = 1
      WHERE id = ${assignment.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailSent: true
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
