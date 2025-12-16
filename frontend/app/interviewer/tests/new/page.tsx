'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import EnhancedTestCreation from '@/components/tests/EnhancedTestCreation';

export default function NewTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams?.get('candidateId');

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Test</h1>
          <p className="mt-2 text-gray-600">
            Create a test with AI-generated questions or build custom questions manually
          </p>
        </div>
        
        <EnhancedTestCreation 
          candidateId={candidateId || undefined}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}