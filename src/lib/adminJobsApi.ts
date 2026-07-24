import { apiClient } from '@/lib/api';

export type AdminJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type AdminJob = {
  id: string;
  type: string;
  status: AdminJobStatus;
  progress: {
    total: number;
    current: number;
    percent: number;
  };
  payload: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  error?: string | null;
  parent_job_id?: string | null;
  attempts: number;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
};

export type AdminJobListResponse = {
  items: AdminJob[];
  total: number;
  limit: number;
  offset: number;
};

export async function createMissingSenseJob(payload: {
  limit: number;
  dry_run?: boolean;
  language?: string;
}) {
  const res = await apiClient.post<AdminJob>('/api/v1/admin/dictionary/senses/jobs', {
    dry_run: true,
    language: 'yo',
    ...payload,
  });
  return res.data;
}

export async function createProverbCleanupJob(payload: {
  dry_run?: boolean;
  cleanup_type?: 'old_audio_format';
}) {
  const res = await apiClient.post<AdminJob>('/api/v1/admin/proverbs/cleanup/jobs', {
    dry_run: true,
    cleanup_type: 'old_audio_format',
    ...payload,
  });
  return res.data;
}

export async function createTimePhraseJob(payload: {
  job_type: 'audio' | 'alignment' | 'readiness';
  limit: number;
  dry_run?: boolean;
}) {
  const res = await apiClient.post<AdminJob>('/api/v1/admin/time-phrases/jobs', {
    dry_run: true,
    ...payload,
  });
  return res.data;
}

export async function createAudioReconciliationJob() {
  const res = await apiClient.post<AdminJob>('/api/v1/admin/content/audio-reconciliation/jobs');
  return res.data;
}

export async function listAdminJobs(params?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await apiClient.get<AdminJobListResponse>(`/api/v1/admin/jobs${suffix}`);
  return res.data;
}

export async function getAdminJob(jobId: string) {
  const res = await apiClient.get<AdminJob>(`/api/v1/admin/jobs/${jobId}`);
  return res.data;
}

export async function cancelAdminJob(jobId: string) {
  const res = await apiClient.post<AdminJob>(`/api/v1/admin/jobs/${jobId}/cancel`);
  return res.data;
}

export async function retryAdminJob(jobId: string) {
  const res = await apiClient.post<AdminJob>(`/api/v1/admin/jobs/${jobId}/retry`);
  return res.data;
}
