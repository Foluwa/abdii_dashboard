import React from 'react';
import { screen } from '@testing-library/react';

import { LessonRuntimePreview } from '@/components/admin/curriculum/LessonRuntimePreview';
import { renderWithProviders as render } from '@/test-utils';

const mockUseCurriculumVocabLibrary = jest.fn();

jest.mock('@/hooks/useApi', () => ({
  useCurriculumVocabLibrary: (filters: unknown) => mockUseCurriculumVocabLibrary(filters),
}));

describe('LessonRuntimePreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurriculumVocabLibrary.mockReturnValue({
      items: [],
    });
  });

  it('renders media previews with hoverable external links instead of raw URLs', () => {
    const heroImageUrl = 'https://cdn.example.com/media/hero-image.png';
    const topLevelAudioUrl = 'https://cdn.example.com/media/lesson-audio.mp3';
    const stepImageUrl = 'https://cdn.example.com/media/step-image.png';
    const stepAudioUrl = 'https://cdn.example.com/media/step-audio.mp3';

    render(
      <LessonRuntimePreview
        blueprint={{
          blueprint_key: 'lesson_reading_practice_01',
          lesson_kind: 'reading_practice',
          payload: {
            title: 'Reading Practice',
            heroImageUrl,
            audioUrl: topLevelAudioUrl,
            steps: [
              {
                runtimeType: 'recognitionTask',
                promptText: 'Select the correct meaning',
                imageUrl: stepImageUrl,
                audioUrl: stepAudioUrl,
              },
            ],
          },
        }}
      />
    );

    const heroLink = screen.getAllByTitle(heroImageUrl)[0];
    expect(heroLink).toHaveAttribute('href', heroImageUrl);
    expect(heroLink).toHaveAttribute('target', '_blank');

    const topLevelAudioLink = screen.getAllByTitle(topLevelAudioUrl)[0];
    expect(topLevelAudioLink).toHaveAttribute('href', topLevelAudioUrl);
    expect(topLevelAudioLink).toHaveAttribute('target', '_blank');

    const stepImageLink = screen.getAllByTitle(stepImageUrl)[0];
    expect(stepImageLink).toHaveAttribute('href', stepImageUrl);
    expect(stepImageLink).toHaveAttribute('target', '_blank');

    const stepAudioLink = screen.getAllByTitle(stepAudioUrl)[0];
    expect(stepAudioLink).toHaveAttribute('href', stepAudioUrl);
    expect(stepAudioLink).toHaveAttribute('target', '_blank');

    expect(screen.queryByText(heroImageUrl)).not.toBeInTheDocument();
    expect(screen.queryByText(topLevelAudioUrl)).not.toBeInTheDocument();
    expect(screen.queryByText(stepImageUrl)).not.toBeInTheDocument();
    expect(screen.queryByText(stepAudioUrl)).not.toBeInTheDocument();
  });
});
