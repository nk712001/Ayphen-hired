import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;

    // Get assignment and verify ownership
    const assignment = await prisma.testAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        test: {
          select: {
            createdBy: true,
            requiresSecondaryCamera: true
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
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Only allow access if user is the interviewer who created the test
    if (assignment.test.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate violation summary
    const allViolations = assignment.proctorSessions.flatMap((session: any) => session.violations);

    const violationSummary = {
      totalViolations: allViolations.length,
      primaryCameraViolations: allViolations.filter((v: any) => v.cameraSource === 'primary').length,
      secondaryCameraViolations: allViolations.filter((v: any) => v.cameraSource === 'secondary').length,
      highSeverity: allViolations.filter((v: any) => v.severity === 'CRITICAL' || v.severity === 'MAJOR').length,
      mediumSeverity: allViolations.filter((v: any) => v.severity === 'MINOR').length,
      lowSeverity: allViolations.filter((v: any) => !['CRITICAL', 'MAJOR', 'MINOR'].includes(v.severity)).length,
      cheatScore: calculateCheatScore(allViolations, assignment.test.requiresSecondaryCamera),
      secondaryCameraRequired: assignment.test.requiresSecondaryCamera,
      violations: allViolations.map((v: any) => ({
        type: v.type,
        severity: v.severity,
        description: v.description,
        timestamp: v.timestamp,
        cameraSource: v.cameraSource
      }))
    };

    return NextResponse.json(violationSummary);

  } catch (error) {
    console.error('Error fetching violations:', error);
    return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 });
  }
}

function calculateCheatScore(violations: any[], isSecondaryRequired: boolean = false): number {
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
      // Secondary camera violations get 1.5x weight for workspace monitoring
      violationScore *= 1.5;
      secondaryViolations++;
    } else if (violation.cameraSource === 'primary') {
      primaryViolations++;
    }

    score += violationScore;
  });

  // Bonus penalty if both cameras detected violations and secondary is required
  if (isSecondaryRequired && primaryViolations > 0 && secondaryViolations > 0) {
    score += 10; // 10 point penalty for dual-camera violations
  }

  // Cap at 100%
  return Math.min(100, score);
}