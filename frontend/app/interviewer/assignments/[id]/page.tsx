'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestResults from './TestResults';

interface Assignment {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  test: {
    title: string;
    jobDescription?: string;
  };
  candidate: {
    name: string;
    email: string;
  };
}

export default function AssignmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/assignments/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setAssignment(data.assignment);
        } else if (response.status === 404) {
          router.push('/interviewer/candidates');
        }
      } catch (error) {
        console.error('Error fetching assignment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading assignment details...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Assignment Not Found</h1>
          <p className="text-muted-foreground mb-4">The assignment you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/interviewer/candidates')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Test Assignment</h1>
              <p className="mt-1 text-sm text-muted-foreground">Assignment ID: {assignment.id}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/interviewer/assignments/${params.id}/preview`)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Preview Test & Questions
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-input rounded-lg shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Want to see the test questions and configuration?
                  </h3>
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
                    Click &quot;Preview Test & Questions&quot; above to see the complete test preview with auto-generated personalized questions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border shadow-sm rounded-xl mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">Assignment Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Test</dt>
                  <dd className="mt-1 text-sm text-foreground">{assignment.test.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Candidate</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {assignment.candidate.name} ({assignment.candidate.email})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.status === 'completed' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' :
                      assignment.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' :
                        'bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20'
                      }`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Started At</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {assignment.startedAt ? new Date(assignment.startedAt).toLocaleString() : 'Not started'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Completed At</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'Not completed'}
                  </dd>
                </div>
                {assignment.test.jobDescription && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Job Description</dt>
                    <dd className="mt-1 text-sm text-foreground">{assignment.test.jobDescription}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {assignment.status === 'completed' && (
            <TestResults assignmentId={assignment.id} />
          )}
        </div>
      </div>
    </div>
  );
}