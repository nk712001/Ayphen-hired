'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';

interface TestResultsProps {
  assignmentId: string;
}

interface ViolationSummary {
  totalViolations: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  cheatScore: number;
}

interface AnswerScore {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export default function TestResults({ assignmentId }: TestResultsProps) {
  const [results, setResults] = useState<any>(null);
  const [violations, setViolations] = useState<ViolationSummary | null>(null);
  const [answerScores, setAnswerScores] = useState<AnswerScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore, setMaxTotalScore] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [resultsResponse, violationsResponse] = await Promise.all([
          fetch(`/api/assignments/${assignmentId}/results`),
          fetch(`/api/assignments/${assignmentId}/violations`)
        ]);

        if (resultsResponse.ok) {
          const data = await resultsResponse.json();
          setResults(data);

          // Use stored scores if available, otherwise calculate (fallback)
          if (data.totalScore !== null && data.totalScore !== undefined) {
            setTotalScore(data.totalScore);
            setMaxTotalScore(data.maxTotalScore || 0);
            // Use stored answer scores if available
            if (data.scoreBreakdown) {
              try {
                setAnswerScores(JSON.parse(data.scoreBreakdown));
              } catch (e) {
                console.error('Error parsing score breakdown', e);
              }
            } else if (data.answers) {
              // Backward compatibility or if breakdown missing, map from answers
              const scores = data.answers.map((a: any) => ({
                questionId: a.questionId,
                score: a.score || 0,
                maxScore: a.maxScore || 10,
                feedback: a.feedback || ''
              }));
              setAnswerScores(scores);
            }
          } else if (data.answers) {
            // Legacy calculation
            const scores = await calculateAnswerScores(data.answers);
            setAnswerScores(scores);
            const total = scores.reduce((sum, score) => sum + score.score, 0);
            const maxTotal = scores.reduce((sum, score) => sum + score.maxScore, 0);
            setTotalScore(total);
            setMaxTotalScore(maxTotal);
          }
        }

        if (violationsResponse.ok) {
          const violationData = await violationsResponse.json();
          setViolations(violationData);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [assignmentId]);

  const calculateAnswerScores = async (answers: any[]): Promise<AnswerScore[]> => {
    const scores: AnswerScore[] = [];

    for (const answer of answers) {
      let score = 0;
      let maxScore = 10;
      let feedback = '';

      if (answer.question?.type === 'multiple_choice') {
        const userAnswer = answer.content;
        if (userAnswer && userAnswer.trim().length > 0) {
          score = 8;
          feedback = `Answer provided: "${userAnswer}"`;
        } else {
          score = 0;
          feedback = 'No answer provided';
        }
      } else if (answer.question?.type === 'conversational') {
        const content = answer.content || '';
        const wordCount = content.trim().split(/\s+/).length;
        if (wordCount >= 30) {
          score = Math.min(10, Math.floor(wordCount / 5));
          feedback = `Good response length (${wordCount} words)`;
        } else if (wordCount >= 10) {
          score = Math.floor(wordCount / 3);
          feedback = `Adequate response (${wordCount} words)`;
        } else {
          score = Math.floor(wordCount / 2);
          feedback = `Response too short (${wordCount} words)`;
        }
      } else if (answer.question?.type === 'code') {
        const code = answer.content || '';
        if (code.includes('function') || code.includes('def') || code.includes('class')) {
          score = 8;
          feedback = 'Code structure present';
        } else if (code.length > 20) {
          score = 5;
          feedback = 'Some code provided';
        } else {
          score = 2;
          feedback = 'Minimal code provided';
        }
      }
      scores.push({ questionId: answer.question.id, score, maxScore, feedback });
    }
    return scores;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCheatRiskLevel = (cheatScore: number) => {
    if (cheatScore >= 70) return { level: 'High', color: 'text-red-600 bg-red-50' };
    if (cheatScore >= 40) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50' };
    return { level: 'Low', color: 'text-green-600 bg-green-50' };
  };

  if (isLoading) {
    return (
      <div className="bg-card shadow rounded-lg border border-border">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Test Results</h2>
          <p className="text-muted-foreground">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-card shadow rounded-lg border border-border">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Test Results</h2>
          <p className="text-muted-foreground">No test results found for this assignment.</p>
        </div>
      </div>
    );
  }

  const cheatRisk = violations ? getCheatRiskLevel(violations.cheatScore) : { level: 'Unknown', color: 'text-muted-foreground bg-muted' };
  const scorePercentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="bg-card shadow rounded-lg border border-primary/20">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-primary mb-6">Test Results Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Summary */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(totalScore, maxTotalScore)}`}>
                {scorePercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {totalScore}/{maxTotalScore} points
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">Overall Score</div>
            </div>

            {/* Cheat Risk */}
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cheatRisk.color}`}>
                <AlertTriangle className="w-4 h-4 mr-1" />
                {cheatRisk.level} Risk
              </div>
              <div className="text-xs text-muted-foreground/70 mt-2">
                {violations ? `${violations.totalViolations} violations detected` : 'No violation data'}
              </div>
            </div>

            {/* Completion Status */}
            <div className="text-center">
              <div className="inline-flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-1" />
                Completed
              </div>
              <div className="text-xs text-muted-foreground/70 mt-2">
                {results.completedAt ? new Date(results.completedAt).toLocaleString() : 'Recently'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Details */}
      {violations && violations.totalViolations > 0 && (
        <div className="bg-card shadow rounded-lg border border-primary/20">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-primary mb-4">Proctoring Violations</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{violations.highSeverity}</div>
                <div className="text-sm text-red-700">High Severity</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">{violations.mediumSeverity}</div>
                <div className="text-sm text-yellow-700">Medium Severity</div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded">
                <div className="text-2xl font-bold text-primary">{violations.lowSeverity}</div>
                <div className="text-sm text-primary/70">Low Severity</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-2xl font-bold text-foreground">{violations.cheatScore}%</div>
                <div className="text-sm text-muted-foreground">Cheat Score</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question-by-Question Results */}
      <div className="bg-card shadow rounded-lg border border-primary/20">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-primary mb-6">Question Analysis</h3>

          {/* Question Completion Summary */}
          {results.test && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="font-medium text-foreground mb-2">Completion Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">MCQ Questions:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {results.answers?.filter((a: any) => a.questionId.startsWith('mcq_')).length || 0} / {results.test.mcqQuestions || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversational:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {results.answers?.filter((a: any) => a.questionId.startsWith('conv_')).length || 0} / {results.test.conversationalQuestions || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Coding:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {results.answers?.filter((a: any) => a.questionId.startsWith('code_')).length || 0} / {results.test.codingQuestions || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {(() => {
              // Use test questions if available, otherwise generate expected questions based on test config
              let questionsToDisplay = [];

              if (results.test?.questions?.length > 0) {
                questionsToDisplay = results.test.questions;
              } else {
                // Generate expected questions based on test configuration (mock ids)
                const expectedQuestions = [];
                let order = 1;
                for (let i = 1; i <= (results.test?.mcqQuestions || 0); i++) {
                  expectedQuestions.push({ id: `mcq_${i}`, type: 'multiple_choice', text: `MCQ Question ${i}`, order: order++ });
                }
                for (let i = 1; i <= (results.test?.conversationalQuestions || 0); i++) {
                  expectedQuestions.push({ id: `conv_${i}`, type: 'essay', text: `Conversational Question ${i}`, order: order++ });
                }
                for (let i = 1; i <= (results.test?.codingQuestions || 0); i++) {
                  expectedQuestions.push({ id: `code_${i}`, type: 'code', text: `Coding Question ${i}`, order: order++ });
                }

                questionsToDisplay = expectedQuestions.map(expectedQ => {
                  const actualAnswer = results.answers?.find((a: any) => a.questionId === expectedQ.id);
                  return actualAnswer?.question || expectedQ;
                });
              }

              if (questionsToDisplay.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions found for this assignment.</p>
                  </div>
                );
              }

              return questionsToDisplay.map((question: any, index: number) => {
                // IMPROVED MATCHING LOGIC:
                // 1. Try exact ID match first
                let answer = results.answers?.find((a: any) => a.questionId === question.id);

                // 2. If no exact ID match, try matching by the nested question object's ID
                if (!answer) {
                  answer = results.answers?.find((a: any) => a.question?.id === question.id);
                }

                // 3. If still no match and we have order, match by order
                // BUT ONLY if the order hasn't already been claimed by another question with exact ID match
                if (!answer && question.order !== undefined && question.order !== null) {
                  // Get all answers that have already been matched by ID
                  const matchedAnswerIds = new Set();
                  questionsToDisplay.forEach((q: any) => {
                    const matched = results.answers?.find((a: any) =>
                      a.questionId === q.id || a.question?.id === q.id
                    );
                    if (matched) matchedAnswerIds.add(matched.questionId);
                  });

                  // Find answer by order that hasn't been claimed yet
                  answer = results.answers?.find((a: any) => {
                    const matchesOrder = a.question?.order === question.order;
                    const notClaimed = !matchedAnswerIds.has(a.questionId);
                    return matchesOrder && notClaimed;
                  });
                }

                // Try to find score by ID first, then fallback to finding via the matched answer
                let answerScore = answerScores.find(s => s.questionId === question.id);

                if (!answerScore && answer) {
                  // If we found an answer (possibly via order), try to find its score using the answer's recorded questionId
                  answerScore = answerScores.find(s => s.questionId === answer.questionId);
                }

                // Determine status badge
                let statusBadge = null;
                if (answer) {
                  if (answer.status === 'SKIPPED') {
                    statusBadge = <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">Skipped</span>;
                  } else if (answer.status === 'IRRELEVANT') {
                    statusBadge = <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-200">Irrelevant</span>;
                  }
                }

                return (
                  <div key={question.id} className="border-l-4 border-primary/30 pl-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground flex items-center flex-wrap gap-2">
                          Question {index + 1}: {question.type || 'Unknown'}
                          {!answer && <span className="text-red-500 dark:text-red-400 text-sm">(Not Answered)</span>}
                          {statusBadge}
                        </h4>
                        <p className="text-muted-foreground mt-1">
                          {question.text || 'Question text not available'}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        {answerScore ? (
                          <>
                            <div className={`text-lg font-bold ${getScoreColor(answerScore.score, answerScore.maxScore)}`}>
                              {answerScore.score}/{answerScore.maxScore}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((answerScore.score / answerScore.maxScore) * 100)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-muted-foreground/50">
                            -/-
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg mb-3 border border-border">
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">Candidate Answer:</h5>
                      <div className="text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {answer?.status === 'SKIPPED' ? <span className="text-muted-foreground/70 italic">Question was skipped by candidate</span> :
                          answer?.status === 'IRRELEVANT' ? <span className="text-muted-foreground/70 italic">Marked as irrelevant by candidate</span> :
                            answer?.content && answer.content.trim().length > 0 ? answer.content : 'No answer provided'}
                      </div>
                      {answer?.recordingUrl && (
                        <div className="mt-2">
                          <audio controls className="w-full">
                            <source src={answer.recordingUrl} type="audio/webm" />
                          </audio>
                        </div>
                      )}
                      {answer?.codeSubmission && (
                        <div className="mt-2">
                          <h6 className="font-medium text-sm text-muted-foreground mb-1">Code Submission:</h6>
                          <pre className="bg-card border border-border text-foreground p-3 rounded text-sm overflow-x-auto">
                            <code>{answer.codeSubmission}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    {answerScore && answerScore.feedback && (
                      <div className="bg-primary/10 p-3 rounded text-sm">
                        <strong className="text-primary">Feedback:</strong> {answerScore.feedback}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}