/**
 * @jest-environment node
 */
import { DELETE, PUT } from '@/app/api/tests/[testId]/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper to mock Request
function createRequest(method: string, body?: any) {
    return {
        method,
        json: async () => body || {},
    } as unknown as Request;
}

describe('Test API Isolation', () => {
    const mockSession = {
        user: {
            id: 'user1',
            role: 'INTERVIEWER',
            companyId: 'companyA'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    });

    describe('PUT /api/tests/[testId]', () => {
        it('should update test if belongs to same company', async () => {
            // Mock finding the test (ownership verification)
            (prisma.test.findFirst as jest.Mock).mockResolvedValue({
                id: 'test1',
                companyId: 'companyA',
                createdBy: 'user1'
            });

            // Mock the update
            (prisma.test.update as jest.Mock).mockResolvedValue({
                id: 'test1',
                title: 'Updated Title'
            });

            const req = createRequest('PUT', { title: 'Updated Title' });
            const res = await PUT(req, { params: { testId: 'test1' } });
            const data = await (res as any).json(); // Mocked NextResponse usually returns object directly or we mock json()

            // Verify findFirst was called with companyId check
            expect(prisma.test.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: 'test1',
                    companyId: 'companyA'
                }
            }));

            // Verify update was called
            expect(prisma.test.update).toHaveBeenCalled();
            expect(data.test.title).toBe('Updated Title');
        });

        it('should return 404 if test belongs to different company', async () => {
            // Mock findFirst returning null (not found in user's company context)
            (prisma.test.findFirst as jest.Mock).mockResolvedValue(null);

            const req = createRequest('PUT', { title: 'Hacked Title' });
            const res = await PUT(req, { params: { testId: 'test1' } });

            // Check status code (NextResponse structure depends on environment, simplified check)
            if ('status' in res) {
                expect(res.status).toBe(404);
            } else {
                // If NextResponse mocks differently, check body error
                const data = await (res as any).json();
                expect(data.error).toBeDefined();
            }

            // Verify update was NOT called
            expect(prisma.test.update).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /api/tests/[testId]', () => {
        it('should delete test if belongs to same company and user', async () => {
            (prisma.test.findFirst as jest.Mock).mockResolvedValue({
                id: 'test1',
                companyId: 'companyA',
                createdBy: 'user1' // Same user
            });

            (prisma.test.delete as jest.Mock).mockResolvedValue({ id: 'test1' });

            const req = createRequest('DELETE');
            const res = await DELETE(req, { params: { testId: 'test1' } });
            const data = await (res as any).json();

            expect(prisma.test.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: 'test1',
                    companyId: 'companyA'
                }
            }));

            expect(prisma.test.delete).toHaveBeenCalled();
            expect(data.success).toBe(true);
        });

        it('should prevent deletion if test belongs to different company', async () => {
            (prisma.test.findFirst as jest.Mock).mockResolvedValue(null);

            const req = createRequest('DELETE');
            const res = await DELETE(req, { params: { testId: 'test1' } });

            if ('status' in res) {
                expect(res.status).toBe(404);
            }

            expect(prisma.test.delete).not.toHaveBeenCalled();
        });

        it('should prevent deletion if test belongs to same company but different user', async () => {
            (prisma.test.findFirst as jest.Mock).mockResolvedValue({
                id: 'test1',
                companyId: 'companyA',
                createdBy: 'user2' // Different user
            });

            const req = createRequest('DELETE');
            const res = await DELETE(req, { params: { testId: 'test1' } });

            if ('status' in res) {
                expect(res.status).toBe(403);
            }

            expect(prisma.test.delete).not.toHaveBeenCalled();
        });
    });
});
