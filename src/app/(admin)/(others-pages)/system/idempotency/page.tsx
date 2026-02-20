"use client";

import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { apiClient } from "@/lib/api";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import Alert from "@/components/ui/alert/SimpleAlert";

interface IdempotencyStats {
  total_keys: number;
  expired_keys: number;
  active_keys: number;
  hit_rate: number;
  avg_ttl_seconds: number;
  recent_duplicate_attempts: number;
}

export default function IdempotencyPage() {
  const [stats, setStats] = useState<IdempotencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchStats();
  }, [days]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/admin/health/idempotency?days=${days}`);
      const data = response.data;
      // Ensure all numeric fields exist with defaults
      const safeStats = {
        total_keys: data.total_keys ?? 0,
        expired_keys: data.expired_keys ?? 0,
        active_keys: data.active_keys ?? 0,
        hit_rate: data.hit_rate ?? 0,
        avg_ttl_seconds: data.avg_ttl_seconds ?? 0,
        recent_duplicate_attempts: data.recent_duplicate_attempts ?? 0,
      };
      setStats(safeStats);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch idempotency stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Idempotency Health" />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Time Range Filter */}
      <div className="mb-6 flex items-center gap-4">
        <StyledSelect
          label="Time Range"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          options={[
            { value: 1, label: "Last 24 hours" },
            { value: 7, label: "Last 7 days" },
            { value: 30, label: "Last 30 days" },
            { value: 90, label: "Last 90 days" }
          ]}
        />
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {stats && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Keys */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Keys</h3>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {stats.total_keys.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Unique request keys
              </p>
            </div>

            {/* Active Keys */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Keys</h3>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.active_keys.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Currently cached
              </p>
            </div>

            {/* Duplicate Attempts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duplicate Attempts</h3>
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.recent_duplicate_attempts.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Prevented duplicates
              </p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Idempotency Performance
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hit Rate</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all"
                        style={{ width: `${stats.hit_rate}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      {stats.hit_rate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Requests served from cache
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Average TTL</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Seconds:</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {stats.avg_ttl_seconds.toFixed(0)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Minutes:</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {(stats.avg_ttl_seconds / 60).toFixed(1)}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  About Idempotency
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Idempotency middleware prevents duplicate request processing by caching request signatures.
                  This is crucial for ensuring data consistency and preventing double charges, duplicate
                  records, or race conditions in your API.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
