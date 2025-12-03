import { useState } from 'react';

interface TestFormData {
  title: string;
  jobDescription: string;
  duration: number;
  requiresSecondaryCamera: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const validateTestData = (data: TestFormData): ValidationResult => {
  const errors: string[] = [];

  if (!data.title.trim()) {
    errors.push('Title is required');
  } else if (data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (data.jobDescription && data.jobDescription.length > 1000) {
    errors.push('Job description must be less than 1000 characters');
  }

  if (!data.duration || data.duration < 5) {
    errors.push('Duration must be at least 5 minutes');
  } else if (data.duration > 180) {
    errors.push('Duration must be less than 180 minutes');
  }

  return { isValid: errors.length === 0, errors };
};

export default function CreateTestDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<TestFormData>({
    title: '',
    jobDescription: '',
    duration: 60,
    requiresSecondaryCamera: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const { isValid, errors } = validateTestData(formData);
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating test:', error);
      setErrors(['Failed to create test. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Test</h2>

        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
            <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Job Description</label>
            <textarea
              rows={3}
              maxLength={1000}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.jobDescription}
              onChange={e => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.jobDescription.length}/1000 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration (minutes)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              required
              min={5}
              max={180}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.duration}
              onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
            />
            <p className="mt-1 text-xs text-gray-500">Between 5 and 180 minutes</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresSecondaryCamera"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={formData.requiresSecondaryCamera}
              onChange={e => setFormData(prev => ({ ...prev, requiresSecondaryCamera: e.target.checked }))}
            />
            <label htmlFor="requiresSecondaryCamera" className="ml-2 block text-sm text-gray-900">
              Require Secondary Camera
            </label>
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
              {isLoading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
