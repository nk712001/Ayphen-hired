'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Eye, FileText, CheckCircle, XCircle, ArrowLeft, BarChart3, MessageSquare, Code, HelpCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  text: string;
  difficulty?: string;
  order: number;
}

interface Test {
  id: string;
  title: string;
  jobDescription?: string;
  duration: number;
  requiresSecondaryCamera: boolean;
  questions?: Question[];
  mcqQuestions?: number;
  conversationalQuestions?: number;
  codingQuestions?: number;
}

export default function TestPreviewPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestAndQuestions = async () => {
      try {
        // Fetch test details
        const testResponse = await fetch(`/api/tests/${params.testId}`);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          setTest(testData.test);
        }

        // Fetch questions
        const questionsResponse = await fetch(`/api/questions?testId=${params.testId}`);
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData.questions || []);
        }
      } catch (error) {
        console.error('Error fetching test data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestAndQuestions();
  }, [params.testId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-gray-700 font-medium">Loading test preview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Not Found</h1>
          <p className="text-gray-600 mb-6">The test you&apos;re looking for could not be found.</p>
          <button
            onClick={() => router.push('/interviewer/tests')}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-gray-800 transition-colors mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Tests</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {test.title}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Test Preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Duration Card */}
          <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                <p className="text-xl font-semibold text-foreground">{test.duration} min</p>
              </div>
            </div>
          </div>

          {/* Proctoring Card */}
          <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-muted rounded-lg">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Proctoring</h3>
                <p className="text-sm font-medium text-foreground">
                  {test.requiresSecondaryCamera ? (
                    <span className="flex items-center text-foreground">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Secondary Camera
                    </span>
                  ) : (
                    <span className="flex items-center text-muted-foreground">
                      <XCircle className="h-4 w-4 mr-1" />
                      Standard
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Questions Count Card */}
          <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-muted rounded-lg">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Questions</h3>
                <p className="text-xl font-semibold text-foreground">{questions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Configuration Card */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-muted rounded-lg">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Question Distribution</h3>
              <p className="text-sm text-muted-foreground">AI-generated question breakdown</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-1">Multiple Choice</div>
              <div className="text-2xl font-bold text-foreground">{test.mcqQuestions || 0}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-1">Conversational</div>
              <div className="text-2xl font-bold text-foreground">{test.conversationalQuestions || 0}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-1">Coding</div>
              <div className="text-2xl font-bold text-foreground">{test.codingQuestions || 0}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-1">Total</div>
              <div className="text-2xl font-bold text-foreground">
                {(test.mcqQuestions || 0) + (test.conversationalQuestions || 0) + (test.codingQuestions || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Job Description Card */}
        {test.jobDescription && (
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Job Description</h3>
                <p className="text-sm text-muted-foreground">Role requirements and context</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap">{test.jobDescription}</p>
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-muted rounded-lg">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Questions ({questions.length})
                </h2>
                <p className="text-sm text-muted-foreground">Preview of test questions</p>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-muted/30 rounded-lg p-8 border border-border">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No Questions Yet</h3>
                  <p className="text-sm text-muted-foreground">No questions have been added to this test yet.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const getQuestionIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case 'mcq':
                      case 'multiple_choice':
                        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
                      case 'conversational':
                      case 'essay':
                        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
                      case 'coding':
                      case 'code':
                        return <Code className="h-4 w-4 text-muted-foreground" />;
                      default:
                        return <FileText className="h-4 w-4 text-muted-foreground" />;
                    }
                  };

                  const getTypeColor = (type: string) => {
                    return 'bg-muted text-muted-foreground border-border';
                  };

                  const getDifficultyColor = (difficulty: string) => {
                    switch (difficulty?.toLowerCase()) {
                      case 'easy':
                        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
                      case 'medium':
                        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
                      case 'hard':
                        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
                      default:
                        return 'bg-muted text-muted-foreground border-border';
                    }
                  };

                  return (
                    <div key={question.id} className="bg-card/50 rounded-lg p-5 border border-border hover:border-primary/20 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <span className="text-primary-foreground font-semibold text-sm">{index + 1}</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                              {getQuestionIcon(question.type)}
                              <span>Question {index + 1}</span>
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded border ${getTypeColor(question.type)}`}>
                            {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                          </span>
                          {question.difficulty && (
                            <span className={`px-2.5 py-1 text-xs font-medium rounded border ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <p className="text-foreground leading-relaxed text-sm">{question.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}