import { getCompany, updateCompany, getCompanyUsers, inviteUser, getCompanyAnalytics } from '@/lib/company/api';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Company API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getCompany', () => {
    it('should fetch company data successfully', async () => {
      const mockCompany = {
        id: 'company-1',
        name: 'Test Company',
        subscriptionTier: 'basic',
        maxUsers: 50,
        maxTests: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompany,
      } as Response);

      const result = await getCompany('company-1');
      expect(result).toEqual(mockCompany);
      expect(mockFetch).toHaveBeenCalledWith('/api/company/company-1');
    });

    it('should return null for failed requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await getCompany('company-1');
      expect(result).toBeNull();
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const updateData = { name: 'Updated Company' };
      const mockResponse = { id: 'company-1', ...updateData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await updateCompany('company-1', updateData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/company/company-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
    });
  });

  describe('getCompanyUsers', () => {
    it('should fetch company users successfully', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@test.com', role: 'user' },
        { id: 'user-2', name: 'Jane Smith', email: 'jane@test.com', role: 'admin' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      } as Response);

      const result = await getCompanyUsers('company-1');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('inviteUser', () => {
    it('should invite user successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(inviteUser('company-1', 'test@example.com', 'user')).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledWith('/api/company/company-1/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', role: 'user' }),
      });
    });
  });

  describe('getCompanyAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockAnalytics = {
        totalUsers: 10,
        activeTests: 5,
        completedTests: 20,
        averageScore: 85,
        monthlyUsage: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      } as Response);

      const result = await getCompanyAnalytics('company-1');
      expect(result).toEqual(mockAnalytics);
    });
  });
});