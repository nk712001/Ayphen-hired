export type QuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'code' | 'file_upload';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  correctAnswer?: string;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  maxLength?: number;
  correctAnswer?: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  minWords?: number;
  maxWords?: number;
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  language: string;
  boilerplate?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface FileUploadQuestion extends BaseQuestion {
  type: 'file_upload';
  allowedTypes: string[];
  maxSize: number; // in bytes
}

export type Question =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | CodeQuestion
  | FileUploadQuestion;
