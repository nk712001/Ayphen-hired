import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/organizations/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/admin/organizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return organizations for admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      } as any);

      const mockOrgs = [
        {
          id: 'org1',
          name: 'Test Org',
          subscriptionStatus: 'active',
          createdAt: new Date(),
          _count: { users: 5, tests: 10 }
        }
      ];

      (mockPrisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organizations).toHaveLength(1);
      expect(data.organizations[0].name).toBe('Test Org');
    });

    it('should return 401 for non-admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', role: 'interviewer' }
      } as any);

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('should create organization for admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      } as any);

      const mockOrg = { id: 'org1', name: 'New Org' };
      (mockPrisma.organization.create as jest.Mock).mockResolvedValue(mockOrg);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Org' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organization.name).toBe('New Org');
      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: { name: 'New Org' }
      });
    });

    it('should return 400 for invalid name', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      } as any);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: '' })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});