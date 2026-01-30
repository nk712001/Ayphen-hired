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

type QuestionGenerationMode = 'ai' | 'manual' | 'mixed' | 'set';

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
  const [libraryTab, setLibraryTab] = useState<'questions' | 'sets'>('questions');
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

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

  const fetchSets = async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch('/api/question-sets');
      if (res.ok) {
        const data = await res.json();
        setAvailableSets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleImportSet = async (setId: string) => {
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/question-sets/${setId}`);
      if (res.ok) {
        const set = await res.json();
        const newQuestions = set.questions.map((q: any) => ({
          id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: q.type,
          text: q.text,
          difficulty: q.difficulty,
          order: manualQuestions.length + 1, // Logic needs to be smarter for bulk add, but fine for now
          metadata: typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
        }));

        // Recalculate orders for bulk add
        const startOrder = manualQuestions.length + 1;
        newQuestions.forEach((q: any, i: number) => q.order = startOrder + i);

        setManualQuestions(prev => [...prev, ...newQuestions]);
        setIsLibraryModalOpen(false);
      }
    } catch (e) {
      console.error("Failed to import set", e);
      alert("Failed to import question set");
    } finally {
      setLibraryLoading(false);
    }
  };

  // Custom Handler for "Use This Set" in the dropdown
  const handleSelectSetForCreation = async (setId: string) => {
    if (!setId) {
      setSelectedSetId(null);
      return;
    }
    // Determine questions from the set
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/question-sets/${setId}`);
      if (res.ok) {
        const set = await res.json();
        const newQuestions = set.questions.map((q: any) => ({
          id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: q.type,
          text: q.text,
          difficulty: q.difficulty,
          order: manualQuestions.length + 1,
          metadata: typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
        }));
        newQuestions.forEach((q: any, i: number) => q.order = i + 1);
        setManualQuestions(newQuestions);
        setSelectedSetId(setId);
      }
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

    if ((questionMode === 'manual' || questionMode === 'set') && manualQuestions.length === 0) {
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
        if (questionMode === 'set' && !selectedSetId) {
          setErrors(['Please select a Question Set']);
          return;
        }
        setCurrentStep('questions');
      }
    }
  };

  // ... 

  // In the JSX for Question Generation Method:
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

    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <input
        type="radio"
        name="questionMode"
        value="set"
        checked={questionMode === 'set'}
        onChange={(e) => {
          setQuestionMode('set');
          if (availableSets.length === 0) fetchSets();
        }}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
      />
      <div className="w-full">
        <div className="font-medium text-gray-900">📚 From Question Set</div>
        <div className="text-sm text-gray-500">
          Start with a pre-defined set of questions
        </div>

        {questionMode === 'set' && (
          <div className="mt-3">
            {libraryLoading ? (
              <div className="text-sm text-gray-500">Loading sets...</div>
            ) : availableSets.length === 0 ? (
              <div className="text-sm text-orange-600">No question sets found. Please create one in the Question Bank.</div>
            ) : (
              <select
                className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                value={selectedSetId || ''}
                onChange={(e) => handleSelectSetForCreation(e.target.value)}
              >
                <option value="">-- Select a Question Set --</option>
                {availableSets.map((set: any) => (
                  <option key={set.id} value={set.id}>
                    {set.title} ({set._count?.questions || 0} Qs) - {set.level}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </label>
  </div>

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
      } else if (questionMode === 'manual' || questionMode === 'set') {
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
          <div className={`flex items-center ${currentStep === 'basic' ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'basic' ? 'border-primary bg-primary/10' : 'border-green-600 bg-green-500/10'
              }`}>
              {currentStep === 'questions' ? '✓' : '1'}
            </div>
            <span className="ml-2 font-medium">Basic Information</span>
          </div>

          <div className={`w-16 h-0.5 ${currentStep === 'questions' ? 'bg-green-600' : 'bg-border'}`}></div>

          <div className={`flex items-center ${currentStep === 'questions' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'questions' ? 'border-primary bg-primary/10' : 'border-border bg-muted'
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
          <div className="bg-card shadow-sm border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Create New Test</h2>

            <div className="space-y-6">
              {/* Test Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Frontend Developer Assessment"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Describe the role, required skills, and responsibilities..."
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be used for AI question generation and candidate context
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min="5"
                  max="180"
                  className="w-32 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              {/* Secondary Camera */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secondaryCamera"
                  checked={formData.requiresSecondaryCamera}
                  onChange={(e) => setFormData({ ...formData, requiresSecondaryCamera: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-input bg-background rounded"
                />
                <label htmlFor="secondaryCamera" className="ml-2 text-sm text-foreground">
                  Require secondary camera for enhanced proctoring
                </label>
              </div>

              {/* Question Generation Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Question Generation Method *
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer bg-card transition-colors">
                    <input
                      type="radio"
                      name="questionMode"
                      value="ai"
                      checked={questionMode === 'ai'}
                      onChange={(e) => setQuestionMode(e.target.value as QuestionGenerationMode)}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary bg-background border-input"
                    />
                    <div>
                      <div className="font-medium text-foreground">🤖 AI Generated Questions</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically generate questions based on job description and question counts
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer bg-card transition-colors">
                    <input
                      type="radio"
                      name="questionMode"
                      value="manual"
                      checked={questionMode === 'manual'}
                      onChange={(e) => setQuestionMode(e.target.value as QuestionGenerationMode)}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary bg-background border-input"
                    />
                    <div>
                      <div className="font-medium text-foreground">✏️ Manual Questions</div>
                      <div className="text-sm text-muted-foreground">
                        Create custom questions with full control over content and format
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer bg-card transition-colors">
                    <input
                      type="radio"
                      name="questionMode"
                      value="set"
                      checked={questionMode === 'set'}
                      onChange={(e) => {
                        setQuestionMode('set');
                        if (availableSets.length === 0) fetchSets();
                      }}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary bg-background border-input"
                    />
                    <div className="w-full">
                      <div className="font-medium text-foreground">📚 From Question Set</div>
                      <div className="text-sm text-muted-foreground">
                        Start with a pre-defined set of questions
                      </div>

                      {/* Question Set Selection - Updated colors inside here if needed */}
                      {questionMode === 'set' && (
                        <div className="mt-3">
                          {libraryLoading ? (
                            <div className="text-sm text-muted-foreground">Loading sets...</div>
                          ) : availableSets.length === 0 ? (
                            <div className="text-sm text-orange-600 dark:text-orange-400">No question sets found. Please create one in the Question Bank.</div>
                          ) : (
                            <select
                              className="w-full mt-1 bg-background border-input rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border text-foreground"
                              value={selectedSetId || ''}
                              onChange={(e) => handleSelectSetForCreation(e.target.value)}
                            >
                              <option value="">-- Select a Question Set --</option>
                              {availableSets.map((set: any) => (
                                <option key={set.id} value={set.id}>
                                  {set.title} ({set._count?.questions || 0} Qs) - {set.level}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Question Counts (only for AI mode) */}
              {questionMode === 'ai' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Question Configuration
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Multiple Choice</label>
                      <input
                        type="number"
                        value={formData.mcqQuestions}
                        onChange={(e) => setFormData({ ...formData, mcqQuestions: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Conversational</label>
                      <input
                        type="number"
                        value={formData.conversationalQuestions}
                        onChange={(e) => setFormData({ ...formData, conversationalQuestions: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Coding</label>
                      <input
                        type="number"
                        value={formData.codingQuestions}
                        onChange={(e) => setFormData({ ...formData, codingQuestions: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
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
        currentStep === 'questions' && (questionMode === 'manual' || questionMode === 'set') && (
          <div className="bg-card shadow-sm border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Create Questions</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {manualQuestions.length} question{manualQuestions.length !== 1 ? 's' : ''} created
                </div>
                <button
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="px-4 py-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 rounded-md hover:bg-indigo-500/20 text-sm font-medium transition-colors"
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
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsLibraryModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-card rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-border">

              {/* Tabs */}
              <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-0">
                <div className="border-b border-border">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setLibraryTab('questions')}
                      className={`${libraryTab === 'questions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                      Individual Questions
                    </button>
                    <button
                      onClick={() => {
                        setLibraryTab('sets');
                        if (availableSets.length === 0) fetchSets();
                      }}
                      className={`${libraryTab === 'sets' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                      Question Sets
                    </button>
                  </nav>
                </div>
              </div>

              <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Select Questions from Library</h3>
                <div className="max-h-96 overflow-y-auto">
                  {libraryLoading ? (
                    <p className="text-center py-4 text-muted-foreground">Loading...</p>
                  ) : libraryTab === 'questions' ? (
                    /* Questions List */
                    libraryQuestions.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No questions in library.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {libraryQuestions.map((q: any) => (
                          <li key={q.id} className="py-3 flex items-start">
                            <input
                              type="checkbox"
                              checked={manualQuestions.some(mq => mq.text === q.text)}
                              disabled={manualQuestions.some(mq => mq.text === q.text)}
                              className="mt-1 h-4 w-4 text-primary border-input bg-background rounded"
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
                                }
                              }}
                            />
                            <div className="ml-3 text-sm">
                              <p className="font-medium text-foreground">{q.text}</p>
                              <p className="text-muted-foreground">{q.type} • {q.difficulty}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : (
                    /* Sets List */
                    availableSets.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No question sets found.</p>
                    ) : (
                      <ul className="grid grid-cols-1 gap-4">
                        {availableSets.map((set: any) => (
                          <li key={set.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleImportSet(set.id)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-foreground">{set.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-1">{set.description}</p>
                              </div>
                              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">{set._count?.questions || set.questions?.length || 0} Qs</span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-full ${set.level === 'Easy' ? 'bg-green-100 text-green-800' :
                                set.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {set.level}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </div>
              <div className="bg-muted px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border">
                <button onClick={() => setIsLibraryModalOpen(false)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                  Done
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
          className="px-6 py-2 text-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors"
        >
          {currentStep === 'basic' ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={questionMode === 'ai' && currentStep === 'basic' ? handleSubmit :
            currentStep === 'basic' ? handleNextStep : handleSubmit}
          disabled={isLoading || !currentOrg}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
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
