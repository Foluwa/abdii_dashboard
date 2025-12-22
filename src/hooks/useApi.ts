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
export function useUsers(filters?: { search?: string; role?: UserRole; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.role) params.append('role', filters.role);
  if (filters?.search) params.append('search', filters.search);

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
export function useUserDetail(userId: number) {
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
 * Configuration Hook
 */
export function useConfig() {
  const { data, error, mutate } = useSWR<ConfigEntry[]>(
    '/api/v1/admin/config',
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
 * Words Hook with filters
 */
export function useWords(filters?: { language_id?: number; search?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.language_id) params.append('language_id', filters.language_id.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `/api/v1/admin/content/words?${params.toString()}`;
  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    words: data?.items || [],
    total: data?.total || 0,
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