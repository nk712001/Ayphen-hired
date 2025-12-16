import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all proctoring sessions with related data
        const proctoringSessions = await prisma.proctorSession.findMany({
            include: {
                testAssignment: {
                    include: {
                        candidate: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        test: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                violations: {
                    orderBy: {
                        timestamp: 'desc',
                    },
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
            take: 100, // Limit to recent 100 sessions
        });

        // Calculate statistics
        const stats = {
            totalSessions: proctoringSessions.length,
            activeSessions: proctoringSessions.filter((s: any) => !s.endedAt).length,
            totalViolations: proctoringSessions.reduce((sum: number, s: any) => sum + s.violations.length, 0),
            criticalViolations: proctoringSessions.reduce(
                (sum: number, s: any) => sum + s.violations.filter((v: any) => v.severity === 'CRITICAL').length,
                0
            ),
            majorViolations: proctoringSessions.reduce(
                (sum: number, s: any) => sum + s.violations.filter((v: any) => v.severity === 'MAJOR').length,
                0
            ),
            minorViolations: proctoringSessions.reduce(
                (sum: number, s: any) => sum + s.violations.filter((v: any) => v.severity === 'MINOR').length,
                0
            ),
        };

        return NextResponse.json({
            sessions: proctoringSessions,
            stats,
        });
    } catch (error) {
        console.error('Error fetching proctoring data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proctoring data' },
            { status: 500 }
        );
    }
}
