export interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeUrl?: string | null;
}

export interface TestAssignment {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: Date | null;
  completedAt?: Date | null;
  candidate: Candidate;
}

export interface Test {
  id: string;
  title: string;
  jobDescription?: string | null;
  duration: number;
  requiresSecondaryCamera: boolean;
  createdAt: Date;
  assignments: TestAssignment[];
}
