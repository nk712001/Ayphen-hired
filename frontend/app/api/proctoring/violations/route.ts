import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { testId, violation } = await request.json();

    if (!testId || !violation) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Find the test assignment and proctor session
    const assignment = await prisma.testAssignment.findFirst({
      where: { 
        test: { id: testId },
        status: 'in_progress'
      },
      include: {
        proctorSessions: {
          where: { endedAt: null },
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!assignment || assignment.proctorSessions.length === 0) {
      return NextResponse.json({ error: 'No active proctor session found' }, { status: 404 });
    }

    const proctorSession = assignment.proctorSessions[0];

    // Map violation types and severities
    const severityMap: Record<string, string> = {
      'high': 'CRITICAL',
      'medium': 'MAJOR', 
      'low': 'MINOR'
    };

    const typeMap: Record<string, string> = {
      'face_not_visible': 'face_violation',
      'multiple_faces': 'face_violation',
      'looking_away': 'gaze_violation',
      'tab_switch': 'audio_violation',
      'screen_share_stopped': 'object_violation'
    };

    // Save violation to database with camera source
    const savedViolation = await prisma.violation.create({
      data: {
        proctorSessionId: proctorSession.id,
        type: typeMap[violation.type] || violation.type,
        severity: severityMap[violation.severity] || 'MINOR',
        description: violation.description,
        timestamp: new Date(violation.timestamp),
        cameraSource: violation.cameraSource || 'primary'
      }
    });

    return NextResponse.json({ success: true, violationId: savedViolation.id });

  } catch (error) {
    console.error('Error saving violation:', error);
    return NextResponse.json({ error: 'Failed to save violation' }, { status: 500 });
  }
}