/**
 * Tests for Users List Page
 * 
 * Tests cover:
 * - Rendering users table with correct columns
 * - Filter functionality (status, provider, XP range)
 * - Action buttons (deactivate, reactivate, delete)
 * - Confirmation modal behavior
 * - Pagination
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from '@/app/(admin)/(others-pages)/users/page';

// Mock the useUsers hook
const mockRefresh = jest.fn();
const mockUseUsers = jest.fn();

jest.mock('@/hooks/useApi', () => ({
  useUsers: (filters: unknown) => mockUseUsers(filters),
}));

// Mock the apiClient
const mockApiClient = {
  post: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  apiClient: mockApiClient,
}));

// Sample user data
const sampleUsers = {
  total: 3,
  limit: 20,
  offset: 0,
  users: [
    {
      id: 1,
      email: 'user1@test.com',
      display_name: 'User One',
      role: 'user',
      provider: 'google',
      is_active: true,
      total_xp: 1000,
    },
    {
      id: 2,
      email: 'user2@test.com',
      display_name: 'User Two',
      role: 'user',
      provider: 'apple',
      is_active: false,
      total_xp: 500,
    },
    {
      id: 3,
      email: 'admin@test.com',
      display_name: 'Admin User',
      role: 'admin',
      provider: 'device',
      is_active: true,
      total_xp: 5000,
    },
  ],
};

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUsers.mockReturnValue({
      users: sampleUsers,
      isLoading: false,
      isError: false,
      refresh: mockRefresh,
    });
  });

  describe('Table Rendering', () => {
    it('renders users table with correct columns', () => {
      render(<UsersPage />);

      // Check column headers
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('XP')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Should NOT have Telegram column
      expect(screen.queryByText('Telegram')).not.toBeInTheDocument();
    });

    it('renders user data correctly', () => {
      render(<UsersPage />);

      // Check user names
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();

      // Check XP values (formatted with toLocaleString)
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('shows provider badges', () => {
      render(<UsersPage />);

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Device')).toBeInTheDocument();
    });

    it('shows status badges correctly', () => {
      render(<UsersPage />);

      // Active users should show "Active" badge
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBe(2);

      // Inactive user should show "Inactive" badge
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('shows loading spinner when loading', () => {
      mockUseUsers.mockReturnValue({
        users: null,
        isLoading: true,
        isError: false,
        refresh: mockRefresh,
      });

      render(<UsersPage />);

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows error message on error', () => {
      mockUseUsers.mockReturnValue({
        users: null,
        isLoading: false,
        isError: true,
        refresh: mockRefresh,
      });

      render(<UsersPage />);

      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });

    it('shows empty state when no users', () => {
      mockUseUsers.mockReturnValue({
        users: { total: 0, users: [] },
        isLoading: false,
        isError: false,
        refresh: mockRefresh,
      });

      render(<UsersPage />);

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  describe('Filters', () => {
    it('filters are passed to useUsers hook', async () => {
      render(<UsersPage />);

      // Change status filter
      const statusSelect = screen.getByLabelText('Status');
      await userEvent.selectOptions(statusSelect, 'active');

      // Check that useUsers was called with the filter
      expect(mockUseUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
        })
      );
    });

    it('provider filter works', async () => {
      render(<UsersPage />);

      const providerSelect = screen.getByLabelText('Provider');
      await userEvent.selectOptions(providerSelect, 'google');

      expect(mockUseUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
    });

    it('search filter works', async () => {
      render(<UsersPage />);

      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await userEvent.type(searchInput, 'test@email.com');

      expect(mockUseUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test@email.com',
        })
      );
    });

    it('clear filters button resets all filters', async () => {
      render(<UsersPage />);

      // Show advanced filters
      const moreFiltersBtn = screen.getByText('More Filters');
      await userEvent.click(moreFiltersBtn);

      // Enter some filter values
      const minXpInput = screen.getByPlaceholderText('0');
      await userEvent.type(minXpInput, '100');

      // Click clear all
      const clearBtn = screen.getByText('Clear All Filters');
      await userEvent.click(clearBtn);

      // Check that filters are reset
      expect(mockUseUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: '',
          is_active: undefined,
          provider: undefined,
          min_xp: undefined,
          max_xp: undefined,
        })
      );
    });
  });

  describe('User Actions', () => {
    it('shows deactivate button for active users', () => {
      render(<UsersPage />);

      const deactivateButtons = screen.getAllByText('Deactivate');
      expect(deactivateButtons.length).toBe(2); // Two active users
    });

    it('shows reactivate button for inactive users', () => {
      render(<UsersPage />);

      expect(screen.getByText('Reactivate')).toBeInTheDocument();
    });

    it('opens confirmation modal on action click', async () => {
      render(<UsersPage />);

      const deactivateBtn = screen.getAllByText('Deactivate')[0];
      await userEvent.click(deactivateBtn);

      // Modal should appear
      expect(screen.getByText('Confirm Deactivate')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('calls API and refreshes on confirm action', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      render(<UsersPage />);

      // Click deactivate
      const deactivateBtn = screen.getAllByText('Deactivate')[0];
      await userEvent.click(deactivateBtn);

      // Confirm in modal
      const confirmBtn = screen.getByText('Yes, deactivate');
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/admin/users/1/deactivate');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('closes modal on cancel', async () => {
      render(<UsersPage />);

      // Open modal
      const deactivateBtn = screen.getAllByText('Deactivate')[0];
      await userEvent.click(deactivateBtn);

      expect(screen.getByText('Confirm Deactivate')).toBeInTheDocument();

      // Click cancel
      const cancelBtn = screen.getByText('Cancel');
      await userEvent.click(cancelBtn);

      // Modal should close
      expect(screen.queryByText('Confirm Deactivate')).not.toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { data: { detail: 'Operation failed' } },
      });

      render(<UsersPage />);

      const deactivateBtn = screen.getAllByText('Deactivate')[0];
      await userEvent.click(deactivateBtn);

      const confirmBtn = screen.getByText('Yes, deactivate');
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/operation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination when total exceeds limit', () => {
      mockUseUsers.mockReturnValue({
        users: { ...sampleUsers, total: 50 },
        isLoading: false,
        isError: false,
        refresh: mockRefresh,
      });

      render(<UsersPage />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      mockUseUsers.mockReturnValue({
        users: { ...sampleUsers, total: 50 },
        isLoading: false,
        isError: false,
        refresh: mockRefresh,
      });

      render(<UsersPage />);

      const prevBtn = screen.getByText('Previous');
      expect(prevBtn).toBeDisabled();
    });

    it('pagination changes page in hook call', async () => {
      mockUseUsers.mockReturnValue({
        users: { ...sampleUsers, total: 50 },
        isLoading: false,
        isError: false,
        refresh: mockRefresh,
      });

      render(<UsersPage />);

      const nextBtn = screen.getByText('Next');
      await userEvent.click(nextBtn);

      expect(mockUseUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  describe('Role Tabs', () => {
    it('shows role tabs', () => {
      render(<UsersPage />);

      expect(screen.getByText('All Users')).toBeInTheDocument();
      expect(screen.getByText('Admins')).toBeInTheDocument();
      expect(screen.getByText('Managers')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('clicking tab changes role filter', async () => {
      render(<UsersPage />);

      const adminsTab = screen.getByText('Admins');
      await userEvent.click(adminsTab);

      expect(mockUseUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin',
        })
      );
    });
  });
});
