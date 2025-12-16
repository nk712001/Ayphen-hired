'use client';

import { useState, useEffect } from 'react';
import { Test } from '@/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';

interface AssignTestDialogProps {
  candidateId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignTestDialog({ candidateId, onClose, onSuccess }: AssignTestDialogProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/tests');
        if (response.ok) {
          const data = await response.json();
          setTests(data.tests);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tests/${selectedTest}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign test');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning test:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Assign Test</DrawerTitle>
          <DrawerClose onClick={onClose} />
        </DrawerHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test
              </label>
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading tests...</div>
              ) : tests.length === 0 ? (
                <div className="text-sm text-gray-500">No tests available. Create a test first.</div>
              ) : (
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  required
                >
                  <option value="">Select a test...</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <DrawerFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !selectedTest}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Test'}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
