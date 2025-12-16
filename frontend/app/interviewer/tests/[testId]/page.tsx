'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestQuestionManager from '@/components/tests/TestQuestionManager';
import ScheduleTestDialog from '@/components/tests/ScheduleTestDialog';
import { Clock, Calendar, Users, Settings, Edit3, UserPlus, Eye, BarChart3, CheckCircle, AlertCircle, XCircle, ArrowLeft, CalendarClock } from 'lucide-react';
import { ProctoringProvider } from '@/lib/proctoring/proctoring-context';

import { Test, TestAssignment } from '@/types';

export default function TestDetailsPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await fetch(`/api/tests/${params.testId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched test data:', data.test);
          console.log('Assignments:', data.test?.assignments);
          setTest(data.test);
        } else {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          if (response.status === 404) {
            router.push('/interviewer/tests');
          } else {
            console.error('Failed to fetch test:', errorText);
          }
        }
      } catch (error) {
        console.error('Error fetching test:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [params.testId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Loading test details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Not Found</h3>
          <p className="text-gray-600">The test could not be loaded. Please check the console for errors.</p>
        </div>
      </div>
    );
  }

  // Calculate question stats
  const questionStats = {
    mcq: test.mcqQuestions || 0,
    coding: test.codingQuestions || 0,
    video: test.conversationalQuestions || 0,
    total: (test.mcqQuestions || 0) + (test.codingQuestions || 0) + (test.conversationalQuestions || 0)
  };

  return (
    <ProctoringProvider>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tests
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${(test as any).status === 'Published'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                  {(test as any).status || 'Draft'}
                </span>
              </div>
              <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Created {new Date(test.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/interviewer/tests/${params.testId}/preview`)}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                onClick={() => setShowQuestionManager(true)}
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Questions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">{test.duration}</span>
                    <span className="text-sm text-gray-500 mb-1">mins</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 mb-1">Questions</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">{questionStats.total}</span>
                    <span className="text-sm text-gray-500 mb-1">total</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 mb-1">Attempts</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">{test.assignments?.filter(a => a.status === 'completed').length || 0}</span>
                    <span className="text-sm text-gray-500 mb-1">completed</span>
                  </div>
                </div>
              </div>

              {/* Candidates Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Candidates</h2>
                    <p className="text-sm text-gray-500">Manage test assignments</p>
                  </div>
                  <button
                    onClick={() => router.push(`/interviewer/tests/${test.id}/assign`)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite Candidate
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {(!test.assignments || test.assignments.length === 0) ? (
                    <div className="p-8 text-center bg-gray-50">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No candidates invited yet.</p>
                    </div>
                  ) : (
                    test.assignments.map((assignment: any) => (
                      <div key={assignment.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {assignment.candidate.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{assignment.candidate.name}</p>
                              <p className="text-sm text-gray-500">{assignment.candidate.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-md font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                              assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                assignment.isScheduled ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-600'
                              }`}>
                              {assignment.isScheduled && assignment.status === 'pending' ? 'Scheduled' : assignment.status.replace('_', ' ')}
                            </span>

                            {/* Schedule Button for pending assignments */}
                            {assignment.status === 'pending' && !assignment.isScheduled && (
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowScheduleDialog(true);
                                }}
                                className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                              >
                                <CalendarClock className="h-3 w-3" />
                                <span>Schedule</span>
                              </button>
                            )}

                            {/* Reschedule Button for scheduled assignments */}
                            {assignment.isScheduled && assignment.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowScheduleDialog(true);
                                }}
                                className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                              >
                                <CalendarClock className="h-3 w-3" />
                                <span>Reschedule</span>
                              </button>
                            )}

                            {assignment.status === 'completed' && (
                              <button
                                onClick={() => router.push(`/interviewer/assignments/${assignment.id}`)}
                                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                              >
                                <BarChart3 className="h-3 w-3" />
                                <span>Results</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Show scheduled time if scheduled */}
                        {assignment.isScheduled && assignment.scheduledStartTime && assignment.scheduledEndTime && (
                          <div className="ml-13 mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-4 text-xs text-purple-800">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Opens: {new Date(assignment.scheduledStartTime).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Closes: {new Date(assignment.scheduledEndTime).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - 1 Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  Configuration
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Proctoring</span>
                    <span className="text-sm font-medium text-gray-900">
                      {test.requiresSecondaryCamera ? 'Secondary Camera' : 'Standard'}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Question Mix</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Multiple Choice</span>
                      <span className="font-medium">{questionStats.mcq}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coding</span>
                      <span className="font-medium">{questionStats.coding}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Video Response</span>
                      <span className="font-medium">{questionStats.video}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showQuestionManager && (
          <TestQuestionManager
            testId={params.testId}
            onClose={() => setShowQuestionManager(false)}
          />
        )}

        {showScheduleDialog && selectedAssignment && (
          <ScheduleTestDialog
            testId={params.testId}
            assignmentId={selectedAssignment.id}
            testTitle={test?.title || ''}
            candidateName={selectedAssignment.candidate.name}
            candidateEmail={selectedAssignment.candidate.email}
            onClose={() => {
              setShowScheduleDialog(false);
              setSelectedAssignment(null);
            }}
            onSuccess={() => {
              setShowScheduleDialog(false);
              setSelectedAssignment(null);
              window.location.reload();
            }}
          />
        )}
      </div>
    </ProctoringProvider>
  );
}
