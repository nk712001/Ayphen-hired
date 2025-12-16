'use client';

import { useState } from 'react';
// Using simple text icons instead of heroicons for compatibility
// import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export interface Question {
  id: string;
  type: 'multiple_choice' | 'essay' | 'code';
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  order: number;
  category?: string;
  tags?: string[];
  metadata?: {
    options?: string[];
    correctAnswer?: number;
    language?: string;
    starterCode?: string;
    maxLength?: number;
    minWords?: number;
    maxWords?: number;
  };
}

interface ManualQuestionBuilderProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  maxQuestions?: number;
  suggestedTags?: string[];
}

export default function ManualQuestionBuilder({
  questions,
  onQuestionsChange,
  maxQuestions = 20,
  suggestedTags = []
}: ManualQuestionBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      text: '',
      difficulty: 'Medium',
      order: questions.length + 1,
      metadata: type === 'multiple_choice'
        ? { options: ['', '', '', ''], correctAnswer: 0 }
        : type === 'code'
          ? { language: 'javascript', starterCode: '' }
          : { maxWords: 200, minWords: 50 }
    };

    onQuestionsChange([...questions, newQuestion]);
    setEditingQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    const updatedQuestions = questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    );
    onQuestionsChange(updatedQuestions);
  };

  const deleteQuestion = (id: string) => {
    const filteredQuestions = questions
      .filter(q => q.id !== id)
      .map((q, index) => ({ ...q, order: index + 1 }));
    onQuestionsChange(filteredQuestions);
    setEditingQuestion(null);
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newQuestions[index], newQuestions[targetIndex]] =
      [newQuestions[targetIndex], newQuestions[index]];

    // Update order numbers
    newQuestions.forEach((q, i) => q.order = i + 1);

    onQuestionsChange(newQuestions);
  };

  const updateMCQOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.metadata?.options) {
      const newOptions = [...question.metadata.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, {
        metadata: { ...question.metadata, options: newOptions }
      });
    }
  };

  const addMCQOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.metadata?.options && question.metadata.options.length < 6) {
      const newOptions = [...question.metadata.options, ''];
      updateQuestion(questionId, {
        metadata: { ...question.metadata, options: newOptions }
      });
    }
  };

  const removeMCQOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.metadata?.options && question.metadata.options.length > 2) {
      const newOptions = question.metadata.options.filter((_, i) => i !== optionIndex);
      const correctAnswer = question.metadata.correctAnswer || 0;
      const newCorrectAnswer = correctAnswer >= optionIndex ? Math.max(0, correctAnswer - 1) : correctAnswer;

      updateQuestion(questionId, {
        metadata: {
          ...question.metadata,
          options: newOptions,
          correctAnswer: newCorrectAnswer
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Question Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => addQuestion('multiple_choice')}
          disabled={questions.length >= maxQuestions}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-2">+</span>
          Add Multiple Choice
        </button>
        <button
          onClick={() => addQuestion('essay')}
          disabled={questions.length >= maxQuestions}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-2">+</span>
          Add Essay Question
        </button>
        <button
          onClick={() => addQuestion('code')}
          disabled={questions.length >= maxQuestions}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-2">+</span>
          Add Coding Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {index + 1}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${question.type === 'multiple_choice' ? 'bg-purple-100 text-purple-800' :
                  question.type === 'essay' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                  {question.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Move buttons */}
                <button
                  onClick={() => moveQuestion(question.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <span>↑</span>
                </button>
                <button
                  onClick={() => moveQuestion(question.id, 'down')}
                  disabled={index === questions.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <span>↓</span>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <span>🗑️</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={question.text}
                onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                placeholder="Enter your question here..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={question.difficulty}
                onChange={(e) => updateQuestion(question.id, { difficulty: e.target.value as Question['difficulty'] })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Category (Role) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category / Role
              </label>
              <input
                type="text"
                value={question.category || ''}
                onChange={(e) => updateQuestion(question.id, { category: e.target.value })}
                placeholder="e.g. Frontend, Backend, DevOps"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags (Skills) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags / Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(question.tags || []).map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = (question.tags || []).filter((_, index) => index !== i);
                        updateQuestion(question.id, { tags: newTags });
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !(question.tags || []).includes(val)) {
                        updateQuestion(question.id, { tags: [...(question.tags || []), val] });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Common Tags Suggestions */}
              <div className="mt-2 text-xs text-gray-500">
                <span className="mr-2">Suggestions:</span>
                {(suggestedTags.length > 0 ? suggestedTags : ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Agile']).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!(question.tags || []).includes(tag)) {
                        updateQuestion(question.id, { tags: [...(question.tags || []), tag] });
                      }
                    }}
                    className="mr-2 hover:text-blue-600 underline"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type Specific Fields */}
            {question.type === 'multiple_choice' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Answer Options *
                  </label>
                  <button
                    onClick={() => addMCQOption(question.id)}
                    disabled={(question.metadata?.options?.length || 0) >= 6}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Add Option
                  </button>
                </div>

                {question.metadata?.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name={`correct_${question.id}`}
                      checked={question.metadata?.correctAnswer === optionIndex}
                      onChange={() => updateQuestion(question.id, {
                        metadata: { ...question.metadata, correctAnswer: optionIndex }
                      })}
                      className="text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateMCQOption(question.id, optionIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {question.metadata?.options && (question.metadata.options.length || 0) > 2 && (
                      <button
                        onClick={() => removeMCQOption(question.id, optionIndex)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <span>🗑️</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {question.type === 'essay' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Words
                  </label>
                  <input
                    type="number"
                    value={question.metadata?.minWords || 50}
                    onChange={(e) => updateQuestion(question.id, {
                      metadata: { ...question.metadata, minWords: parseInt(e.target.value) }
                    })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Words
                  </label>
                  <input
                    type="number"
                    value={question.metadata?.maxWords || 200}
                    onChange={(e) => updateQuestion(question.id, {
                      metadata: { ...question.metadata, maxWords: parseInt(e.target.value) }
                    })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {question.type === 'code' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programming Language
                  </label>
                  <select
                    value={question.metadata?.language || 'javascript'}
                    onChange={(e) => updateQuestion(question.id, {
                      metadata: { ...question.metadata, language: e.target.value }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="html">HTML/CSS</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starter Code (Optional)
                  </label>
                  <textarea
                    value={question.metadata?.starterCode || ''}
                    onChange={(e) => updateQuestion(question.id, {
                      metadata: { ...question.metadata, starterCode: e.target.value }
                    })}
                    placeholder="// Starter code for the candidate..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No questions added yet.</p>
          <p className="text-sm">Click one of the buttons above to add your first question.</p>
        </div>
      )}

      {questions.length >= maxQuestions && (
        <div className="text-center py-4 text-orange-600 bg-orange-50 rounded-lg">
          <p>Maximum of {maxQuestions} questions reached.</p>
        </div>
      )}
    </div>
  );
}
