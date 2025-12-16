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
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
          <p className="text-gray-600">No test results found for this assignment.</p>
        </div>
      </div>
    );
  }

  const cheatRisk = violations ? getCheatRiskLevel(violations.cheatScore) : { level: 'Unknown', color: 'text-gray-600 bg-gray-50' };
  const scorePercentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="bg-white shadow rounded-lg border border-primary/20">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-primary mb-6">Test Results Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Summary */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(totalScore, maxTotalScore)}`}>
                {scorePercentage}%
              </div>
              <div className="text-sm text-gray-600">
                {totalScore}/{maxTotalScore} points
              </div>
              <div className="text-xs text-gray-500 mt-1">Overall Score</div>
            </div>

            {/* Cheat Risk */}
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cheatRisk.color}`}>
                <AlertTriangle className="w-4 h-4 mr-1" />
                {cheatRisk.level} Risk
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {violations ? `${violations.totalViolations} violations detected` : 'No violation data'}
              </div>
            </div>

            {/* Completion Status */}
            <div className="text-center">
              <div className="inline-flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-1" />
                Completed
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {results.completedAt ? new Date(results.completedAt).toLocaleString() : 'Recently'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Details */}
      {violations && violations.totalViolations > 0 && (
        <div className="bg-white shadow rounded-lg border border-primary/20">
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
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-600">{violations.cheatScore}%</div>
                <div className="text-sm text-gray-700">Cheat Score</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question-by-Question Results */}
      <div className="bg-white shadow rounded-lg border border-primary/20">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-primary mb-6">Question Analysis</h3>

          {/* Question Completion Summary */}
          {results.test && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Completion Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">MCQ Questions:</span>
                  <span className="ml-2 font-medium">
                    {results.answers?.filter((a: any) => a.questionId.startsWith('mcq_')).length || 0} / {results.test.mcqQuestions || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Conversational:</span>
                  <span className="ml-2 font-medium">
                    {results.answers?.filter((a: any) => a.questionId.startsWith('conv_')).length || 0} / {results.test.conversationalQuestions || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Coding:</span>
                  <span className="ml-2 font-medium">
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
                const answer = results.answers?.find((a: any) => a.questionId === question.id);
                const answerScore = answerScores.find(s => s.questionId === question.id);

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
                        <h4 className="font-medium text-gray-900 flex items-center flex-wrap gap-2">
                          Question {index + 1}: {question.type || 'Unknown'}
                          {!answer && <span className="text-red-500 text-sm">(Not Answered)</span>}
                          {statusBadge}
                        </h4>
                        <p className="text-gray-700 mt-1">
                          {question.text || 'Question text not available'}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        {answerScore ? (
                          <>
                            <div className={`text-lg font-bold ${getScoreColor(answerScore.score, answerScore.maxScore)}`}>
                              {answerScore.score}/{answerScore.maxScore}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((answerScore.score / answerScore.maxScore) * 100)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-gray-400">
                            -/-
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <h5 className="font-medium text-sm text-gray-600 mb-2">Candidate Answer:</h5>
                      <div className="text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {answer?.status === 'SKIPPED' ? <span className="text-gray-400 italic">Question was skipped by candidate</span> :
                          answer?.status === 'IRRELEVANT' ? <span className="text-gray-400 italic">Marked as irrelevant by candidate</span> :
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
                          <h6 className="font-medium text-sm text-gray-600 mb-1">Code Submission:</h6>
                          <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
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