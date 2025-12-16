'use client';

import { useState, useEffect } from 'react';
import ManualQuestionBuilder, { Question } from './ManualQuestionBuilder';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';
import { X, Sparkles, Trash2 } from 'lucide-react';

interface TestQuestionManagerProps {
  testId: string;
  onClose: () => void;
}

export default function TestQuestionManager({ testId, onClose }: TestQuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tests/${testId}/questions`);

      if (response.ok) {
        const data = await response.json();
        const formattedQuestions: Question[] = data.questions.map((q: any) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          difficulty: q.difficulty || 'Medium',
          order: q.order,
          metadata: q.metadata ? (typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata) : undefined
        }));
        setQuestions(formattedQuestions);
      } else {
        setError('Failed to load questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsChange = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map((q, index) => ({
            ...q,
            order: index + 1
          })),
          replaceAll: true
        })
      });

      if (response.ok) {
        setHasChanges(false);
        alert('Questions saved successfully!');
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save questions');
      }
    } catch (err) {
      console.error('Error saving questions:', err);
      setError('Failed to save questions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!confirm('This will replace all existing questions with AI-generated ones. Continue?')) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/ai/generate-test-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          mcqCount: 5,
          conversationalCount: 3,
          codingCount: 2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiQuestions: Question[] = data.questions.map((q: any, index: number) => ({
          id: `ai_${Date.now()}_${index}`,
          type: q.type,
          text: q.text,
          difficulty: q.difficulty || 'Medium',
          order: index + 1,
          metadata: q.metadata
        }));

        setQuestions(aiQuestions);
        setHasChanges(true);
        alert(`Generated ${aiQuestions.length} AI questions successfully!`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate AI questions');
      }
    } catch (err) {
      console.error('Error generating AI questions:', err);
      setError('Failed to generate AI questions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all questions? This cannot be undone.')) {
      setQuestions([]);
      setHasChanges(true);
    }
  };

  const getQuestionCounts = () => {
    const counts = { mcq: 0, essay: 0, code: 0 };
    questions.forEach(q => {
      if (q.type === 'multiple_choice') counts.mcq++;
      else if (q.type === 'essay') counts.essay++;
      else if (q.type === 'code') counts.code++;
    });
    return counts;
  };

  const counts = getQuestionCounts();

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-4xl mx-auto h-screen">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-semibold text-gray-900">
                Manage Test Questions
              </DrawerTitle>
              <p className="text-sm text-gray-500 mt-1">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
                {questions.length > 0 && (
                  <span className="ml-2">
                    ({counts.mcq} MCQ, {counts.essay} Essay, {counts.code} Code)
                  </span>
                )}
              </p>
            </div>
            <DrawerClose className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate AI Questions</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isSaving || questions.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Questions Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading questions...</p>
              </div>
            </div>
          ) : (
            <ManualQuestionBuilder
              questions={questions}
              onQuestionsChange={handleQuestionsChange}
              maxQuestions={20}
            />
          )}
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm">
              {hasChanges && (
                <span className="text-orange-600 font-medium">
                  ⚠️ You have unsaved changes
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Total: {questions.length}/20 questions
            </div>
          </div>
          <div className="flex space-x-3 w-full mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
