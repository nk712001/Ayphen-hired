import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { testAssignmentId, requiresSecondaryCamera } = await request.json();

    if (!testAssignmentId) {
      return NextResponse.json({ error: 'Missing testAssignmentId' }, { status: 400 });
    }

    // Create proctor session
    const proctorSession = await prisma.proctorSession.create({
      data: {
        testAssignmentId,
        startedAt: new Date(),
        primaryCameraActive: true,
        secondaryCameraActive: false,
        secondaryCameraRequired: requiresSecondaryCamera || false,
        microphoneActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      proctorSessionId: proctorSession.id 
    });

  } catch (error) {
    console.error('Error creating proctor session:', error);
    return NextResponse.json({ error: 'Failed to create proctor session' }, { status: 500 });
  }
}