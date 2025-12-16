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
      const testUrl = `${window.location.origin}/tests/start/${uniqueLink}`;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading candidate details...</div>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{candidate.email}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/interviewer/tests/new?candidateId=${candidate.id}`)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Assign New Test
              </button>
            </div>
          </div>

          {/* Test Assignments */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Resume Analysis</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {/* Skills */}
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Skills</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.skills ? (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.split(',').map((skill, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    ) : 'No skills extracted'}
                  </dd>
                </div>

                {/* Experience */}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Experience</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.experienceYears ? `${candidate.experienceYears} Years` : 'Not specified'}
                  </dd>
                </div>

                {/* Phone */}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.phone || 'N/A'}</dd>
                </div>


                {/* Detailed Analysis */}
                {candidate.resumeData && (() => {
                  try {
                    const parsed = JSON.parse(candidate.resumeData);
                    return (
                      <>
                        <div className="sm:col-span-2 border-t pt-4 mt-2">
                          <dt className="text-sm font-medium text-gray-500">Education</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{parsed.education || 'N/A'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Key Achievements</dt>
                          <dd className="mt-1 text-sm text-gray-900">
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

          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Resume File</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.resumeUrl ? (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark"
                      >
                        View Original PDF
                      </a>
                    ) : (
                      'No resume uploaded'
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Added On</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(candidate.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Test Assignments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Assignments</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidate.assignments.length === 0 ? (
                      <tr>
                        <td className="px-6 py-4 text-center text-gray-500" colSpan={5}>
                          No tests assigned yet. Click &quot;Assign New Test&quot; to get started.
                        </td>
                      </tr>
                    ) : (
                      candidate.assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.test.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.test.jobDescription}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={
                              `px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'}`
                            }>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.startedAt ? new Date(assignment.startedAt).toLocaleString() : 'Not started'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'Not completed'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Get Test Link Button */}
                              <button
                                onClick={() => handleCopyTestLink(assignment.uniqueLink, assignment.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                title="Copy test link to clipboard"
                              >
                                {copiedLink === assignment.id ? (
                                  <>
                                    ✓ Copied!
                                  </>
                                ) : (
                                  <>
                                    🔗 Get Link
                                  </>
                                )}
                              </button>

                              {/* View Results/Status Button */}
                              {assignment.status === 'completed' ? (
                                <button
                                  onClick={() => router.push(`/interviewer/assignments/${assignment.id}`)}
                                  className="text-primary hover:text-primary-dark"
                                >
                                  View Results
                                </button>
                              ) : (
                                <button
                                  onClick={() => router.push(`/interviewer/assignments/${assignment.id}`)}
                                  className="text-primary hover:text-primary-dark"
                                >
                                  View Status
                                </button>
                              )}

                              {/* Cancel Button (only for pending assignments) */}
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
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
