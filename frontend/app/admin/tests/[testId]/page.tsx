'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Users, Clock, FileText } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  organizationId: string;
  organizationName?: string;
  createdAt: string;
  _count?: {
    assignments: number;
    questions: number;
  };
  questions?: Array<{
    id: string;
    type: string;
    text: string;
    order: number;
    difficulty?: string;
  }>;
}

export default function AdminTestViewPage() {
  const params = useParams();
  const testId = params?.testId as string;
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/admin/tests/${testId}`);
      if (response.ok) {
        const data = await response.json();
        setTest(data.test);
      } else {
        setError('Test not found');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      setError('Failed to load test');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTest = async () => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const response = await fetch(`/api/admin/tests?id=${testId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/admin/tests');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Test not found'}</p>
            <button
              onClick={() => router.push('/admin/tests')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/admin/tests')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-gray-600 mt-1">{test.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/admin/tests/${testId}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={deleteTest}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Test Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{test.duration} min</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{test._count?.assignments || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{test._count?.questions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Test Details</h3>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization</dt>
                <dd className="mt-1 text-sm text-gray-900">{test.organizationName || 'No organization'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(test.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{test.description}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Questions Section */}
        {test.questions && test.questions.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Questions ({test.questions.length})</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {test.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {question.type}
                        </span>
                        {question.difficulty && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{question.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}