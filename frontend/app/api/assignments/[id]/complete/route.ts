import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAnswerScore, calculateCheatScore, generateRecommendation } from '@/lib/scoring-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check for unique link token in headers (Magic Link Auth)
    const token = request.headers.get('x-test-token');

    if (!session?.user?.id && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;
    console.log(`🔍 Completing assignment: ${assignmentId} for user: ${session?.user?.id || 'Token Auth'}`);

    // 1. First check if assignment exists at all
    const assignmentExists = await prisma.testAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        candidate: { select: { id: true, email: true } }
      }
    });

    if (!assignmentExists) {
      console.error(`❌ Assignment not found: ${assignmentId}`);
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // 2. Auth Check: Session vs Token
    if (token) {
      // If token provided, it MUST match the assignment's uniqueLink
      if (assignmentExists.uniqueLink !== token) {
        console.error(`Invalid token attempt for assignment ${assignmentId} completion`);
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }
    } else if (session?.user?.id) {
      // Session auth check
      const isOwner = assignmentExists.candidateId === session.user.id;
      const isEmailMatch = session.user.email && assignmentExists.candidate.email &&
        session.user.email.toLowerCase() === assignmentExists.candidate.email.toLowerCase();

      if (!isOwner && !isEmailMatch) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 3. Proceed with full data fetch for scoring
    const assignment = await prisma.testAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        test: {
          include: {
            questions: true
          }
        },
        answers: {
          include: {
            question: true
          }
        },
        proctorSessions: {
          include: {
            violations: true
          }
        }
      }
    });

    if (!assignment) {
      // Should not happen as we checked above, but safe guard
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // 1. Calculate Answer Scores
    let totalScore = 0;
    let maxTotalScore = 0;
    const answerScores = [];

    for (const answer of assignment.answers) {
      if (!answer.question) continue;

      const { score, maxScore, feedback } = await calculateAnswerScore(answer, answer.question);

      // Update answer with score
      await prisma.answer.update({
        where: { id: answer.id },
        data: { score, maxScore, feedback }
      });

      totalScore += score;
      maxTotalScore += maxScore;
      answerScores.push({ questionId: answer.questionId, score, maxScore });
    }

    // 2. Calculate Cheat Score
    const allViolations = assignment.proctorSessions.flatMap((s: any) => s.violations);
    const cheatScore = calculateCheatScore(allViolations, assignment.test.requiresSecondaryCamera);

    // 3. Generate Recommendation
    const recommendation = generateRecommendation(totalScore, maxTotalScore, cheatScore);

    // 4. Mark assignment as completed with scores
    await prisma.testAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        totalScore,
        maxTotalScore,
        cheatScore,
        recommendation,
        scoreBreakdown: JSON.stringify(answerScores)
      }
    });

    return NextResponse.json({
      success: true,
      scores: {
        totalScore,
        maxTotalScore,
        cheatScore,
        recommendation
      }
    });

  } catch (error) {
    console.error('Error completing assignment:', error);
    return NextResponse.json({ error: 'Failed to complete assignment' }, { status: 500 });
  }
}