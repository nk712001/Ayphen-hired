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
        return notFound();
    }

    // 2. Check if completed
    if (assignment.status === 'completed') {
        // Show completed state
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

    // 3. Prepare data
    const testData = {
        id: assignment.test.id,
        title: assignment.test.title,
        description: assignment.test.jobDescription || undefined,
        duration: assignment.test.duration,
        mcqQuestions: assignment.test.mcqQuestions,
        conversationalQuestions: assignment.test.conversationalQuestions,
        codingQuestions: assignment.test.codingQuestions,
        requiresSecondaryCamera: assignment.test.requiresSecondaryCamera,
        questions: assignment.test.questions
            .filter((q: any) => {
                // Filter questions: Include if no assignmentId in metadata OR matches current assignment
                try {
                    const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata || '{}') : q.metadata;
                    if (meta?.assignmentId && meta.assignmentId !== assignment.id) {
                        return false;
                    }
                    return true;
                } catch {
                    return true; // Include if metadata parses error (assume safe)
                }
            })
            .map((q: any) => {
                let parsedMetadata = {};
                try {
                    parsedMetadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
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

    const initialTimeRemaining = assignment.test.duration * 60; // Calculate properly based on start time if resumed

    // TODO: Add welcome screen here? For now, render TestSession directly is fine, 
    // but usually users expect a "Start" button page.

    // Let's wrap TestSession in a Client Component that handles the "Start" state if needed,
    // but TestSession assumes it's taking the test. 
    // Ideally, this page IS the test taking page.
    // The user likely clicked a link in email saying "Start Test".

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
                        answers: assignment.answers
                    }}
                    token={uniqueLink}
                />
            </div>
        </ProctoringProvider>
    );
}
