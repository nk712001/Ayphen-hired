'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Test } from '@/types';
import EnhancedAssignTestDialog from '@/components/tests/EnhancedAssignTestDialog';

export default function AssignTestPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await fetch(`/api/tests/${params.testId}`);
        if (response.ok) {
          const data = await response.json();
          setTest(data.test);
        } else {
          router.push('/interviewer/tests');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        router.push('/interviewer/tests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [params.testId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading test...</div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedAssignTestDialog
        test={test}
        onClose={() => router.back()}
        onSuccess={() => router.push('/interviewer/tests')}
      />
    </div>
  );
}