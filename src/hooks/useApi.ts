/**
 * Custom hooks for API data fetching using SWR
 * 
 * Provides reusable hooks for:
 * - Data fetching with automatic caching
 * - Auto-refresh on interval
 * - Error handling
 * - Loading states
 */

import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import type { UserRole } from '@/types/auth';
import {
  SystemStatus,
  SystemStats,
  UserListItem,
  UserDetail,
  Language,
  Lesson,
  Word,
  AlertLevel,
  AlertCategory,
  Proverb,
  AlertHistoryItem,
  ConfigEntry,
  AppSetting,
  PaginatedResponse,
  UserFilters,
  ContentFilters,
  AlertFilters,
  Game,
  GameType,
} from '@/types/api';

/**
 * Generic fetcher function for SWR
 */
const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

/**
 * System Status Hook
 * Auto-refreshes every 60 seconds
 */
export function useSystemStatus() {
  const { data, error, mutate } = useSWR<SystemStatus>(
    '/api/v1/admin/status',
    fetcher,
    {
      refreshInterval: 0, // Disabled auto-refresh - only refresh on user action
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Avoid infinite retry loops on persistent 401/403 from admin status
      shouldRetryOnError: false,
    }
  );

  return {
    status: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * System Stats Hook
 */
export function useSystemStats() {
  const { data, error, mutate } = useSWR<SystemStats>(
    '/api/v1/admin/stats',
    fetcher,
    {
      refreshInterval: 0, // Disabled auto-refresh - only refresh on user action
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Avoid infinite retry loops on persistent 401/403 from admin stats
      shouldRetryOnError: false,
    }
  );

  return {
    stats: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * System Metrics Hook
 * For monitoring CPU, memory, disk usage
 */
export function useSystemMetrics() {
  const { data, error, mutate } = useSWR(
    '/api/v1/admin/metrics/system',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    metrics: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Users List Hook with filters
 */
export function useUsers(filters?: { 
  search?: string; 
  role?: UserRole; 
  page?: number; 
  limit?: number;
  is_active?: boolean;
  provider?: string;
  min_xp?: number;
  max_xp?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.role) params.append('role', filters.role);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters?.provider) params.append('provider', filters.provider);
  if (filters?.min_xp !== undefined) params.append('min_xp', filters.min_xp.toString());
  if (filters?.max_xp !== undefined) params.append('max_xp', filters.max_xp.toString());

  const url = `/api/v1/admin/users?${params.toString()}`;

  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    users: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * User Detail Hook
 */
export function useUserDetail(userId: string | null) {
  const { data, error, mutate } = useSWR(
    userId ? `/api/v1/admin/users/${userId}` : null,
    fetcher
  );

  return {
    user: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Admin Users Hook
 */
export function useAdminUsers() {
  const { data, error, mutate } = useSWR<UserListItem[]>(
    '/api/v1/admin/admins',
    fetcher
  );

  return {
    admins: data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Configuration Hook - Feature Flags Management
 */
export function useConfig() {
  const { data, error, mutate } = useSWR<ConfigEntry[]>(
    '/api/v1/admin/configs',
    fetcher
  );

  return {
    config: data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * App Settings Hook - JSONB-based Settings Management
 */
export function useAppSettings(category?: string) {
  const url = category
    ? `/api/v1/admin/configs/app-settings?category=${category}`
    : '/api/v1/admin/configs/app-settings';
  
  const { data, error, mutate } = useSWR<AppSetting[]>(url, fetcher);

  return {
    settings: data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Alert History Hook
 */
export function useAlertHistory(filters?: AlertFilters) {
  const params = new URLSearchParams();
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.level) params.append('level', filters.level);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.hours) params.append('hours', filters.hours.toString());

  const url = `/api/v1/admin/history?${params.toString()}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 60000, // 60 seconds
  });

  return {
    alerts: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Languages Hook
 */
export function useLanguages() {
  const { data, error, mutate } = useSWR('/api/v1/languages', fetcher);

  return {
    languages: data?.languages || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Lessons Hook
 */
export function useLessons(filters?: { language_id?: number; status?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.language_id) params.append('language_id', filters.language_id.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `/api/v1/admin/lessons?${params.toString()}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    lessons: data?.lessons || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Words filter options type
 */
export interface WordsFilters {
  language_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: number;
  has_audio?: boolean;
  has_examples?: boolean;
  has_related?: boolean;
  has_pronunciation?: boolean;
  starts_with?: string;
  ends_with?: string;
  contains?: string;
  pos?: string; // comma-separated for multiple: "noun,verb"
  tone_marks_present?: boolean;
  ipa_present?: boolean;
  word_length_min?: number;
  word_length_max?: number;
  sort_by?: 'lemma' | 'created_at' | 'updated_at' | 'difficulty' | 'pos';
  sort_dir?: 'asc' | 'desc';
}

/**
 * Words Hook with comprehensive filters
 */
export function useWords(filters?: WordsFilters) {
  const params = new URLSearchParams();
  
  // Basic filters
  if (filters?.language_id) params.append('language_id', filters.language_id);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.category) params.append('category', filters.category);
  if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
  
  // Boolean filters
  if (filters?.has_audio !== undefined) params.append('has_audio', filters.has_audio.toString());
  if (filters?.has_examples !== undefined) params.append('has_examples', filters.has_examples.toString());
  if (filters?.has_related !== undefined) params.append('has_related', filters.has_related.toString());
  if (filters?.has_pronunciation !== undefined) params.append('has_pronunciation', filters.has_pronunciation.toString());
  if (filters?.tone_marks_present !== undefined) params.append('tone_marks_present', filters.tone_marks_present.toString());
  if (filters?.ipa_present !== undefined) params.append('ipa_present', filters.ipa_present.toString());
  
  // Text filters
  if (filters?.starts_with) params.append('starts_with', filters.starts_with);
  if (filters?.ends_with) params.append('ends_with', filters.ends_with);
  if (filters?.contains) params.append('contains', filters.contains);
  if (filters?.pos) params.append('pos', filters.pos);
  
  // Numeric filters
  if (filters?.word_length_min) params.append('word_length_min', filters.word_length_min.toString());
  if (filters?.word_length_max) params.append('word_length_max', filters.word_length_max.toString());
  
  // Sorting
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_dir) params.append('sort_dir', filters.sort_dir);

  const url = `/api/v1/admin/content/words?${params.toString()}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    words: data?.items || [],
    total: data?.total || 0,
    pages: data?.pages || 0,
    filtersApplied: data?.filters_applied || {},
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Proverbs Hook
 */
export function useProverbs(filters?: { language_id?: number; category?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.language_id) params.append('language_id', filters.language_id.toString());
  if (filters?.category) params.append('category', filters.category);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `/api/v1/admin/content/proverbs?${params.toString()}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    proverbs: data?.items || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}
/**
 * Games Hook
 */
export function useGames(filters?: { language_id?: number; game_type?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.language_id) params.append('language_id', filters.language_id.toString());
  if (filters?.game_type) params.append('game_type', filters.game_type);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `/api/v1/admin/games?${params.toString()}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    games: data?.games || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

// =============================================================================
// ANALYTICS HOOKS
// =============================================================================

/**
 * Platform Distribution Hook
 * Returns users grouped by provider (device/google/apple)
 */
export function usePlatformDistribution() {
  const { data, error, mutate } = useSWR(
    '/api/v1/admin/analytics/platform-distribution',
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    distribution: data?.data || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Monthly User Growth Hook
 * Returns new user registrations per month
 */
export function useMonthlyUserGrowth(months: number = 12) {
  const { data, error, mutate } = useSWR(
    `/api/v1/admin/analytics/monthly-user-growth?months=${months}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Monthly Subscriber Growth Hook
 * Returns new subscribers per month (first-time only)
 */
export function useMonthlySubscriberGrowth(months: number = 12) {
  const { data, error, mutate } = useSWR(
    `/api/v1/admin/analytics/monthly-subscriber-growth?months=${months}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

// =============================================================================
// SUBSCRIPTIONS HOOKS
// =============================================================================

/**
 * Subscriptions List Hook
 */
export function useSubscriptions(filters?: {
  status?: string;
  plan_id?: string;
  provider?: string;
  platform?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.plan_id) params.append('plan_id', filters.plan_id);
  if (filters?.provider) params.append('provider', filters.provider);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `/api/v1/admin/subscriptions?${params.toString()}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    subscriptions: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Subscription Stats Hook
 */
export function useSubscriptionStats() {
  const { data, error, mutate } = useSWR(
    '/api/v1/admin/subscriptions/stats/summary',
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    stats: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}