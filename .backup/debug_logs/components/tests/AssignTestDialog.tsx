'use client';

import { useState } from 'react';
import { Test } from '@/types';

type Props = {
  test: Test;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AssignTestDialog({ test, onClose, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tests/${test.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to assign test');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('Failed to assign test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Test</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter the candidate's email to assign the test "{test.title}"
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Candidate Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={candidateEmail}
              onChange={e => setCandidateEmail(e.target.value)}
              placeholder="candidate@example.com"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isLoading ? 'Assigning...' : 'Assign Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
