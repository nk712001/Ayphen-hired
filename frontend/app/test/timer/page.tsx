import React from 'react';
import TimerTest from '@/components/test/TimerTest';

export default function TimerTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Timer Component Test</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <TimerTest />
        </div>
      </div>
    </div>
  );
}
