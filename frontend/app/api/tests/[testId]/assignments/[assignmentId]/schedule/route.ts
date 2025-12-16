import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';

export async function POST(
    request: Request,
    { params }: { params: { testId: string; assignmentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { scheduledStartTime, scheduledEndTime, sendEmailNotification } = await request.json();

        // Validation
        if (!scheduledStartTime || !scheduledEndTime) {
            return NextResponse.json({ error: 'Start and end times are required' }, { status: 400 });
        }

        const startTime = new Date(scheduledStartTime);
        const endTime = new Date(scheduledEndTime);
        const now = new Date();

        if (startTime >= endTime) {
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        if (startTime < now) {
            return NextResponse.json({ error: 'Start time must be in the future' }, { status: 400 });
        }

        // Get the assignment with test and candidate details
        const assignment = await prisma.testAssignment.findUnique({
            where: { id: params.assignmentId },
            include: {
                test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        companyId: true,
                        organizationId: true
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

        // Verify access
        if (assignment.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (session.user.role === 'RECRUITER') {
            const access = await prisma.recruiterOrganization.findUnique({
                where: {
                    recruiterId_organizationId: {
                        recruiterId: session.user.id,
                        organizationId: assignment.test.organizationId
                    }
                }
            });

            if (!access) {
                return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
            }
        }

        // Update the assignment with scheduling details
        const updatedAssignment = await prisma.testAssignment.update({
            where: { id: params.assignmentId },
            data: {
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
                isScheduled: true
            },
            include: {
                test: {
                    select: {
                        title: true,
                        duration: true
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

        // Send email notification if requested
        if (sendEmailNotification) {
            try {
                // Get company and test details for email
                const company = await prisma.company.findUnique({
                    where: { id: assignment.companyId },
                    select: { name: true }
                });

                const fullTest = await prisma.test.findUnique({
                    where: { id: params.testId },
                    select: {
                        mcqQuestions: true,
                        conversationalQuestions: true,
                        codingQuestions: true,
                        requiresSecondaryCamera: true
                    }
                });

                const emailData = {
                    candidateName: updatedAssignment.candidate.name,
                    candidateEmail: updatedAssignment.candidate.email,
                    testTitle: updatedAssignment.test.title,
                    testDuration: updatedAssignment.test.duration,
                    uniqueLink: updatedAssignment.uniqueLink,
                    companyName: company?.name || 'Our Company',
                    interviewerName: session.user.name || 'Interview Team',
                    testPreview: {
                        mcqCount: fullTest?.mcqQuestions || 0,
                        conversationalCount: fullTest?.conversationalQuestions || 0,
                        codingCount: fullTest?.codingQuestions || 0,
                        requiresSecondaryCamera: fullTest?.requiresSecondaryCamera || false
                    }
                };

                const emailSent = await emailService.sendTestInvitation(emailData);

                if (emailSent) {
                    // Mark email as sent
                    await prisma.testAssignment.update({
                        where: { id: params.assignmentId },
                        data: { emailSent: true }
                    });
                    console.log(`Scheduled test email sent to ${updatedAssignment.candidate.email}`);
                } else {
                    console.warn(`Failed to send scheduled test email to ${updatedAssignment.candidate.email}`);
                }
            } catch (emailError) {
                console.error('Error sending schedule email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            assignment: updatedAssignment,
            message: 'Test scheduled successfully'
        });
    } catch (error) {
        console.error('Error scheduling test:', error);
        return NextResponse.json(
            { error: 'Failed to schedule test' },
            { status: 500 }
        );
    }
}
