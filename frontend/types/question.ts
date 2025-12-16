export type QuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'code';

export interface BaseQuestion {
  id?: string;
  testId?: string;
  type: QuestionType;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  order?: number;
  timeLimit?: number; // in seconds
  metadata?: Record<string, any>;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  expectedAnswer: string;
  acceptAlternateAnswers?: boolean;
  alternateAnswers?: string[];
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  minWords?: number;
  maxWords?: number;
  evaluationCriteria: string[];
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  language: string;
  starterCode?: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
  timeLimit: number; // in seconds
  memoryLimit?: number; // in MB
}

export type Question = 
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | CodeQuestion;
