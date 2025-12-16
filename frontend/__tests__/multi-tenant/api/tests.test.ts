import { GET, POST } from '@/app/api/tests/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    test: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/tests - Multi-tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should filter tests by organization', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { 
          id: 'interviewer1', 
          role: 'interviewer',
          organizationId: 'org1'
        }
      } as any);

      const mockTests = [
        { id: 'test1', title: 'Test 1', organizationId: 'org1' }
      ];

      (mockPrisma.test.findMany as jest.Mock).mockResolvedValue(mockTests);

      const request = new NextRequest('http://localhost');
      const response = await GET(request);

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: 'interviewer1',
          organizationId: 'org1'
        },
        include: expect.any(Object),
        orderBy: expect.any(Object)
      });
    });
  });

  describe('POST', () => {
    it('should create test with organizationId', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { 
          id: 'interviewer1', 
          role: 'interviewer',
          organizationId: 'org1'
        }
      } as any);

      const mockTest = { id: 'test1', title: 'New Test' };
      (mockPrisma.test.create as jest.Mock).mockResolvedValue(mockTest);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Test',
          duration: 60,
          jobDescription: 'Test job'
        })
      });

      await POST(request);

      expect(mockPrisma.test.create).toHaveBeenCalledWith({
        data: {
          title: 'New Test',
          jobDescription: 'Test job',
          duration: 60,
          requiresSecondaryCamera: false,
          createdBy: 'interviewer1',
          organizationId: 'org1'
        }
      });
    });

    it('should create test without organizationId for users without organization', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { 
          id: 'interviewer1', 
          role: 'interviewer'
        }
      } as any);

      const mockTest = { id: 'test1', title: 'New Test' };
      (mockPrisma.test.create as jest.Mock).mockResolvedValue(mockTest);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Test',
          duration: 60
        })
      });

      await POST(request);

      expect(mockPrisma.test.create).toHaveBeenCalledWith({
        data: {
          title: 'New Test',
          jobDescription: undefined,
          duration: 60,
          requiresSecondaryCamera: false,
          createdBy: 'interviewer1'
        }
      });
    });
  });
});