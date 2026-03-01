import React, { act } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CurriculumEditorPage from '@/app/(admin)/(others-pages)/content/curriculum/editor/page';
import { renderWithProviders as render } from '@/test-utils';

const mockUseAdminCoursesList = jest.fn();
const mockUseCourseCurriculumByKey = jest.fn();

jest.mock('@/hooks/useApi', () => ({
  useAdminCoursesList: (params: any) => mockUseAdminCoursesList(params),
  useCourseCurriculumByKey: (courseKey: string | null) => mockUseCourseCurriculumByKey(courseKey),
}));

const mockReorderUnits = jest.fn().mockResolvedValue({ ok: true });
const mockReorderSections = jest.fn().mockResolvedValue({ ok: true });
const mockMoveSection = jest.fn().mockResolvedValue({ ok: true });

jest.mock('@/lib/adminCurriculumApi', () => ({
  reorderCourseUnits: (...args: any[]) => mockReorderUnits(...args),
  reorderCourseSections: (...args: any[]) => mockReorderSections(...args),
  moveCourseSection: (...args: any[]) => mockMoveSection(...args),
}));

let mockDropSpecs: any[] = [];

jest.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: (spec: any) => {
    mockDropSpecs.push(spec);
    return [{}, jest.fn()];
  },
  __getDropSpecs: () => mockDropSpecs,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

const baseCurriculum = {
  id: 'c1',
  course_key: 'abidii_yoruba_v1',
  title: 'Abidii Yoruba',
  description: null,
  status: 'published',
  enabled: true,
  availability: 'available',
  units: [
    {
      id: 'u1',
      unit_key: 'u1',
      title: 'Unit 1',
      subtitle: null,
      status: 'published',
      enabled: true,
      availability: 'available',
      sections: [
        {
          id: 's1',
          section_key: 's1',
          title: 'Section 1',
          status: 'published',
          enabled: true,
          availability: 'available',
          lesson_blueprint_id: 'bp1',
          blueprint_key: 'bp-1',
        },
        {
          id: 's2',
          section_key: 's2',
          title: 'Section 2',
          status: 'published',
          enabled: true,
          availability: 'available',
          lesson_blueprint_id: 'bp2',
          blueprint_key: 'bp-2',
        },
      ],
    },
    {
      id: 'u2',
      unit_key: 'u2',
      title: 'Unit 2',
      subtitle: null,
      status: 'published',
      enabled: true,
      availability: 'available',
      sections: [
        {
          id: 's3',
          section_key: 's3',
          title: 'Section 3',
          status: 'published',
          enabled: true,
          availability: 'available',
          lesson_blueprint_id: 'bp3',
          blueprint_key: 'bp-3',
        },
      ],
    },
  ],
};

describe('CurriculumEditorPage', () => {
  beforeEach(() => {
    mockDropSpecs = [];
    jest.clearAllMocks();

    mockUseAdminCoursesList.mockReturnValue({
      data: { items: [{ id: 'c1', course_key: 'abidii_yoruba_v1', title: 'Abidii Yoruba' }] },
      isLoading: false,
    });

    mockUseCourseCurriculumByKey.mockReturnValue({
      curriculum: baseCurriculum,
      isLoading: false,
      isError: false,
      refresh: jest.fn(),
    });
  });

  it('calls reorder API after unit drag reorder', async () => {
    render(<CurriculumEditorPage />);

    const dnd = jest.requireMock('react-dnd');
    const specs = dnd.__getDropSpecs();
    const unitDrops = specs.filter((s: any) => s.accept === 'UNIT');

    // Simulate dragging unit index 0 over unit index 1
    await act(async () => {
      unitDrops[1].hover({ type: 'UNIT', index: 0 });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockReorderUnits).toHaveBeenCalledWith('abidii_yoruba_v1', [
      { unit_key: 'u2', order_index: 0 },
      { unit_key: 'u1', order_index: 1 },
    ]);
  });

  it('calls move section API when section is moved between units', async () => {
    render(<CurriculumEditorPage />);

    const dnd = jest.requireMock('react-dnd');
    const specs = dnd.__getDropSpecs();
    const sectionDrops = specs.filter((s: any) => s.accept === 'SECTION' && typeof s.drop === 'function');

    // Drop section s1 from unit u1 into unit u2
    await act(async () => {
      sectionDrops[1].drop({ type: 'SECTION', unitKey: 'u1', index: 0 });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockMoveSection).toHaveBeenCalledWith('abidii_yoruba_v1', {
      section_key: 's1',
      from_unit_key: 'u1',
      to_unit_key: 'u2',
      order_index: 0,
    });
  });

  it('shows saved toast after successful save', async () => {
    render(<CurriculumEditorPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('shows error toast and reverts draft order on save failure', async () => {
    mockReorderUnits.mockRejectedValueOnce(new Error('boom'));

    render(<CurriculumEditorPage />);

    const dnd = jest.requireMock('react-dnd');
    const specs = dnd.__getDropSpecs();
    const unitDrops = specs.filter((s: any) => s.accept === 'UNIT');

    await act(async () => {
      unitDrops[1].hover({ type: 'UNIT', index: 0 });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('boom')).toBeInTheDocument();

    const unit1 = screen.getByText('Unit 1');
    const unit2 = screen.getByText('Unit 2');
    const order = unit1.compareDocumentPosition(unit2);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
