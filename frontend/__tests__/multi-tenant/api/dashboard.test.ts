import { GET } from '@/app/api/dashboard/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    testAssignment: {
      findMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/dashboard - Multi-tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter assignments by organization for interviewer', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { 
        id: 'interviewer1', 
        role: 'interviewer',
        organizationId: 'org1'
      }
    } as any);

    const mockAssignments = [
      {
        id: 'assign1',
        status: 'pending',
        createdAt: new Date(),
        test: { id: 'test1', title: 'Test 1' },
        candidate: { id: 'cand1', name: 'John Doe', email: 'john@test.com' }
      }
    ];

    (mockPrisma.testAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.testAssignment.findMany).toHaveBeenCalledWith({
      where: {
        test: {
          createdBy: 'interviewer1',
          organizationId: 'org1'
        }
      },
      include: expect.any(Object),
      orderBy: expect.any(Object)
    });
  });

  it('should not filter by organization for users without organizationId', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { 
        id: 'interviewer1', 
        role: 'interviewer'
      }
    } as any);

    (mockPrisma.testAssignment.findMany as jest.Mock).mockResolvedValue([]);

    await GET();

    expect(mockPrisma.testAssignment.findMany).toHaveBeenCalledWith({
      where: {
        test: {
          createdBy: 'interviewer1'
        }
      },
      include: expect.any(Object),
      orderBy: expect.any(Object)
    });
  });

  it('should return 401 for non-interviewer', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', role: 'user' }
    } as any);

    const response = await GET();
    expect(response.status).toBe(401);
  });
});