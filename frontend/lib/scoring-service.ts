import { Answer, Question, Violation } from '@prisma/client';

/**
 * Calculates the score for a single answer based on rule-based logic.
 * Scalable to AI-based scoring in the future.
 */
import { aiClient } from '@/lib/ai-client';

/**
 * Calculates the score for a single answer.
 * Uses AI if available for Essay/Conversational questions, otherwise falls back to rules.
 */
export async function calculateAnswerScore(answer: Partial<Answer>, question: Partial<Question>): Promise<{ score: number; maxScore: number; feedback: string }> {
    let score = 0;
    const maxScore = 10;
    let feedback = '';

    if (!answer.content && answer.status !== 'SKIPPED' && answer.status !== 'IRRELEVANT') {
        return { score: 0, maxScore, feedback: 'No answer provided' };
    }

    if (answer.status === 'SKIPPED') {
        return { score: 0, maxScore, feedback: 'Question skipped by candidate' };
    }

    if (answer.status === 'IRRELEVANT') {
        return { score: 0, maxScore, feedback: 'Marked as irrelevant by candidate' };
    }

    switch (question.type) {
        case 'multiple_choice':
            // ... (Existing MCQ Logic unchanged)
            let isCorrect = false;
            try {
                if (question.metadata) {
                    const metadata = JSON.parse(question.metadata);
                    const correct = metadata.correctAnswer;
                    if (correct !== undefined) {
                        if (String(answer.content) === String(correct)) {
                            isCorrect = true;
                        } else if (metadata.options && metadata.options[correct] === answer.content) {
                            isCorrect = true;
                        }
                    } else { isCorrect = false; }
                }
            } catch (e) { console.error('Error parsing question metadata', e); }

            if (isCorrect) {
                score = 10;
                feedback = 'Correct Answer';
            } else {
                if (answer.content && answer.content.length > 0) {
                    score = 0;
                    feedback = 'Incorrect Answer';
                    if (!question.metadata) { score = 5; feedback = 'Answer recorded (Automatic grading unavailable)'; }
                }
            }
            break;

        case 'conversational':
        case 'short_answer':
        case 'essay':
            const text = answer.content || '';
            const wordCount = text.trim().split(/\s+/).length;

            // Try AI Grading
            try {
                const grading = await evaluateAnswerRelevance(question.text || '', text);
                score = grading.score;
                feedback = grading.feedback;
            } catch (e) {
                // Fallback to Rule Based
                console.warn('AI Grading failed, using rule-based fallback');
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
            }
            break;

        case 'code':
            // ... (Existing Code Logic - can be upgraded to AI later if needed)
            const code = answer.content || '';
            if (code.includes('function') || code.includes('def') || code.includes('class') || code.includes('=>')) {
                score = 8;
                feedback = 'Code structure present';
            } else if (code.length > 20) {
                score = 5;
                feedback = 'Some code provided';
            } else {
                score = 2;
                feedback = 'Minimal code provided';
            }
            break;

        default:
            score = 0;
            feedback = 'Unknown question type';
    }

    return { score: Math.min(score, maxScore), maxScore, feedback };
}

async function evaluateAnswerRelevance(questionText: string, answerText: string): Promise<{ score: number, feedback: string }> {
    const prompt = `You are an expert technical interviewer. Grade this answer on a scale of 0-10 based on relevance, correctness, and depth.
    
Question: "${questionText}"
Candidate Answer: "${answerText}"

Return JSON: { "score": number (0-10), "feedback": "Short constructive feedback" }`;

    return await aiClient.json({
        provider: 'gemini', // Perfect use case for Gemini Free
        messages: [{ role: 'user', content: prompt }],
        fallback: () => { throw new Error('AI Grading Failed'); } // Will define fallback in caller
    });
}

/**
 * Calculates the cheat score based on violations.
 */
export function calculateCheatScore(violations: Violation[], isSecondaryRequired: boolean = false): number {
    if (violations.length === 0) return 0;

    let score = 0;
    let primaryViolations = 0;
    let secondaryViolations = 0;

    violations.forEach(violation => {
        let violationScore = 0;

        switch (violation.severity) {
            case 'CRITICAL':
                violationScore = 25;
                break;
            case 'MAJOR':
                violationScore = 15;
                break;
            case 'MINOR':
                violationScore = 5;
                break;
            default:
                violationScore = 2;
        }

        // Apply secondary camera weighting only if secondary camera is required
        if (violation.cameraSource === 'secondary' && isSecondaryRequired) {
            violationScore *= 1.5;
            secondaryViolations++;
        } else if (violation.cameraSource === 'primary') {
            primaryViolations++;
        }

        score += violationScore;
    });

    if (isSecondaryRequired && primaryViolations > 0 && secondaryViolations > 0) {
        score += 10;
    }

    return Math.min(100, score);
}

export function generateRecommendation(totalScore: number, maxTotalScore: number, cheatScore: number): string {
    const scorePercent = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    if (cheatScore >= 70) return "Review Required (High Cheat Risk)";
    if (cheatScore >= 40) return "Review Required (Medium Cheat Risk)";

    if (scorePercent >= 80) return "Strongly Recommended";
    if (scorePercent >= 60) return "Recommended";
    if (scorePercent >= 40) return "Consider";

    return "Not Recommended";
}
