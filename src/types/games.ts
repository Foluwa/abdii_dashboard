/**
 * Games Management Types
 * Types for games, game content mapping, and game configuration
 */

export type GameType =
  | 'letter_matching'
  | 'audio_recognition'
  | 'spelling'
  | 'tone_quiz'
  | 'word_building'
  | 'sentence_ordering'
  | 'translation_match';

export type GameContentType = 'letter' | 'word' | 'sentence' | 'phrase' | 'phonics';

export interface Game {
  id: string;
  language_id: string;
  game_type: GameType;
  name: string;
  description: string | null;
  instructions: string | null;
  rules: Record<string, unknown>;
  difficulty_level: number | null;
  is_active: boolean;
  is_published: boolean;
  min_items: number;
  max_items: number;
  time_limit_seconds: number | null;
  points_per_correct: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameCreate {
  language_id: string;
  game_type: GameType;
  name: string;
  description?: string;
  instructions?: string;
  rules?: Record<string, unknown>;
  difficulty_level?: number;
  is_active?: boolean;
  is_published?: boolean;
  min_items?: number;
  max_items?: number;
  time_limit_seconds?: number;
  points_per_correct?: number;
}

export interface GameUpdate {
  game_type?: GameType;
  name?: string;
  description?: string;
  instructions?: string;
  rules?: Record<string, unknown>;
  difficulty_level?: number;
  is_active?: boolean;
  is_published?: boolean;
  min_items?: number;
  max_items?: number;
  time_limit_seconds?: number;
  points_per_correct?: number;
}

export interface GameContentMap {
  id: string;
  game_id: string;
  content_type: GameContentType;
  content_id: string;
  is_distractor: boolean;
  weight: number;
  created_at: string;
}

export interface GameContentMapCreate {
  content_type: GameContentType;
  content_id: string;
  is_distractor?: boolean;
  weight?: number;
}

/**
 * Game filters
 */
export interface GameFilters {
  language_id?: string;
  game_type?: GameType;
  is_published?: boolean;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}
