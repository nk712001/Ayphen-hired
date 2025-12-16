'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TestResultsPage() {
  const params = useParams();
  const testId = params?.testId as string;
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        console.log('Fetching results for testId:', testId);
        const response = await fetch(`/api/tests/${testId}/results`);
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Results data:', data);
          setResults(data);
        } else {
          console.error('Failed to fetch results:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
                <p className="text-gray-600 mt-2">Loading...</p>
              </div>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading test results...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
                <p className="text-gray-600 mt-2">Test ID: {testId}</p>
              </div>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Test Results Found</h2>
                <p className="text-gray-600 mb-4">No completed tests found for this test ID.</p>
                <div className="text-sm text-gray-500">
                  <p>Debug Info:</p>
                  <p>Test ID: {testId}</p>
                  <p>Check console for API response details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{results.test.title}</h1>
              <p className="text-gray-600 mt-2">Test Results & Candidate Responses</p>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {!results.assignments || results.assignments.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No test submissions found.</p>
                <div className="text-sm text-gray-400">
                  <p>Debug Info:</p>
                  <p>Test found: {results.test ? 'Yes' : 'No'}</p>
                  <p>Test title: {results.test?.title || 'N/A'}</p>
                  <p>Assignments array: {results.assignments ? `Length ${results.assignments.length}` : 'Null/Undefined'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          results.assignments.map((assignment: any) => (
            <Card key={assignment.id} className="mb-8 border-primary/20 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-primary">{assignment.candidate.name}</CardTitle>
                    <p className="text-gray-600">{assignment.candidate.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2 border-primary text-primary">
                      {assignment.status}
                    </Badge>
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  {assignment.answers.map((answer: any, index: number) => (
                    <div key={answer.id} className="border-l-4 border-primary/30 pl-4">
                      <div className="mb-2">
                        <h3 className="font-medium text-gray-900">
                          Question {index + 1}: {answer.question.type}
                        </h3>
                        <p className="text-gray-700 mt-1">{answer.question.text}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-600 mb-2">Candidate Answer:</h4>
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {answer.content || 'No answer provided'}
                        </p>
                      </div>

                      {answer.submittedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(answer.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}