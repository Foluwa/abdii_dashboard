/**
 * Content Management Types
 * Types for sentences, phrases, and content versioning
 */

export interface Sentence {
  id: string;
  language_id: string;
  text: string;
  translation: string;
  romanization: string | null;
  difficulty_level: number | null;
  category: string | null;
  tags: string[];
  usage_context: string | null;
  cultural_notes: string | null;
  is_published: boolean;
  published_at: string | null;
  audio_url: string | null;
  audio_duration_sec: number | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SentenceCreate {
  language_id: string;
  text: string;
  translation: string;
  romanization?: string;
  difficulty_level?: number;
  category?: string;
  tags?: string[];
  usage_context?: string;
  cultural_notes?: string;
  is_published?: boolean;
}

export interface SentenceUpdate {
  text?: string;
  translation?: string;
  romanization?: string;
  difficulty_level?: number;
  category?: string;
  tags?: string[];
  usage_context?: string;
  cultural_notes?: string;
  is_published?: boolean;
  audio_url?: string;
}

export interface Phrase {
  id: string;
  language_id: string;
  phrase: string;
  translation: string;
  literal_translation: string | null;
  romanization: string | null;
  difficulty_level: number | null;
  category: string | null;
  tags: string[];
  usage_context: string | null;
  cultural_notes: string | null;
  is_published: boolean;
  published_at: string | null;
  audio_url: string | null;
  audio_duration_sec: number | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhraseCreate {
  language_id: string;
  phrase: string;
  translation: string;
  literal_translation?: string;
  romanization?: string;
  difficulty_level?: number;
  category?: string;
  tags?: string[];
  usage_context?: string;
  cultural_notes?: string;
  is_published?: boolean;
}

export interface PhraseUpdate {
  phrase?: string;
  translation?: string;
  literal_translation?: string;
  romanization?: string;
  difficulty_level?: number;
  category?: string;
  tags?: string[];
  usage_context?: string;
  cultural_notes?: string;
  is_published?: boolean;
  audio_url?: string;
}

export interface ContentVersion {
  id: string;
  content_type: string;
  content_id: string;
  version_number: number;
  change_summary: string | null;
  content_snapshot: Record<string, unknown>;
  diff: Record<string, unknown> | null;
  edited_by: string | null;
  edited_at: string;
}

/**
 * Learning Items (Games & Lessons)
 */
export interface LearningItem {
  id: string;
  language_id: string;
  item_key: string;
  title: string;
  about: string;
  icon_name: string;
  level: string;
  difficulty: string;
  duration_minutes: number;
  xp_reward: number;
  item_type: 'game' | 'lesson';
  launch_route: string;
  is_active: boolean;
  is_premium: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LearningItemCreate {
  language_id: string;
  item_key: string;
  title: string;
  about?: string;
  icon_name?: string;
  level?: string;
  difficulty?: string;
  duration_minutes?: number;
  xp_reward?: number;
  item_type?: 'game' | 'lesson';
  launch_route?: string;
  is_active?: boolean;
  is_premium?: boolean;
  display_order?: number;
}

export interface LearningItemUpdate {
  title?: string;
  about?: string;
  icon_name?: string;
  level?: string;
  difficulty?: string;
  duration_minutes?: number;
  xp_reward?: number;
  item_type?: 'game' | 'lesson';
  launch_route?: string;
  is_active?: boolean;
  is_premium?: boolean;
  display_order?: number;
}

/**
 * Pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Content filters
 */
export interface ContentFilters {
  language_id?: string;
  difficulty?: number;
  category?: string;
  is_published?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}
