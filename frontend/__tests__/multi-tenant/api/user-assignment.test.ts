import { POST } from '@/app/api/admin/users/assign-organization/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/admin/users/assign-organization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should assign user to organization', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'admin1', role: 'admin' }
    } as any);

    const mockUser = {
      id: 'user1',
      organizationId: 'org1',
      organization: { id: 'org1', name: 'Test Org' }
    };

    (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user1',
        organizationId: 'org1'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.organizationId).toBe('org1');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user1' },
      data: { organizationId: 'org1' },
      include: { organization: true }
    });
  });

  it('should remove user from organization when organizationId is null', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'admin1', role: 'admin' }
    } as any);

    const mockUser = { id: 'user1', organizationId: null };
    (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user1',
        organizationId: null
      })
    });

    await POST(request);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user1' },
      data: { organizationId: null },
      include: { organization: true }
    });
  });

  it('should return 401 for non-admin user', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', role: 'interviewer' }
    } as any);

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1', organizationId: 'org1' })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for missing userId', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'admin1', role: 'admin' }
    } as any);

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org1' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});