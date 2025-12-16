'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question, QuestionType } from '@/types/question';

const questionTypeOptions = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'essay', label: 'Essay' },
  { value: 'code', label: 'Coding' },
];

const difficultyOptions = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
];

// Base schema that all question types share
const baseQuestionSchema = {
  text: z.string().min(5, 'Question text is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  points: z.number().min(1).default(1),
};

// Individual question type schemas
const multipleChoiceSchema = z.object({
  type: z.literal('multiple_choice'),
  ...baseQuestionSchema,
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'At least 2 options required'),
  correctAnswer: z.number().min(0, 'Please select a correct answer'),
});

const shortAnswerSchema = z.object({
  type: z.literal('short_answer'),
  ...baseQuestionSchema,
  expectedAnswer: z.string().min(1, 'Expected answer is required'),
  acceptAlternateAnswers: z.boolean().optional(),
  alternateAnswers: z.array(z.string().min(1, 'Alternate answer cannot be empty')).default([]),
});

const essaySchema = z.object({
  type: z.literal('essay'),
  ...baseQuestionSchema,
  minWords: z.number().min(1, 'Minimum words is required'),
  maxWords: z.number().min(1, 'Maximum words is required'),
  evaluationCriteria: z.array(z.string().min(1, 'Criterion cannot be empty')),
});

const codeSchema = z.object({
  type: z.literal('code'),
  ...baseQuestionSchema,
  language: z.string().min(1, 'Language is required'),
  starterCode: z.string().min(1, 'Starter code is required'),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false),
  })).min(1, 'At least one test case is required'),
  timeLimit: z.number().min(1).default(30),
  memoryLimit: z.number().min(128).default(512),
});

// Combined schema using discriminated union
const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  shortAnswerSchema,
  essaySchema,
  codeSchema,
]);

// Type inference for form data
type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  initialData?: Partial<Question>;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function QuestionForm({ initialData, onSubmit, onCancel, isSubmitting = false }: QuestionFormProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors: rawErrors },
    reset,
    setValue,
    getValues
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema as any),
    defaultValues: {
      type: 'multiple_choice',
      text: '',
      difficulty: 'Medium',
      points: 1,
      ...initialData,
      metadata: undefined, // Don't spread metadata directly
      ...(initialData?.metadata || {}),
    } as any,
  });

  const errors = rawErrors as any;

  // Watch the question type to conditionally render fields

  // Helper function to safely update array fields
  const updateArrayField = <T extends unknown[]>(fieldName: string, updater: (prev: T) => T) => {
    const current = getValues(fieldName as any) as T || [];
    const updated = updater(current);
    setValue(fieldName as any, updated as any, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: QuestionFormData) => {
    await onSubmit(data);
  };

  // Watch the question type to conditionally render fields
  const questionType = watch('type');

  const renderQuestionTypeFields = () => {
    switch (questionType) {
      case 'multiple_choice':
        const options = watch('options') as string[] || [];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Options</label>
              <div className="space-y-2">
                {options.map((_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      {...register('correctAnswer')}
                      value={index}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <Input
                      {...register(`options.${index}` as const)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const options = [...(watch('options') || [])];
                        options.splice(index, 1);
                        reset({ ...watch(), options } as any);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateArrayField<string[]>('options', (prev) => [...prev, '']);
                  }}
                >
                  Add Option
                </Button>
                {errors.options && (
                  <p className="text-sm text-red-500">{errors.options.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'short_answer':
        const alternateAnswers = watch('alternateAnswers') as string[] || [];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Answer</label>
              <Input
                {...register('expectedAnswer')}
                placeholder="Enter the expected answer"
              />
              {errors.expectedAnswer && (
                <p className="text-sm text-red-500">{errors.expectedAnswer.message}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="acceptAlternateAnswers"
                {...register('acceptAlternateAnswers')}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <label htmlFor="acceptAlternateAnswers" className="text-sm">
                Accept alternate answers
              </label>
            </div>
            {watch('acceptAlternateAnswers') && (
              <div>
                <label className="block text-sm font-medium mb-1">Alternate Answers</label>
                <div className="space-y-2">
                  {watch('alternateAnswers')?.map((_, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        {...register(`alternateAnswers.${index}` as const)}
                        placeholder={`Alternate answer ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const alternateAnswers = [...(watch('alternateAnswers') || [])];
                          alternateAnswers.splice(index, 1);
                          reset({ ...watch(), alternateAnswers } as any);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const alternateAnswers = [...(watch('alternateAnswers') || []), ''];
                      reset({ ...watch(), alternateAnswers } as any);
                    }}
                  >
                    Add Alternate Answer
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'essay':
        const evaluationCriteria = watch('evaluationCriteria') as string[] || [];
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Words</label>
                <Input
                  type="number"
                  {...register('minWords', { valueAsNumber: true })}
                  min={1}
                />
                {errors.minWords && (
                  <p className="text-sm text-red-500">{errors.minWords.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maximum Words</label>
                <Input
                  type="number"
                  {...register('maxWords', { valueAsNumber: true })}
                  min={1}
                />
                {errors.maxWords && (
                  <p className="text-sm text-red-500">{errors.maxWords.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Evaluation Criteria</label>
              <div className="space-y-2">
                {evaluationCriteria.map((_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      {...register(`evaluationCriteria.${index}` as const)}
                      placeholder={`Criterion ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const evaluationCriteria = [...(watch('evaluationCriteria') || [])];
                        evaluationCriteria.splice(index, 1);
                        reset({ ...watch(), evaluationCriteria } as any);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const evaluationCriteria = [...(watch('evaluationCriteria') || []), ''];
                    reset({ ...watch(), evaluationCriteria } as any);
                  }}
                >
                  Add Criterion
                </Button>
              </div>
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language && (
                <p className="text-sm text-red-500">{errors.language.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Starter Code</label>
              <Textarea
                {...register('starterCode')}
                rows={5}
                className="font-mono text-sm"
                placeholder="Enter starter code (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Test Cases</label>
              <div className="space-y-4">
                {watch('testCases')?.map((_, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Input</label>
                        <Input
                          {...register(`testCases.${index}.input` as const)}
                          placeholder="Input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Expected Output</label>
                        <Input
                          {...register(`testCases.${index}.expectedOutput` as const)}
                          placeholder="Expected output"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`testCase-${index}-hidden`}
                          {...register(`testCases.${index}.isHidden` as const)}
                          className="h-4 w-4 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`testCase-${index}-hidden`} className="text-sm">
                          Hidden test case
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const testCases = [...(watch('testCases') || [])];
                          testCases.splice(index, 1);
                          reset({ ...watch(), testCases } as any);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const testCases = [...(watch('testCases') || []), { input: '', expectedOutput: '', isHidden: false }];
                    reset({ ...watch(), testCases } as any);
                  }}
                >
                  Add Test Case
                </Button>
                {errors.testCases && (
                  <p className="text-sm text-red-500">{errors.testCases.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Time Limit (seconds)</label>
                <Input
                  type="number"
                  {...register('timeLimit', { valueAsNumber: true })}
                  min={1}
                />
                {errors.timeLimit && (
                  <p className="text-sm text-red-500">{errors.timeLimit.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Memory Limit (MB)</label>
                <Input
                  type="number"
                  {...register('memoryLimit', { valueAsNumber: true })}
                  min={128}
                />
                {errors.memoryLimit && (
                  <p className="text-sm text-red-500">{errors.memoryLimit.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? 'Edit Question' : 'Create New Question'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex space-x-2 mb-4">
            <Button
              type="button"
              variant={activeTab === 'edit' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('edit')}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant={activeTab === 'preview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </Button>
          </div>

          {activeTab === 'edit' ? (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Question Type</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Question Text</label>
                <Textarea
                  {...register('text')}
                  rows={3}
                  placeholder="Enter your question here"
                />
                {errors.text && (
                  <p className="text-sm text-red-500">{errors.text.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficultyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.difficulty && (
                    <p className="text-sm text-red-500">{errors.difficulty.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Points</label>
                  <Input
                    type="number"
                    {...register('points', { valueAsNumber: true })}
                    min={1}
                  />
                  {errors.points && (
                    <p className="text-sm text-red-500">{errors.points.message}</p>
                  )}
                </div>
              </div>

              {renderQuestionTypeFields()}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Question'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-muted/20">
                <h3 className="font-medium mb-2">Preview</h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{watch('text') || 'Question text will appear here'}</p>

                  {questionType === 'multiple_choice' && (
                    <div className="mt-4 space-y-2">
                      {watch('options')?.map((option, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <input
                            type="radio"
                            name="preview-option"
                            className="mt-1"
                            disabled
                          />
                          <span>{option || `Option ${index + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionType === 'short_answer' && (
                    <div className="mt-4">
                      <Input
                        placeholder="Type your answer here"
                        disabled
                        className="max-w-md"
                      />
                    </div>
                  )}

                  {questionType === 'essay' && (
                    <div className="mt-4">
                      <Textarea
                        placeholder="Write your essay here..."
                        rows={6}
                        disabled
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum {watch('minWords') || 50} words, maximum {watch('maxWords') || 1000} words
                      </p>
                    </div>
                  )}

                  {questionType === 'code' && (
                    <div className="mt-4">
                      <div className="bg-[#1e1e1e] text-white p-4 rounded-md font-mono text-sm overflow-x-auto">
                        <pre>{watch('starterCode') || '// Your code here'}</pre>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Language: {watch('language') || 'javascript'}</p>
                        <p>Time limit: {watch('timeLimit') || 30} seconds</p>
                        <p>Memory limit: {watch('memoryLimit') || 512} MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab('edit')}>
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
