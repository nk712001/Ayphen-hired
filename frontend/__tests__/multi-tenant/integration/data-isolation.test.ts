import { GET as getDashboard } from '@/app/api/dashboard/route';
import { GET as getTests } from '@/app/api/tests/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    testAssignment: { findMany: jest.fn() },
    test: { findMany: jest.fn() },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Data Isolation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cross-organization data access prevention', () => {
    it('should prevent users from accessing other organization data in dashboard', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { 
          id: 'user1', 
          role: 'interviewer',
          organizationId: 'orgA'
        }
      } as any);

      const mockAssignments = [
        {
          id: 'assign1',
          status: 'pending',
          createdAt: new Date(),
          test: { id: 'test1', title: 'Test 1', organizationId: 'orgA' },
          candidate: { id: 'cand1', name: 'John Doe' }
        }
      ];

      (mockPrisma.testAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments);

      await getDashboard();

      expect(mockPrisma.testAssignment.findMany).toHaveBeenCalledWith({
        where: {
          test: {
            createdBy: 'user1',
            organizationId: 'orgA'
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Object)
      });
    });

    it('should prevent users from accessing other organization tests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { 
          id: 'user2', 
          role: 'interviewer',
          organizationId: 'orgB'
        }
      } as any);

      const mockTests = [
        { id: 'test2', title: 'Test 2', organizationId: 'orgB' }
      ];

      (mockPrisma.test.findMany as jest.Mock).mockResolvedValue(mockTests);

      const request = new Request('http://localhost');
      await getTests(request);

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: 'user2',
          organizationId: 'orgB'
        },
        include: expect.any(Object),
        orderBy: expect.any(Object)
      });
    });

    it('should allow users without organization to access their own data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { 
          id: 'user3', 
          role: 'interviewer'
        }
      } as any);

      (mockPrisma.test.findMany as jest.Mock).mockResolvedValue([]);

      const request = new Request('http://localhost');
      await getTests(request);

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: 'user3'
        },
        include: expect.any(Object),
        orderBy: expect.any(Object)
      });
    });
  });
});