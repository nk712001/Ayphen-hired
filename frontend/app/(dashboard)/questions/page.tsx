'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Question, QuestionType } from '@/types/question';
import QuestionForm from '@/components/questions/QuestionForm';
import { toast } from 'sonner';

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  short_answer: 'Short Answer',
  essay: 'Essay',
  code: 'Coding',
};

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (data: any) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create question');
      }

      toast.success('Question created successfully');
      setIsCreating(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
    }
  };

  const handleUpdateQuestion = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      toast.success('Question updated successfully');
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Question Bank</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Question</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionForm
              onSubmit={handleCreateQuestion}
              onCancel={() => setIsCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      {editingQuestion && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Edit Question</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionForm
              initialData={editingQuestion}
              onSubmit={(data) => handleUpdateQuestion(editingQuestion.id!, data)}
              onCancel={() => setEditingQuestion(null)}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No questions found. Create your first question to get started.</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{question.text}</h3>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {questionTypeLabels[question.type as QuestionType] || question.type}
                      </span>
                      <span className="capitalize">{question.difficulty?.toLowerCase()}</span>
                      <span>{question.points} points</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => question.id && handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                
                {question.type === 'multiple_choice' && question.metadata?.options && (
                  <div className="mt-4 space-y-2">
                    {question.metadata.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            question.metadata?.correctAnswer === index 
                              ? 'border-primary bg-primary' 
                              : 'border-gray-300'
                          }`}
                        >
                          {question.metadata?.correctAnswer === index && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === 'short_answer' && question.metadata?.expectedAnswer && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Expected Answer:</span>{' '}
                      {question.metadata.expectedAnswer}
                    </p>
                  </div>
                )}
                
                {question.type === 'code' && (
                  <div className="mt-4">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {question.metadata?.starterCode || '// No starter code provided'}
                      </pre>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Language: {question.metadata?.language || 'Not specified'}</p>
                      <p>Time Limit: {question.metadata?.timeLimit || 30} seconds</p>
                      <p>Test Cases: {question.metadata?.testCases?.length || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
