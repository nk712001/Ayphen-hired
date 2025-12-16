'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Flag, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import TestTimer from './TestTimer';
import TestNavigation from './TestNavigation';
import QuestionDisplay from './QuestionDisplay';
import { QuestionType } from '@/types/question';
import { useProctoring } from '@/lib/proctoring/proctoring-context';

interface TestSessionProps {
  test: {
    id: string;
    title: string;
    description?: string;
    duration: number;
    questions: Array<{
      id: string;
      type: QuestionType;
      text: string;
      metadata: any;
      difficulty?: string;
      order: number;
    }>;
  };
  initialAttemptId: string;
  initialTimeRemaining: number;
  initialAnswers?: Array<{ questionId: string; content: string | null }>;
  token?: string; // Add token prop for magic link auth
}

export default function TestSession({
  test,
  initialAttemptId,
  initialTimeRemaining,
  initialAnswers = [],
  token,
}: TestSessionProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Initialize answers from prop
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (initialAnswers) {
      initialAnswers.forEach(ans => {
        if (ans.content) {
          try {
            // Try parsing JSON (for arrays/objects), fallback to string
            initial[ans.questionId] = JSON.parse(ans.content);
          } catch {
            initial[ans.questionId] = ans.content;
          }
        }
      });
    }
    return initial;
  });
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Access proctoring context to stop cameras on submission
  const { stopProctoring } = useProctoring();

  useEffect(() => {
    console.log('TestSession mounted with ID:', initialAttemptId);
  }, [initialAttemptId]);

  const currentQuestion = test.questions[currentQuestionIndex];

  // Cleanup cameras when component unmounts (user navigates away)
  // Cleanup cameras when component unmounts (user navigates away)
  // Use a ref to hold the latest stopProctoring function to avoid re-triggering cleanup on dependency change
  const stopProctoringRef = useRef(stopProctoring);

  useEffect(() => {
    stopProctoringRef.current = stopProctoring;
  }, [stopProctoring]);

  useEffect(() => {
    return () => {
      console.log('🧹 TestSession component unmounting - cleaning up cameras');
      if (stopProctoringRef.current) {
        stopProctoringRef.current();
      }
    };
  }, []); // Empty dependency array ensures this ONLY runs on unmount
  const hasAnswered = !!answers[currentQuestion.id];
  const isFlagged = flaggedQuestions.has(currentQuestion.id);

  // Auto-save answers when they change
  useEffect(() => {
    const autoSave = async () => {
      // Only save if there's an answer for the current question
      const currentAnswer = answers[currentQuestion.id];
      if (currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '') {
        await saveAnswer(currentQuestion.id, currentAnswer);
      }
    };

    const timer = setTimeout(autoSave, 2000); // Debounce auto-save
    return () => clearTimeout(timer);
  }, [answers, currentQuestion.id]);

  // Handle time expiration
  useEffect(() => {
    if (timeRemaining <= 0 && !isTimeUp) {
      handleTimeUp();
    }
  }, [timeRemaining, isTimeUp]);

  const saveAnswer = async (questionId: string, answer: any, status: string = 'ANSWERED') => {
    try {
      if (answer === undefined || answer === null) {
        console.warn('Skipping save for null/undefined answer');
        return;
      }

      console.log(`💾 Saving answer for question ${questionId}:`, answer, status);

      let contentToSave = '';
      if (typeof answer === 'string') {
        contentToSave = answer;
      } else {
        contentToSave = JSON.stringify(answer);
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['x-test-token'] = token;
      }

      const response = await fetch(`/api/assignments/${initialAttemptId}/save-answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionId,
          content: contentToSave || '', // Ensure we never send undefined
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save answer');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save your answer. Please try again.');
    }
  };

  const handleAnswerChange = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (isFlagged) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlaggedQuestions(newFlagged);
  };

  const goToQuestion = async (index: number) => {
    // Save current answer before navigating
    const currentAnswer = answers[currentQuestion.id];
    if (currentAnswer !== undefined && currentAnswer !== null) {
      await saveAnswer(currentQuestion.id, currentAnswer);
    }

    setCurrentQuestionIndex(index);
  };

  const handleNext = async () => {
    // Save current answer before navigating
    const currentAnswer = answers[currentQuestion.id];
    if (currentAnswer !== undefined && currentAnswer !== null) {
      await saveAnswer(currentQuestion.id, currentAnswer);
    }

    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSkip = async () => {
    await saveAnswer(currentQuestion.id, '', 'SKIPPED');
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: '', // Clear or mark
    }));
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleIrrelevant = async () => {
    await saveAnswer(currentQuestion.id, '', 'IRRELEVANT');
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: '',
    }));
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = async () => {
    // Save current answer before navigating
    const currentAnswer = answers[currentQuestion.id];
    if (currentAnswer !== undefined && currentAnswer !== null) {
      await saveAnswer(currentQuestion.id, currentAnswer);
    }

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleTimeUp = async () => {
    console.log('⏰ Time is up - auto-submitting test');
    setIsTimeUp(true);
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save current answer before submitting
      const currentAnswer = answers[currentQuestion.id];
      if (currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '') {
        await saveAnswer(currentQuestion.id, currentAnswer);
      }

      // Save all remaining answers to ensure nothing is lost
      for (const [questionId, answer] of Object.entries(answers)) {
        if (answer !== undefined && answer !== null && answer !== '') {
          await saveAnswer(questionId, answer);
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['x-test-token'] = token;
      }

      // Mark assignment as completed
      console.log('🎯 Completing assignment:', initialAttemptId);
      const response = await fetch(`/api/assignments/${initialAttemptId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        // Stop proctoring and clean up cameras before navigating away
        console.log('🎯 Test submitted successfully - stopping proctoring and cleaning up cameras');
        console.log('🔍 stopProctoring function:', typeof stopProctoring, stopProctoring);

        try {
          stopProctoring();
          console.log('✅ stopProctoring() called successfully');
        } catch (error) {
          console.error('❌ Error calling stopProctoring():', error);
        }

        // Add a small delay to ensure cleanup completes
        setTimeout(() => {
          console.log('🔄 Navigating to thank you page after cleanup');
          router.push('/tests/thank-you');
        }, 500);
      } else {
        throw new Error('Failed to submit test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold mr-3">
              T
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">{test.title}</h1>
              <p className="text-xs text-gray-500">Candidate Session</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
              Proctoring Active
            </div>
            <TestTimer
              initialTimeRemaining={timeRemaining}
              onTimeUp={handleTimeUp}
              onTick={setTimeRemaining}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Main Question Area */}
          <div className="flex-1 min-w-0">
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    Question {currentQuestionIndex + 1}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">
                    {test.questions.length} Total
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {test.questions[currentQuestionIndex].difficulty && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                      {test.questions[currentQuestionIndex].difficulty}
                    </span>
                  )}
                  <button
                    onClick={toggleFlag}
                    className={`flex items-center text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${isFlagged
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <Flag className={`w-3 h-3 mr-1.5 ${isFlagged ? 'fill-current' : ''}`} />
                    {isFlagged ? 'Flagged' : 'Flag'}
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <QuestionDisplay
                  question={currentQuestion}
                  value={answers[currentQuestion.id]}
                  onChange={handleAnswerChange}
                />
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex space-x-3">
                  <button
                    onClick={handleSkip}
                    className="text-sm text-gray-500 hover:text-primary font-medium transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleIrrelevant}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Mark Irrelevant
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                  >
                    Previous
                  </Button>

                  <Button
                    onClick={isLastQuestion ? handleSubmit : handleNext}
                    disabled={isSubmitting || isTimeUp}
                    className={`min-w-[140px] ${isLastQuestion
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-md'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : isLastQuestion ? (
                      'Submit Test'
                    ) : (
                      'Next Question'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 text-sm">Question Navigator</h3>
                </div>
                <div className="p-4">
                  <TestNavigation
                    questions={test.questions}
                    currentIndex={currentQuestionIndex}
                    answers={answers}
                    flaggedQuestions={flaggedQuestions}
                    onQuestionSelect={goToQuestion}
                  />
                </div>
                <div className="bg-gray-50 p-3 text-xs text-center border-t border-gray-100 flex justify-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mr-1.5"></div>
                    <span className="text-gray-500">Current</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                    <span className="text-gray-500">Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></div>
                    <span className="text-gray-500">Flagged</span>
                  </div>
                </div>
              </div>

              {isTimeUp && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start text-red-700 shadow-sm animate-pulse">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-sm mb-1">Time Expired</div>
                    <div className="text-xs opacity-90">Submitting your answers...</div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Need help? Contact support via the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
