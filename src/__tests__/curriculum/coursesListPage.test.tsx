import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CurriculumCoursesListPage from '@/app/(admin)/(others-pages)/content/curriculum/courses/page';
import { renderWithProviders as render } from '@/test-utils';

const mockRefresh = jest.fn().mockResolvedValue(undefined);
const mockUseAdminCoursesList = jest.fn();

jest.mock('@/hooks/useApi', () => ({
  useAdminCoursesList: (filters: unknown) => mockUseAdminCoursesList(filters),
}));

const mockValidateAdminCourse = jest.fn();
const mockPublishAdminCourse = jest.fn();
const mockUnpublishAdminCourse = jest.fn();

jest.mock('@/lib/adminCurriculumApi', () => ({
  validateAdminCourse: (courseId: string) => mockValidateAdminCourse(courseId),
  publishAdminCourse: (courseId: string) => mockPublishAdminCourse(courseId),
  unpublishAdminCourse: (courseId: string) => mockUnpublishAdminCourse(courseId),
}));

jest.mock('@/lib/adminActionLog', () => ({
  logAdminCurriculumAction: jest.fn(),
}));

describe('CurriculumCoursesListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAdminCoursesList.mockReturnValue({
      data: {
        items: [
          {
            id: 'c1',
            course_key: 'yoruba_101',
            title: 'Yoruba 101',
            description: null,
            status: 'draft',
            enabled: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 'c2',
            course_key: 'yoruba_102',
            title: 'Yoruba 102',
            description: null,
            status: 'draft',
            enabled: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 50,
        pages: 1,
        filters_applied: {},
      },
      isLoading: false,
      isError: false,
      refresh: mockRefresh,
    });

    mockValidateAdminCourse.mockResolvedValue({});
    mockUnpublishAdminCourse.mockResolvedValue({});
  });

  it('renders courses table and rows', () => {
    render(<CurriculumCoursesListPage />);

    expect(screen.getByText('Curriculum Courses')).toBeInTheDocument();

    const table = screen.getByRole('table');
    const t = within(table);

    expect(t.getByText('Course', { selector: 'th' })).toBeInTheDocument();
    expect(t.getByText('Key', { selector: 'th' })).toBeInTheDocument();
    expect(t.getByText('Status', { selector: 'th' })).toBeInTheDocument();
    expect(t.getByText('Enabled', { selector: 'th' })).toBeInTheDocument();

    expect(screen.getByText('Yoruba 101')).toBeInTheDocument();
    expect(screen.getByText('yoruba_101')).toBeInTheDocument();
    expect(screen.getByText('Yoruba 102')).toBeInTheDocument();
    expect(screen.getByText('yoruba_102')).toBeInTheDocument();
  });

  it('requires confirmation before bulk publish, and shows blocked outcomes', async () => {
    mockPublishAdminCourse
      .mockResolvedValueOnce({ ok: true, statusCode: 200, body: {} })
      .mockResolvedValueOnce({ ok: false, statusCode: 409, body: {} });

    render(<CurriculumCoursesListPage />);

    await userEvent.click(screen.getByLabelText('Select course Yoruba 101'));
    await userEvent.click(screen.getByLabelText('Select course Yoruba 102'));

    await userEvent.click(screen.getByText('Publish Selected'));

    expect(screen.getByText('Publish selected courses')).toBeInTheDocument();
    expect(mockPublishAdminCourse).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(mockPublishAdminCourse).toHaveBeenCalledTimes(2);
      expect(mockPublishAdminCourse).toHaveBeenNthCalledWith(1, 'c1');
      expect(mockPublishAdminCourse).toHaveBeenNthCalledWith(2, 'c2');
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(screen.getByText('Last bulk run')).toBeInTheDocument();
    expect(screen.getByText(/Success: 1, Blocked: 1, Failed: 0/i)).toBeInTheDocument();
  });

  it('requires confirmation before bulk unpublish', async () => {
    render(<CurriculumCoursesListPage />);

    await userEvent.click(screen.getByLabelText('Select course Yoruba 101'));
    await userEvent.click(screen.getByText('Unpublish Selected'));

    expect(screen.getByText('Unpublish selected courses')).toBeInTheDocument();
    expect(mockUnpublishAdminCourse).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Unpublish'));

    await waitFor(() => {
      expect(mockUnpublishAdminCourse).toHaveBeenCalledTimes(1);
      expect(mockUnpublishAdminCourse).toHaveBeenCalledWith('c1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
