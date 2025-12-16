export interface Test {
  id: string;
  title: string;
  jobDescription?: string;
  resumeUrl?: string;
  duration: number;
  requiresSecondaryCamera: boolean;
  mcqQuestions: number;
  conversationalQuestions: number;
  codingQuestions: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  organizationId?: string | null;
  assignments: TestAssignment[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeUrl?: string;
  resumeData?: string; // JSON string
  skills?: string;
  experienceYears?: number;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  assignments: TestAssignment[];
}

export interface TestAssignment {
  id: string;
  testId: string;
  candidateId: string;
  uniqueLink: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  test: Test;
  candidate: Candidate;
}
