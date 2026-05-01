import { useCallback, useEffect, useState } from 'react';
import { getAdminJob, type AdminJob } from '@/lib/adminJobsApi';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export function useAdminJob(jobId?: string | null) {
  const [job, setJob] = useState<AdminJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      return null;
    }

    setLoading(true);
    try {
      const nextJob = await getAdminJob(jobId);
      setJob(nextJob);
      setError(null);
      return nextJob;
    } catch (err: any) {
      const message = err?.response?.data?.detail ?? err?.message ?? 'Failed to load admin job';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await refresh();
    };

    void load();
    const intervalId = window.setInterval(async () => {
      if (cancelled) return;
      const nextJob = await refresh();
      if (nextJob && TERMINAL_STATUSES.has(nextJob.status)) {
        window.clearInterval(intervalId);
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [jobId, refresh]);

  return {
    job,
    loading,
    error,
    status: job?.status,
    progress: job?.progress,
    result: job?.result ?? null,
    refresh,
  };
}

