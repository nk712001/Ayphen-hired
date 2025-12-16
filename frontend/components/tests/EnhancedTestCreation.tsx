'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ManualQuestionBuilder, { Question } from './ManualQuestionBuilder';
import { useOrganization } from '@/providers/OrganizationProvider';

interface TestFormData {
  title: string;
  jobDescription: string;
  duration: number;
  requiresSecondaryCamera: boolean;
  mcqQuestions: number;
  conversationalQuestions: number;
  codingQuestions: number;
}

type QuestionGenerationMode = 'ai' | 'manual' | 'mixed';

interface EnhancedTestCreationProps {
  candidateId?: string;
  onCancel: () => void;
}

export default function EnhancedTestCreation({ candidateId, onCancel }: EnhancedTestCreationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'basic' | 'questions'>('basic');
  const [questionMode, setQuestionMode] = useState<QuestionGenerationMode>('ai');
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Fetch Library Questions when modal opens
  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch('/api/questions?isLibrary=true');
      const data = await res.json();
      setLibraryQuestions(data.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLibraryLoading(false);
    }
  };

  if (isLibraryModalOpen && libraryQuestions.length === 0 && !libraryLoading) {
    fetchLibrary();
  }

  const [formData, setFormData] = useState<TestFormData>({
    title: '',
    jobDescription: '',
    duration: 60,
    requiresSecondaryCamera: false,
    mcqQuestions: 5,
    conversationalQuestions: 3,
    codingQuestions: 2
  });

  const validateBasicForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push('Test title is required');
    }

    if (formData.duration < 5) {
      newErrors.push('Duration must be at least 5 minutes');
    }

    if (formData.duration > 180) {
      newErrors.push('Duration cannot exceed 180 minutes');
    }

    const totalQuestions = formData.mcqQuestions + formData.conversationalQuestions + formData.codingQuestions;
    if (totalQuestions === 0) {
      newErrors.push('At least one question is required');
    }

    if (totalQuestions > 20) {
      newErrors.push('Total questions cannot exceed 20');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateManualQuestions = (): boolean => {
    const newErrors: string[] = [];

    if (questionMode === 'manual' && manualQuestions.length === 0) {
      newErrors.push('At least one manual question is required');
    }

    for (const question of manualQuestions) {
      if (!question.text.trim()) {
        newErrors.push(`Question ${question.order} is missing text`);
      }

      if (question.type === 'multiple_choice') {
        if (!question.metadata?.options || question.metadata.options.length < 2) {
          newErrors.push(`Question ${question.order} needs at least 2 options`);
        }

        if (question.metadata?.options?.some(opt => !opt.trim())) {
          newErrors.push(`Question ${question.order} has empty options`);
        }

        if (question.metadata?.correctAnswer === undefined) {
          newErrors.push(`Question ${question.order} needs a correct answer selected`);
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 'basic') {
      if (validateBasicForm()) {
        setCurrentStep('questions');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'questions') {
      setCurrentStep('basic');
    }
  };

  const { currentOrg } = useOrganization();

  // ... (validation functions)

  const createTestWithAI = async () => {
    if (!currentOrg) throw new Error('No organization selected');

    try {
      // Create test first
      const testResponse = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: currentOrg.id
        })
      });

      if (!testResponse.ok) {
        throw new Error('Failed to create test');
      }

      const { test } = await testResponse.json();

      // Generate AI questions
      const aiResponse = await fetch('/api/ai/generate-test-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          jobDescription: formData.jobDescription,
          mcqCount: formData.mcqQuestions,
          conversationalCount: formData.conversationalQuestions,
          codingCount: formData.codingQuestions
        })
      });

      if (!aiResponse.ok) {
        console.warn('AI generation failed, test created without questions');
      }

      return test;
    } catch (error) {
      console.error('Error creating test with AI:', error);
      throw error;
    }
  };

  const createTestWithManualQuestions = async () => {
    if (!currentOrg) throw new Error('No organization selected');

    try {
      // Create test first
      const testResponse = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          mcqQuestions: 0,
          conversationalQuestions: 0,
          codingQuestions: 0,
          organizationId: currentOrg.id
        })
      });

      if (!testResponse.ok) {
        throw new Error('Failed to create test');
      }

      const { test } = await testResponse.json();

      // Save manual questions
      const questionsResponse = await fetch(`/api/tests/${test.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: manualQuestions.map(q => ({
            type: q.type,
            text: q.text,
            metadata: q.metadata,
            difficulty: q.difficulty,
            order: q.order
          })),
          replaceAll: true
        })
      });

      if (!questionsResponse.ok) {
        throw new Error('Failed to save manual questions');
      }

      return test;
    } catch (error) {
      console.error('Error creating test with manual questions:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors([]);

    try {
      let isValid = true;

      if (currentStep === 'basic') {
        isValid = validateBasicForm();
        if (isValid && questionMode !== 'ai') {
          setCurrentStep('questions');
          setIsLoading(false);
          return;
        }
      } else if (currentStep === 'questions') {
        isValid = validateManualQuestions();
      }

      if (!isValid) {
        setIsLoading(false);
        return;
      }

      let test;
      if (questionMode === 'ai') {
        test = await createTestWithAI();
      } else if (questionMode === 'manual') {
        test = await createTestWithManualQuestions();
      }

      // Navigate to appropriate page
      if (candidateId) {
        router.push(`/interviewer/tests/${test.id}/assign?candidateId=${candidateId}`);
      } else {
        router.push(`/interviewer/tests/${test.id}`);
      }

    } catch (error) {
      console.error('Error creating test:', error);
      setErrors(['Failed to create test. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalManualQuestions = () => {
    const counts = { mcq: 0, essay: 0, code: 0 };
    manualQuestions.forEach(q => {
      if (q.type === 'multiple_choice') counts.mcq++;
      else if (q.type === 'essay') counts.essay++;
      else if (q.type === 'code') counts.code++;
    });
    return counts;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${currentStep === 'basic' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'basic' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'
              }`}>
              {currentStep === 'questions' ? '✓' : '1'}
            </div>
            <span className="ml-2 font-medium">Basic Information</span>
          </div>

          <div className={`w-16 h-0.5 ${currentStep === 'questions' ? 'bg-green-600' : 'bg-gray-300'}`}></div>

          <div className={`flex items-center ${currentStep === 'questions' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'questions' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}>
              2
            </div>
            <span className="ml-2 font-medium">Questions</span>
          </div>
        </div>
      </div>

      {/* Organization Warning */}
      {
        !currentOrg && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <div className="text-yellow-700">
              <span className="font-bold">Attention:</span> No Client Selected. Please select a client/organization from the top bar before creating a test.
            </div>
          </div>
        )
      }

      {/* Error Display */}
      {
        errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )
      }

      {/* Step 1: Basic Information */}
      {
        currentStep === 'basic' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Test</h2>

            <div className="space-y-6">
              {/* Test Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Frontend Developer Assessment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Describe the role, required skills, and responsibilities..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be used for AI question generation and candidate context
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min="5"
                  max="180"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Secondary Camera */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secondaryCamera"
                  checked={formData.requiresSecondaryCamera}
                  onChange={(e) => setFormData({ ...formData, requiresSecondaryCamera: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="secondaryCamera" className="ml-2 text-sm text-gray-700">
                  Require secondary camera for enhanced proctoring
                </label>
              </div>

              {/* Question Generation Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question Generation Method *
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="questionMode"
                      value="ai"
                      checked={questionMode === 'ai'}
                      onChange={(e) => setQuestionMode(e.target.value as QuestionGenerationMode)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">🤖 AI Generated Questions</div>
                      <div className="text-sm text-gray-500">
                        Automatically generate questions based on job description and question counts
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="questionMode"
                      value="manual"
                      checked={questionMode === 'manual'}
                      onChange={(e) => setQuestionMode(e.target.value as QuestionGenerationMode)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">✏️ Manual Questions</div>
                      <div className="text-sm text-gray-500">
                        Create custom questions with full control over content and format
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Question Counts (only for AI mode) */}
              {questionMode === 'ai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Question Configuration
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Multiple Choice</label>
                      <input
                        type="number"
                        value={formData.mcqQuestions}
                        onChange={(e) => setFormData({ ...formData, mcqQuestions: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Conversational</label>
                      <input
                        type="number"
                        value={formData.conversationalQuestions}
                        onChange={(e) => setFormData({ ...formData, conversationalQuestions: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Coding</label>
                      <input
                        type="number"
                        value={formData.codingQuestions}
                        onChange={(e) => setFormData({ ...formData, codingQuestions: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Total: {formData.mcqQuestions + formData.conversationalQuestions + formData.codingQuestions} questions
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Step 2: Manual Questions */}
      {
        currentStep === 'questions' && questionMode === 'manual' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Questions</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {manualQuestions.length} question{manualQuestions.length !== 1 ? 's' : ''} created
                </div>
                <button
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 text-sm font-medium"
                >
                  📚 Import from Library
                </button>
              </div>
            </div>

            <ManualQuestionBuilder
              questions={manualQuestions}
              onQuestionsChange={setManualQuestions}
              maxQuestions={20}
            />
          </div>
        )
      }

      {/* Library Picker Modal */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsLibraryModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Questions from Library</h3>
                <div className="max-h-96 overflow-y-auto">
                  {libraryLoading ? (
                    <p className="text-center py-4">Loading...</p>
                  ) : libraryQuestions.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No questions in library.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {libraryQuestions.map((q: any) => (
                        <li key={q.id} className="py-3 flex items-start">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newQ: Question = {
                                  id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                  type: q.type,
                                  text: q.text,
                                  difficulty: q.difficulty,
                                  order: manualQuestions.length + 1,
                                  metadata: typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
                                };
                                setManualQuestions([...manualQuestions, newQ]);
                                setIsLibraryModalOpen(false); // Close on select (or keep open for multi? Single for now implies simple flow)
                                // Actually, sticking to single-select close is annoying. Multi-select better?
                                // Let's just simply append for now.
                              }
                            }}
                          />
                          <div className="ml-3 text-sm">
                            <p className="font-medium text-gray-900">{q.text}</p>
                            <p className="text-gray-500">{q.type} • {q.difficulty}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button onClick={() => setIsLibraryModalOpen(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:ml-3 sm:w-auto sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={currentStep === 'basic' ? onCancel : handlePreviousStep}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {currentStep === 'basic' ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={questionMode === 'ai' && currentStep === 'basic' ? handleSubmit :
            currentStep === 'basic' ? handleNextStep : handleSubmit}
          disabled={isLoading || !currentOrg}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
              Creating...
            </>
          ) : (
            questionMode === 'ai' && currentStep === 'basic' ? 'Create Test' :
              currentStep === 'basic' ? 'Next' : 'Create Test'
          )}
        </button>
      </div>
    </div>
  );
}
