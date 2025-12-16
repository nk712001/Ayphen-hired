'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TestTube, Plus, Eye, Edit, Users, Calendar } from 'lucide-react';
import { useOrganization } from '@/providers/OrganizationProvider';

interface Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  createdAt: string;
  assignments?: any[];
  _count?: {
    assignments: number;
  };
}

export default function InterviewerTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { currentOrg } = useOrganization();

  useEffect(() => {
    fetchTests();
  }, [currentOrg]);

  const fetchTests = async () => {
    if (!currentOrg) {
      setTests([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tests?organizationId=${currentOrg.id}`);
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Test Management
            </h1>
            <p className="mt-2 text-gray-600">Create, manage, and assign tests to candidates</p>
          </div>
          <button
            onClick={() => router.push('/interviewer/tests/new')}
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2 text-white" />
            <span className="text-white">Create New Test</span>
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests created yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first test</p>
            <button
              onClick={() => router.push('/interviewer/tests/new')}
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2 text-white" />
              <span className="text-white">Create Your First Test</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary/5 rounded-lg">
                        <TestTube className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/interviewer/tests/${test.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Test"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/interviewer/tests/${test.id}/edit`)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Test"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {test.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {test.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Duration
                      </div>
                      <span className="font-medium text-gray-900">{test.duration} min</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        Assignments
                      </div>
                      <span className="font-medium text-gray-900">
                        {test.assignments?.length || test._count?.assignments || 0}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Created {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => router.push(`/interviewer/tests/${test.id}/assign`)}
                      className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm"
                    >
                      <span className="text-white">Assign Test</span>
                    </button>
                    <button
                      onClick={() => router.push(`/interviewer/tests/${test.id}/preview`)}
                      className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}