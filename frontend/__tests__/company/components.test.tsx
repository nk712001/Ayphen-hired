import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import CompanyDashboard from '@/components/company/CompanyDashboard';
import UserManagement from '@/components/company/UserManagement';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock API functions
jest.mock('@/lib/company/api', () => ({
  getCompanyAnalytics: jest.fn(),
  getCompanyUsers: jest.fn(),
  inviteUser: jest.fn(),
}));

import { getCompanyAnalytics, getCompanyUsers } from '@/lib/company/api';
const mockGetCompanyAnalytics = getCompanyAnalytics as jest.MockedFunction<typeof getCompanyAnalytics>;
const mockGetCompanyUsers = getCompanyUsers as jest.MockedFunction<typeof getCompanyUsers>;

describe('Company Components', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', companyId: 'company-1' } },
      status: 'authenticated',
    } as any);
  });

  describe('CompanyDashboard', () => {
    it('should render analytics data', async () => {
      const mockAnalytics = {
        totalUsers: 10,
        activeTests: 5,
        completedTests: 20,
        averageScore: 85,
        monthlyUsage: [
          { month: 'Jan', tests: 12, users: 8 },
          { month: 'Feb', tests: 18, users: 12 },
        ],
      };

      mockGetCompanyAnalytics.mockResolvedValue(mockAnalytics);

      render(<CompanyDashboard companyId="company-1" />);

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // Total Users
        expect(screen.getByText('5')).toBeInTheDocument(); // Active Tests
        expect(screen.getByText('20')).toBeInTheDocument(); // Completed Tests
        expect(screen.getByText('85%')).toBeInTheDocument(); // Average Score
      });
    });

    it('should show loading state initially', () => {
      mockGetCompanyAnalytics.mockImplementation(() => new Promise(() => {}));
      
      render(<CompanyDashboard companyId="company-1" />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('UserManagement', () => {
    it('should render user list', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@test.com', role: 'user', createdAt: new Date() },
        { id: 'user-2', name: 'Jane Smith', email: 'jane@test.com', role: 'admin', createdAt: new Date() },
      ];

      mockGetCompanyUsers.mockResolvedValue(mockUsers);

      render(<UserManagement companyId="company-1" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@test.com')).toBeInTheDocument();
      });
    });

    it('should show invite user button', async () => {
      mockGetCompanyUsers.mockResolvedValue([]);

      render(<UserManagement companyId="company-1" />);

      await waitFor(() => {
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });
    });
  });
});