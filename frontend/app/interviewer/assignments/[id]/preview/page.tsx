'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  type: string;
  text: string;
  difficulty?: string;
  metadata?: any;
  order: number;
}

interface Assignment {
  id: string;
  status: string;
  uniqueLink: string;
  test: {
    id: string;
    title: string;
    duration: number;
    jobDescription?: string;
    requiresSecondaryCamera: boolean;
    mcqQuestions: number;
    conversationalQuestions: number;
    codingQuestions: number;
    resumeUrl?: string;
  };
  candidate: {
    id: string;
    name: string;
    email: string;
    resumeUrl?: string;
  };
}

interface ResumeAnalysisObject {
  skills?: string[] | string;
  experience?: string;
  education?: string;
  achievements?: string[];
  seniority?: string;
  domains?: string[] | string;
}

interface PreviewData {
  assignment: Assignment;
  questions: Question[];
  generatedFromResume: boolean;
  resumeAnalysis?: string | ResumeAnalysisObject;
}

export default function AssignmentPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoGenerateQuestions = async (assignment: Assignment) => {
    setIsGenerating(true);
    try {
      console.log('Auto-generating questions for assignment:', assignment.id);
      console.log('Assignment details:', {
        testId: assignment.test.id,
        candidateId: assignment.candidate.id,
        hasResume: !!assignment.candidate.resumeUrl,
        hasJobDescription: !!assignment.test.jobDescription
      });

      const response = await fetch(`/api/assignments/${params.id}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: params.id,
          personalized: true
        })
      });

      console.log('Generate questions response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Generated questions data:', data);
        setPreviewData(prev => prev ? {
          ...prev,
          questions: data.questions,
          generatedFromResume: true,
          resumeAnalysis: data.resumeAnalysis
        } : null);
        console.log(`✅ Auto-generated ${data.questions.length} personalized questions`);
      } else {
        const errorData = await response.json();
        console.error('❌ Auto-generation failed:', errorData);
        // Don't set error state for auto-generation failures, just log them
      }
    } catch (error) {
      console.error('❌ Error auto-generating questions:', error);
      // Don't set error state for auto-generation failures
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchPreviewData = async () => {
      try {
        console.log('Fetching preview data for assignment:', params.id);
        const response = await fetch(`/api/assignments/${params.id}/preview`);
        console.log('Preview API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Preview data received:', data);
          setPreviewData(data);

          // Auto-generate questions if none exist
          if (!data.generatedFromResume && data.questions.length === 0) {
            console.log('No personalized questions found, auto-generating...');
            await autoGenerateQuestions(data.assignment);
          } else {
            console.log(`Found ${data.questions.length} existing questions`);
          }
        } else {
          const errorData = await response.json();
          console.error('Preview API error:', errorData);
          setError(errorData.error || 'Failed to load assignment preview');
        }
      } catch (error) {
        console.error('Error fetching assignment preview:', error);
        setError('Failed to load assignment preview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [params.id]);

  const generatePersonalizedQuestions = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/assignments/${params.id}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: params.id,
          personalized: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(prev => prev ? {
          ...prev,
          questions: data.questions,
          generatedFromResume: true,
          resumeAnalysis: data.resumeAnalysis
        } : null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate personalized questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setError('Failed to generate personalized questions');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignment preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-secondary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Assignment Not Found</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-secondary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { assignment, questions, generatedFromResume, resumeAnalysis } = previewData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{assignment.test.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Personalized Preview for {assignment.candidate.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
              >
                Back
              </button>
              {!generatedFromResume && (
                <button
                  onClick={generatePersonalizedQuestions}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground inline-block mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Personalized Questions'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Candidate Info */}
          <div className="bg-card border border-border shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">Candidate Information</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd className="mt-1 text-sm text-foreground">{assignment.candidate.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-sm text-foreground">{assignment.candidate.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Resume</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {assignment.candidate.resumeUrl ? (
                      <a
                        href={assignment.candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        View Resume
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No resume uploaded</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Test Configuration */}
          <div className="bg-card border border-border shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">📋 Test Configuration</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Test Title</dt>
                  <dd className="mt-1 text-sm text-foreground font-medium">{assignment.test.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      ⏱️ {assignment.test.duration} minutes
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Secondary Camera</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.test.requiresSecondaryCamera
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                      {assignment.test.requiresSecondaryCamera ? '📱 Required' : '❌ Not required'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="text-sm font-medium text-muted-foreground mb-3">Question Configuration</dt>
                  <dd className="mt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{assignment.test.mcqQuestions || 0}</div>
                        <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Multiple Choice</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{assignment.test.conversationalQuestions || 0}</div>
                        <div className="text-xs text-green-700 dark:text-green-300 font-medium">Conversational</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{assignment.test.codingQuestions || 0}</div>
                        <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">Coding</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(assignment.test.mcqQuestions || 0) + (assignment.test.conversationalQuestions || 0) + (assignment.test.codingQuestions || 0)}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Questions</div>
                      </div>
                    </div>
                  </dd>
                </div>
                {assignment.test.jobDescription && (
                  <div className="sm:col-span-3">
                    <dt className="text-sm font-medium text-muted-foreground">Job Description</dt>
                    <dd className="mt-1 text-sm text-foreground bg-muted/50 rounded-lg p-4 whitespace-pre-wrap border border-border">
                      {assignment.test.jobDescription}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Resume Analysis */}
          {resumeAnalysis && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-4">🤖 AI Resume Analysis</h2>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {typeof resumeAnalysis === 'string' ? (
                    <p className="whitespace-pre-wrap">{resumeAnalysis}</p>
                  ) : (
                    <div className="space-y-2">
                      {(resumeAnalysis as ResumeAnalysisObject).skills && (
                        <div>
                          <strong>Skills:</strong> {Array.isArray((resumeAnalysis as ResumeAnalysisObject).skills)
                            ? ((resumeAnalysis as ResumeAnalysisObject).skills as string[]).join(', ')
                            : (resumeAnalysis as ResumeAnalysisObject).skills}
                        </div>
                      )}
                      {(resumeAnalysis as ResumeAnalysisObject).experience && (
                        <div>
                          <strong>Experience:</strong> {(resumeAnalysis as ResumeAnalysisObject).experience}
                        </div>
                      )}
                      {(resumeAnalysis as ResumeAnalysisObject).education && (
                        <div>
                          <strong>Education:</strong> {(resumeAnalysis as ResumeAnalysisObject).education}
                        </div>
                      )}
                      {(resumeAnalysis as ResumeAnalysisObject).seniority && (
                        <div>
                          <strong>Seniority Level:</strong> {(resumeAnalysis as ResumeAnalysisObject).seniority}
                        </div>
                      )}
                      {(resumeAnalysis as ResumeAnalysisObject).domains && (
                        <div>
                          <strong>Domains:</strong> {Array.isArray((resumeAnalysis as ResumeAnalysisObject).domains)
                            ? ((resumeAnalysis as ResumeAnalysisObject).domains as string[]).join(', ')
                            : (resumeAnalysis as ResumeAnalysisObject).domains}
                        </div>
                      )}
                      {(resumeAnalysis as ResumeAnalysisObject).achievements &&
                        Array.isArray((resumeAnalysis as ResumeAnalysisObject).achievements) &&
                        (resumeAnalysis as ResumeAnalysisObject).achievements!.length > 0 && (
                          <div>
                            <strong>Key Achievements:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {(resumeAnalysis as ResumeAnalysisObject).achievements!.map((achievement: string, index: number) => (
                                <li key={index}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Questions Preview */}
          <div className="bg-card border border-border shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-foreground">
                  {generatedFromResume ? '🎯 Personalized Questions' : 'Sample Questions'} ({questions.length})
                </h2>
                <div className="flex space-x-2">
                  {generatedFromResume && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm rounded-full">
                      ✨ Personalized
                    </span>
                  )}
                  {!process.env.OPENAI_API_KEY && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm rounded-full">
                      🧠 Intelligent Analysis
                    </span>
                  )}
                </div>
              </div>

              {!assignment.candidate.resumeUrl && !assignment.test.resumeUrl && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ No resume uploaded for this candidate. Questions will be based on the job description only.
                  </p>
                </div>
              )}

              {(assignment.candidate.resumeUrl || assignment.test.resumeUrl) && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    ✅ Resume available - Questions will be personalized based on candidate&apos;s background and job requirements.
                  </p>
                </div>
              )}

              {generatedFromResume && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    🧠 <strong>Intelligent Question Generation:</strong> These questions have been personalized using advanced pattern matching and skill analysis.
                    {(assignment.candidate.resumeUrl || assignment.test.resumeUrl) ? ' Based on candidate resume and job requirements.' : ' Based on job description analysis.'}
                  </p>
                </div>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-8">
                  {isGenerating ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground mb-2">🧠 Generating Personalized Questions...</p>
                      <p className="text-sm text-muted-foreground">
                        Analyzing {assignment.candidate.resumeUrl ? 'candidate resume and' : ''} job description to create tailored questions
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">No questions generated yet.</p>
                      <button
                        onClick={generatePersonalizedQuestions}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-secondary-dark disabled:opacity-50"
                      >
                        Generate Personalized Questions
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border-l-4 border-primary pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-medium text-foreground">
                          Question {index + 1}
                        </h3>
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 text-xs bg-muted text-foreground rounded">
                            {question.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {question.difficulty && (
                            <span className={`px-2 py-1 text-xs rounded ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{question.text}</p>

                      {/* Show options for multiple choice questions */}
                      {question.type === 'multiple_choice' && question.metadata?.options && (
                        <div className="mt-2 ml-4">
                          <p className="text-xs text-muted-foreground mb-1">Options:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {question.metadata.options.map((option: string, i: number) => (
                              <li key={i} className="flex items-center">
                                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center mr-2">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                {option}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Show starter code for coding questions */}
                      {question.type === 'code' && question.metadata?.starterCode && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Starter Code:</p>
                          <pre className="bg-muted p-2 rounded text-xs text-muted-foreground overflow-x-auto">
                            {question.metadata.starterCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
