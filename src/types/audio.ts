/**
 * Audio Management Types
 * Types for voices, audio jobs, and TTS pipeline
 */

export type AudioJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AudioContentType = 'letter' | 'word' | 'sentence' | 'phrase' | 'proverb';

export interface Voice {
  id: string;
  provider: string;
  voice_code: string;
  language_id: string;
  language_code: string;
  gender: string | null;
  accent: string | null;
  display_name: string;
  description: string | null;
  sample_audio_url: string | null;
  is_active: boolean;
  is_premium: boolean;
  default_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VoiceCreate {
  provider: string;
  voice_code: string;
  language_id: string;
  language_code: string;
  gender?: string;
  accent?: string;
  display_name: string;
  description?: string;
  sample_audio_url?: string;
  is_active?: boolean;
  is_premium?: boolean;
  default_settings?: Record<string, unknown>;
}

export interface VoiceUpdate {
  provider?: string;
  voice_code?: string;
  language_id?: string;
  language_code?: string;
  gender?: string;
  accent?: string;
  display_name?: string;
  description?: string;
  sample_audio_url?: string;
  is_active?: boolean;
  is_premium?: boolean;
  default_settings?: Record<string, unknown>;
}

export interface AudioGenerationJob {
  id: string;
  job_type: string;
  status: AudioJobStatus;
  content_type: AudioContentType;
  content_id: string;
  voice_id: string | null;
  voice_settings: Record<string, unknown>;
  text_to_speak: string;
  output_url: string | null;
  output_duration_sec: number | null;
  audio_format: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_by: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AudioJobCreate {
  content_type: AudioContentType;
  content_id: string;
  voice_id: string;
  text_to_speak: string;
  voice_settings?: Record<string, unknown>;
  job_type?: string;
}

export interface AudioJobStats {
  total_jobs: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  success_rate: number;
  avg_processing_time_sec: number | null;
}

/**
 * Audio filters
 */
export interface AudioJobFilters {
  status?: AudioJobStatus;
  content_type?: AudioContentType;
  voice_id?: string;
  page?: number;
  page_size?: number;
}

export interface VoiceFilters {
  language_id?: string;
  provider?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}
