import { NextResponse } from 'next/server';

export async function GET() {
  const mockResults = {
    test: {
      id: 'mock-test-id',
      title: 'Mock Test - Frontend Developer'
    },
    assignments: [
      {
        id: 'mock-assignment-1',
        status: 'completed',
        completedAt: new Date().toISOString(),
        candidate: {
          id: 'mock-candidate-1',
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        answers: [
          {
            id: 'mock-answer-1',
            content: 'I have 3 years of experience with React and have built several production applications.',
            submittedAt: new Date().toISOString(),
            question: {
              id: 'conv_1',
              text: 'Tell us about your experience with React.',
              type: 'short_answer',
              order: 1
            }
          }
        ]
      }
    ]
  };

  return NextResponse.json(mockResults);
}