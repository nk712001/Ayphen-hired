import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationsPage from '@/app/admin/organizations/page';

// Mock fetch
global.fetch = jest.fn();

describe('OrganizationsPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render organizations list', async () => {
    const mockOrganizations = [
      {
        id: 'org1',
        name: 'Test Organization',
        subscriptionStatus: 'active',
        userCount: 5,
        testCount: 10,
        createdAt: '2023-01-01T00:00:00.000Z'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: mockOrganizations })
    });

    render(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('should show create form when New Organization button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [] })
    });

    render(<OrganizationsPage />);

    const newOrgButton = screen.getByText('New Organization');
    fireEvent.click(newOrgButton);

    expect(screen.getByPlaceholderText('Organization name')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should create new organization', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ organizations: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ organization: { id: 'org1', name: 'New Org' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ organizations: [{ id: 'org1', name: 'New Org' }] })
      });

    render(<OrganizationsPage />);

    // Open create form
    const newOrgButton = screen.getByText('New Organization');
    fireEvent.click(newOrgButton);

    // Fill form
    const nameInput = screen.getByPlaceholderText('Organization name');
    fireEvent.change(nameInput, { target: { value: 'New Org' } });

    // Submit form
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Org' })
      });
    });
  });

  it('should cancel create form', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [] })
    });

    render(<OrganizationsPage />);

    // Open create form
    const newOrgButton = screen.getByText('New Organization');
    fireEvent.click(newOrgButton);

    // Cancel form
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByPlaceholderText('Organization name')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<OrganizationsPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<OrganizationsPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching organizations:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});