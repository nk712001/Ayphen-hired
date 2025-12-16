import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth - Multi-tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT callback', () => {
    it('should include organization data in JWT token', async () => {
      const user = {
        id: 'user1',
        role: 'interviewer',
        phone: '123456789',
        organizationId: 'org1',
        organizationName: 'Test Org'
      };

      const token = {};
      const result = await authOptions.callbacks?.jwt?.({ token, user } as any);

      expect(result).toEqual({
        id: 'user1',
        role: 'interviewer',
        phone: '123456789',
        organizationId: 'org1',
        organizationName: 'Test Org'
      });
    });
  });

  describe('Session callback', () => {
    it('should include organization data in session', async () => {
      const session = {
        user: {}
      };

      const token = {
        id: 'user1',
        role: 'interviewer',
        phone: '123456789',
        organizationId: 'org1',
        organizationName: 'Test Org'
      };

      const result = await authOptions.callbacks?.session?.({ session, token } as any);

      expect(result.user).toEqual({
        id: 'user1',
        role: 'interviewer',
        phone: '123456789',
        organizationId: 'org1',
        organizationName: 'Test Org'
      });
    });
  });

  describe('Credentials authorize', () => {
    it('should fetch user with organization data', async () => {
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'interviewer',
        password: 'hashedpassword',
        organizationId: 'org1',
        organizationName: 'Test Org'
      };

      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([mockUser]);

      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const credentials = {
        email: 'john@test.com',
        password: 'password123'
      };

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize(credentials);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT u.*, o.name as organizationName FROM User u LEFT JOIN Organization o ON u.organizationId = o.id WHERE u.email = ?',
        'john@test.com'
      );

      expect(result).toEqual({
        id: 'user1',
        name: 'John Doe',
        email: 'john@test.com',
        image: undefined,
        role: 'interviewer',
        phone: null,
        organizationId: 'org1',
        organizationName: 'Test Org'
      });
    });

    it('should handle users without organization', async () => {
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'interviewer',
        password: 'hashedpassword',
        organizationId: null,
        organizationName: null
      };

      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([mockUser]);

      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const credentials = {
        email: 'john@test.com',
        password: 'password123'
      };

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize(credentials);

      expect(result.organizationId).toBeNull();
      expect(result.organizationName).toBeNull();
    });
  });
});