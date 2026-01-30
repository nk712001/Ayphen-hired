'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Candidate } from '@/types';

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/candidates/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setCandidate(data.candidate);
        } else if (response.status === 404) {
          router.push('/interviewer/candidates');
        }
      } catch (error) {
        console.error('Error fetching candidate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidate();
  }, [params.id, router]);

  const handleCopyTestLink = async (uniqueLink: string, assignmentId: string) => {
    try {
      const testUrl = `${window.location.origin}/assess/${uniqueLink}`;
      await navigator.clipboard.writeText(testUrl);
      setCopiedLink(assignmentId);
      setTimeout(() => setCopiedLink(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading candidate details...</div>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{candidate.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.email}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/interviewer/tests/new?candidateId=${candidate.id}`)}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Assign New Test
              </button>
            </div>
          </div>

          {/* Resume Analysis */}
          <div className="bg-card border border-border shadow-sm rounded-xl mb-6 overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Resume Analysis</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {/* Skills */}
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Skills</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {candidate.skills ? (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.split(',').map((skill, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    ) : 'No skills extracted'}
                  </dd>
                </div>

                {/* Experience */}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Experience</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {candidate.experienceYears ? `${candidate.experienceYears} Years` : 'Not specified'}
                  </dd>
                </div>

                {/* Phone */}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd className="mt-1 text-sm text-foreground">{candidate.phone || 'N/A'}</dd>
                </div>


                {/* Detailed Analysis */}
                {candidate.resumeData && (() => {
                  try {
                    const parsed = JSON.parse(candidate.resumeData);
                    return (
                      <>
                        <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                          <dt className="text-sm font-medium text-muted-foreground">Education</dt>
                          <dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{parsed.education || 'N/A'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-muted-foreground">Key Achievements</dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {Array.isArray(parsed.achievements) && parsed.achievements.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {parsed.achievements.map((ach: string, i: number) => (
                                  <li key={i}>{ach}</li>
                                ))}
                              </ul>
                            ) : 'None extracted'}
                          </dd>
                        </div>
                      </>
                    );
                  } catch (e) { return null; }
                })()}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border shadow-sm rounded-xl mb-6 overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">Resume File</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {candidate.resumeUrl ? (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        View Original PDF
                      </a>
                    ) : (
                      'No resume uploaded'
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">Added On</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {new Date(candidate.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Test Assignments */}
          <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">Test Assignments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidate.assignments.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
                    <p className="text-muted-foreground">No tests assigned yet.</p>
                    <button
                      onClick={() => router.push(`/interviewer/tests/new?candidateId=${candidate.id}`)}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-secondary-dark transition-colors text-sm font-medium"
                    >
                      Assign New Test
                    </button>
                  </div>
                ) : (
                  candidate.assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-foreground line-clamp-1" title={assignment.test.title}>
                            {assignment.test.title}
                          </h3>
                          <span className={
                            `px-2.5 py-0.5 text-xs font-semibold rounded-full border 
                            ${assignment.status === 'completed' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                              assignment.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' :
                                'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'}`
                          }>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        {assignment.test.jobDescription && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                            {assignment.test.jobDescription}
                          </p>
                        )}

                        {/* Match Score */}
                        {typeof assignment.matchScore === 'number' && (
                          <div className="mt-3 mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Match Score</span>
                              <span className={`text-xs font-bold ${assignment.matchScore >= 80 ? 'text-green-600 dark:text-green-400' :
                                assignment.matchScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                {assignment.matchScore}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${assignment.matchScore >= 80 ? 'bg-green-500' :
                                  assignment.matchScore >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${assignment.matchScore}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Started:</span>
                            <span className="text-foreground font-medium">
                              {assignment.startedAt ? new Date(assignment.startedAt).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="text-foreground font-medium">
                              {assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-muted/20 border-t border-border flex justify-between items-center rounded-b-xl gap-2">
                        <button
                          onClick={() => handleCopyTestLink(assignment.uniqueLink, assignment.id)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-border bg-background text-xs font-medium rounded-md text-foreground hover:bg-muted transition-colors"
                          title="Copy test link"
                        >
                          {copiedLink === assignment.id ? '✓ Copied' : '🔗 Link'}
                        </button>

                        {assignment.status === 'completed' ? (
                          <button
                            onClick={() => router.push(`/interviewer/assignments/${assignment.id}`)}
                            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-secondary-dark transition-colors"
                          >
                            Results
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/interviewer/assignments/${assignment.id}`)}
                            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-primary text-primary bg-transparent text-xs font-medium rounded-md hover:bg-primary/5 transition-colors"
                          >
                            Status
                          </button>
                        )}

                        {assignment.status === 'pending' && (
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this test assignment?')) {
                                try {
                                  const response = await fetch(`/api/assignments/${assignment.id}`, {
                                    method: 'DELETE'
                                  });
                                  if (response.ok) {
                                    const updatedCandidate = {
                                      ...candidate,
                                      assignments: candidate.assignments.filter(a => a.id !== assignment.id)
                                    };
                                    setCandidate(updatedCandidate);
                                  } else {
                                    alert('Failed to cancel test assignment');
                                  }
                                } catch (error) {
                                  console.error('Error canceling test assignment:', error);
                                  alert('Failed to cancel test assignment');
                                }
                              }
                            }}
                            className="flex-none inline-flex justify-center items-center px-3 py-1.5 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-medium rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Cancel Assignment"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
