/**
 * Admin TTS Generation Types
 * For the new admin TTS preview/save/delete endpoints
 */

export interface TTSProvider {
  name: string;
  display_name: string;
  supported_languages: string[];
  is_configured: boolean;
  is_available: boolean;
}

export interface TTSProvidersResponse {
  providers: TTSProvider[];
}

export interface TTSProviderVoice {
  id: string;
  voice_code: string;
  display_name: string;
  language_code: string;
  gender: string | null;
  accent: string | null;
  is_active: boolean;
  is_premium: boolean;
  sample_audio_url: string | null;
}

export interface TTSProviderVoicesResponse {
  provider: string;
  voices: TTSProviderVoice[];
}

export interface TTSPreviewRequest {
  lemma_id: string;
  language_id: string;
  provider: string;
  voice_code: string;
  custom_text?: string;
  options?: {
    speed?: number;
    pitch?: number;
  };
}

export interface TTSPreviewResponse {
  preview_url: string;
  duration_sec: number;
  format: string;
  expires_at: string;
  provider: string;
  voice_code: string;
  sample_rate: number;
}

export interface TTSSaveRequest {
  lemma_id: string;
  language_id: string;
  provider: string;
  voice_id: string;
  audio_data: string; // base64
  duration_sec: number;
  format: string;
  sample_rate: number;
  ipa_pronunciation?: string;
  custom_text?: string;
}

export interface TTSSaveResponse {
  id: string;
  lemma_id: string;
  s3_bucket_key: string;
  audio_url: string;
  duration_sec: number;
  tts_provider: string;
  tts_voice_id: string;
  created_at: string;
}

export interface TTSDeleteResponse {
  success: boolean;
  message: string;
  deleted_audio_id: string;
  s3_key_deleted: string;
}

export interface Lemma {
  id: string;
  word: string;
  language_id: string;
  language_code: string;
  word_class: string | null;
  definition?: string;
  audio_url?: string;
}
