import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { testAssignmentId, violation } = await request.json();

        if (!testAssignmentId || !violation) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[VIOLATION] Saving violation for assignment ${testAssignmentId}:`, violation);

        // Find or create proctor session for this assignment
        let proctorSession = await prisma.proctorSession.findFirst({
            where: {
                testAssignmentId,
                endedAt: null // Active session
            },
            orderBy: {
                startedAt: 'desc'
            }
        });

        // If no active session exists, create one
        if (!proctorSession) {
            console.log(`[VIOLATION] No active proctor session found, creating one`);
            proctorSession = await prisma.proctorSession.create({
                data: {
                    testAssignmentId,
                    startedAt: new Date(),
                    primaryCameraActive: true,
                    secondaryCameraActive: false,
                    microphoneActive: true
                }
            });
        }

        // Save the violation
        const savedViolation = await prisma.violation.create({
            data: {
                proctorSessionId: proctorSession.id,
                type: violation.type,
                severity: violation.severity.toUpperCase(), // Ensure uppercase for consistency
                description: violation.message || `${violation.type} (confidence: ${violation.confidence})`,
                timestamp: new Date(),
                cameraSource: violation.details?.source || 'primary',
                status: 'PENDING_REVIEW'
            }
        });

        console.log(`[VIOLATION] Saved violation ${savedViolation.id} to session ${proctorSession.id}`);

        return NextResponse.json({
            success: true,
            violationId: savedViolation.id,
            proctorSessionId: proctorSession.id
        });

    } catch (error) {
        console.error('Error saving violation:', error);
        return NextResponse.json({ error: 'Failed to save violation' }, { status: 500 });
    }
}
