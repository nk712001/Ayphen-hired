import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assignment with related data
    const assignment = await prisma.testAssignment.findUnique({
      where: { id: params.id },
      include: {
        test: {
          select: {
            title: true,
            duration: true,
            requiresSecondaryCamera: true
          }
        },
        candidate: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if assignment is still pending
    if (assignment.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only resend email for pending assignments' 
      }, { status: 400 });
    }

    // Prepare email data
    const emailData = {
      candidateName: assignment.candidate.name || 'Candidate',
      candidateEmail: assignment.candidate.email || '',
      testTitle: assignment.test.title,
      testDuration: assignment.test.duration,
      uniqueLink: assignment.uniqueLink,
      companyName: 'Our Company', // Could be made configurable
      interviewerName: session.user.name || 'Interview Team',
      testPreview: {
        mcqCount: 3, // Default values - could be made dynamic
        conversationalCount: 2,
        codingCount: 1,
        requiresSecondaryCamera: assignment.test.requiresSecondaryCamera
      }
    };

    // Validate email
    if (!emailData.candidateEmail) {
      return NextResponse.json({ 
        error: 'Candidate email is missing' 
      }, { status: 400 });
    }

    // Send email
    const emailSent = await emailService.sendTestInvitation(emailData);

    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send email. Check email configuration.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Email resent successfully to ${emailData.candidateEmail}`
    });

  } catch (error) {
    console.error('Error resending email:', error);
    return NextResponse.json(
      { error: 'Failed to resend email' },
      { status: 500 }
    );
  }
}
