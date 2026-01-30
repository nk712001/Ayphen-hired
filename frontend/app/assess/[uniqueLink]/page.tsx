import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import AssessFlow from '@/components/tests/AssessFlow';
import { BrandingProvider } from '@/components/BrandingProvider';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Calendar } from 'lucide-react';

interface PageProps {
    params: { uniqueLink: string };
}

export default async function AssessPage({ params }: PageProps) {
    const { uniqueLink } = params;

    try {
        console.log(`[AssessPage] Fetching assignment for link: ${uniqueLink}`);

        // 1. Fetch Assignment with all necessary details
        const assignment = await prisma.testAssignment.findUnique({
            where: { uniqueLink },
            include: {
                test: {
                    include: {
                        questions: {
                            orderBy: { order: 'asc' }
                        },
                        company: {
                            select: {
                                name: true,
                                logo: true,
                                primaryColor: true,
                                companySettings: { select: { customBranding: true } }
                            }
                        }
                    }
                },
                candidate: true,
                answers: true
            }
        });

        if (!assignment) {
            console.log(`[AssessPage] Assignment not found for link: ${uniqueLink}`);
            return notFound();
        }

        // Ensure test exists (should always be true due to foreign key, but safest to check)
        if (!assignment.test) {
            console.error(`[AssessPage] CRITICAL: Assignment ${assignment.id} has no associated test!`);
            throw new Error('Test definition not found for this assignment');
        }

        // 2. Check if completed
        if (assignment.status === 'completed') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-border">
                        <h1 className="text-2xl font-bold mb-4 text-foreground">Test Completed</h1>
                        <p className="text-muted-foreground mb-6">
                            You have already completed this assessment. Thank you for your submission.
                        </p>
                        <div className="text-sm text-muted-foreground">
                            Completed on: {assignment.completedAt?.toLocaleDateString()}
                        </div>
                    </div>
                </div>
            );
        }

        // Handle scheduled tests
        const now = new Date();
        const start = assignment.scheduledStartTime;
        const end = assignment.scheduledEndTime;

        if (assignment.isScheduled && start && now < start) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-lg border-t-4 border-primary p-10 max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-3">Test Upcoming</h1>
                        <p className="text-muted-foreground mb-8 text-lg">
                            This test is scheduled to start on <br />
                            <span className="font-bold text-primary">{start.toLocaleString()}</span>
                        </p>
                        <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/20 text-sm text-blue-800 dark:text-blue-300">
                            Please return to this page at the scheduled time.
                        </div>
                    </div>
                </div>
            );
        }

        if (assignment.isScheduled && end && now > end) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-border">
                        <h1 className="text-2xl font-bold mb-4 text-foreground">Test Window Closed</h1>
                        <p className="text-muted-foreground mb-6">
                            The scheduled time for this assessment has passed.
                        </p>
                        <div className="text-sm text-muted-foreground">
                            Scheduled to end on: {end.toLocaleString()}
                        </div>
                    </div>
                </div>
            );
        }

        // 3. Prepare data safely
        const questionsList = assignment.test.questions || [];
        console.log(`[AssessPage] Found ${questionsList.length} raw questions`);

        const testData = {
            id: assignment.test.id,
            title: assignment.test.title,
            description: assignment.test.jobDescription || undefined,
            duration: assignment.test.duration,
            mcqQuestions: assignment.test.mcqQuestions,
            conversationalQuestions: assignment.test.conversationalQuestions,
            codingQuestions: assignment.test.codingQuestions,
            requiresSecondaryCamera: assignment.test.requiresSecondaryCamera,
            questions: questionsList
                .filter((q: any) => {
                    if (!q) return false;
                    try {
                        const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata || '{}') : q.metadata;
                        // Filter questions based on assignmentId binding if present
                        if (meta?.assignmentId && meta.assignmentId !== assignment.id) {
                            return false;
                        }
                        return true;
                    } catch (e) {
                        console.warn(`[AssessPage] Metadata parse error for filter (keeping question):`, e);
                        return true;
                    }
                })
                .map((q: any) => {
                    let parsedMetadata = {};
                    try {
                        parsedMetadata = typeof q.metadata === 'string'
                            ? JSON.parse(q.metadata || '{}')
                            : (q.metadata || {});
                    } catch (e) {
                        console.error(`[AssessPage] Error parsing metadata for question ${q.id}:`, e);
                    }

                    return {
                        id: q.id,
                        type: q.type as any,
                        text: q.text,
                        metadata: parsedMetadata,
                        difficulty: q.difficulty || undefined,
                        order: q.order
                    };
                })
        };

        const branding = assignment.test.company?.companySettings?.customBranding !== false
            ? {
                primaryColor: assignment.test.company?.primaryColor,
                logo: assignment.test.company?.logo,
                customBranding: true
            }
            : { primaryColor: null, customBranding: false, logo: null };

        return (
            <ProctoringProvider>
                <BrandingProvider
                    primaryColor={branding.primaryColor || '#de065d'}
                    enableCustomBranding={branding.customBranding}
                />
                <div className="min-h-screen bg-gray-50 from-blue-50 to-indigo-50 dark:bg-gray-900 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300 relative">
                    <div className="absolute top-4 right-4 z-50">
                        <ThemeToggle />
                    </div>
                    <AssessFlow
                        test={testData}
                        assignment={{
                            id: assignment.id,
                            uniqueLink: uniqueLink,
                            isScheduled: assignment.isScheduled,
                            scheduledStartTime: assignment.scheduledStartTime,
                            scheduledEndTime: assignment.scheduledEndTime,
                            answers: assignment.answers || []
                        }}
                        token={uniqueLink}
                    />
                </div>
            </ProctoringProvider>
        );
    } catch (error) {
        console.error('[AssessPage] Unhandled Error:', error);
        throw error; // Let Next.js Error Boundary handle it
    }
}
