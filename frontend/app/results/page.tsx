'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type TestResult = {
  id: number;
  title: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: string;
  passed: boolean;
};

export default function ResultsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Sample test results data
  const testResults: TestResult[] = [
    {
      id: 1,
      title: 'Frontend Developer Assessment',
      date: '2023-06-15',
      score: 85,
      totalQuestions: 20,
      correctAnswers: 17,
      timeSpent: '45:22',
      passed: true,
    },
    {
      id: 2,
      title: 'JavaScript Fundamentals',
      date: '2023-05-22',
      score: 92,
      totalQuestions: 15,
      correctAnswers: 14,
      timeSpent: '35:10',
      passed: true,
    },
    {
      id: 3,
      title: 'React.js Advanced Concepts',
      date: '2023-04-10',
      score: 78,
      totalQuestions: 25,
      correctAnswers: 19,
      timeSpent: '65:45',
      passed: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Test Results</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Test Performance Summary</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your overall test performance and statistics.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tests Taken</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{testResults.length}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Average Score</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {Math.round(testResults.reduce((acc, curr) => acc + curr.score, 0) / testResults.length)}%
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total Questions</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {testResults.reduce((acc, curr) => acc + curr.totalQuestions, 0)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Correct Answers</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {testResults.reduce((acc, curr) => acc + curr.correctAnswers, 0)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {testResults.map((test) => (
            <div key={test.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{test.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Completed on {new Date(test.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    test.passed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {test.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Score</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            test.score >= 70 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${test.score}%` }}
                        ></div>
                      </div>
                      <div className="mt-1">{test.score}%</div>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Correct Answers</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {test.correctAnswers} out of {test.totalQuestions}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Time Spent</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{test.timeSpent}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
