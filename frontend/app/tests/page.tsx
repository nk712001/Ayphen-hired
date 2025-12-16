'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface TestAssignment {
  id: string;
  status: string;
  uniqueLink: string;
  test: {
    id: string;
    title: string;
    jobDescription?: string;
    duration: number;
    mcqQuestions: number;
    conversationalQuestions: number;
    codingQuestions: number;
  };
}

export default function TestsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/user/assignments');
        if (response.ok) {
          const data = await response.json();
          setAssignments(data.assignments || []);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchAssignments();
    }
  }, [session]);

  const handleStartTest = (assignment: TestAssignment) => {
    router.push(`/assess/${assignment.uniqueLink}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading your tests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Available Tests</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No Tests Assigned</h2>
            <p className="text-gray-500">You don&apos;t have any tests assigned yet. Please contact your interviewer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-medium text-gray-900">{assignment.test.title}</h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span className="flex items-center mr-4">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {assignment.test.duration} mins
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Question Breakdown:</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-primary/10 rounded">
                        <div className="font-medium text-primary">{assignment.test.mcqQuestions}</div>
                        <div className="text-primary/70">MCQ</div>
                      </div>
                      <div className="text-center p-2 bg-primary/10 rounded">
                        <div className="font-medium text-primary">{assignment.test.conversationalQuestions}</div>
                        <div className="text-primary/70">Interview</div>
                      </div>
                      <div className="text-center p-2 bg-primary/10 rounded">
                        <div className="font-medium text-primary">{assignment.test.codingQuestions}</div>
                        <div className="text-primary/70">Coding</div>
                      </div>
                    </div>
                    <div className="text-center mt-2 text-sm font-medium text-gray-700">
                      Total: {assignment.test.mcqQuestions + assignment.test.conversationalQuestions + assignment.test.codingQuestions} questions
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTest(assignment)}
                    disabled={assignment.status === 'completed'}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-md ${assignment.status === 'completed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'text-white bg-primary hover:bg-primary-dark'
                      }`}
                  >
                    {assignment.status === 'completed' ? 'Test Completed' :
                      assignment.status === 'in_progress' ? 'Continue Test' : 'Start Test'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
