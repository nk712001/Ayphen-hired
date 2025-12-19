import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import AssessFlow from '@/components/tests/AssessFlow';
import { BrandingProvider } from '@/components/BrandingProvider';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                        <h1 className="text-2xl font-bold mb-4 text-gray-900">Test Completed</h1>
                        <p className="text-gray-600 mb-6">
                            You have already completed this assessment. Thank you for your submission.
                        </p>
                        <div className="text-sm text-gray-500">
                            Completed on: {assignment.completedAt?.toLocaleDateString()}
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
                <div className="min-h-screen bg-gray-50 from-blue-50 to-indigo-50">
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
