import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';

interface TestFormData {
  title: string;
  jobDescription: string;
  duration: number;
  requiresSecondaryCamera: boolean;
  mcqQuestions: number;
  conversationalQuestions: number;
  codingQuestions: number;
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
    requiresSecondaryCamera: false,
    mcqQuestions: 5,
    conversationalQuestions: 3,
    codingQuestions: 2
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
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Test</DrawerTitle>
          <DrawerClose onClick={onClose} />
        </DrawerHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-4 overflow-auto">
            {errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
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

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Question Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">MCQ Questions</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    value={formData.mcqQuestions}
                    onChange={e => setFormData(prev => ({ ...prev, mcqQuestions: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Conversational</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    value={formData.conversationalQuestions}
                    onChange={e => setFormData(prev => ({ ...prev, conversationalQuestions: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Coding</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    value={formData.codingQuestions}
                    onChange={e => setFormData(prev => ({ ...prev, codingQuestions: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Total: {formData.mcqQuestions + formData.conversationalQuestions + formData.codingQuestions} questions
              </p>
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
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isLoading ? 'Creating...' : 'Create Test'}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
