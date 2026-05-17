"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/modal/ConfirmationModal";
import {
  getMlReadiness,
  getMlTrainingJob,
  getMlTrainingJobLogs,
  getHandwritingDatasetReadiness,
  applyHandwritingCandidatePromotion,
  bulkUpdateHandwritingCandidates,
  createHandwritingCandidateManifest,
  dryRunHandwritingCandidatePromotion,
  getHandwritingCandidateManifest,
  getHandwritingCandidatePreview,
  listHandwritingCandidateManifests,
  listHandwritingCandidates,
  getVerifiedPromotionCollectionGaps,
  getVerifiedPromotionReadiness,
  listMlModelVersions,
  listMlTrainingJobs,
  promoteMlModelVersion,
  rollbackMlModelVersion,
  uploadHandwritingCandidateSamples,
  uploadHandwritingCandidatesDb,
  getHandwritingVisionProviders,
  estimateHandwritingVisionJob,
  createHandwritingVisionJob,
  suggestHandwritingCandidateLabel,
  acceptHandwritingVisionSuggestion,
  pollHandwritingVisionJob,
  importHandwritingVisionJobResults,
  getHandwritingVisionJob,
  type HandwritingDatasetReadinessResponse,
  type HandwritingCandidate,
  type HandwritingCandidateManifest,
  type HandwritingPromotionResult,
  type MlModelVersion,
  type MlReadinessResponse,
  type MlTrainingJob,
  type MlTrainingJobEvent,
  type VerifiedPromotionCollectionGapResponse,
  type VerifiedPromotionReadinessResponse,
  type VisionProvidersResponse,
  type VisionJobEstimate,
  type VisionSuggestionResult,
} from "@/lib/adminMlApi";

const PAGE_SIZE = 20;

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatPercent(value?: number | null) {
  return `${Math.round(Number(value || 0))}%`;
}

function formatMetricPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString();
}

function pickMetric(metrics: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metrics) return null;
  for (const key of keys) {
    const value = metrics[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  }
  return null;
}

function statusClass(status?: string | null) {
  if (status === "succeeded" || status === "production" || status === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  }
  if (status === "failed" || status === "error") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  if (status === "running" || status === "staging") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";
  }
  if (status === "queued") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  }
  if (status === "ready") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  }
  if (status === "low") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  }
  if (status === "missing") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}>
      {status || "unknown"}
    </span>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      {message}
    </div>
  );
}

function InlineSuccess({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
      {message}
    </div>
  );
}

function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">{label}</div>;
}

function SummaryCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      {detail ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</div> : null}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];
}

function getLatestSmoke(jobs: MlTrainingJob[]) {
  return jobs.find((job) => {
    const path = job.dataset_path || "";
    const params = job.parameters || {};
    return path.startsWith("smoke://") || params.smoke_test_only === true || params.diagnostic_hold_seconds === 0;
  });
}

function useMlOverview() {
  const [readiness, setReadiness] = useState<MlReadinessResponse | null>(null);
  const [datasetReadiness, setDatasetReadiness] = useState<HandwritingDatasetReadinessResponse | null>(null);
  const [jobs, setJobs] = useState<MlTrainingJob[]>([]);
  const [models, setModels] = useState<MlModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [readinessData, datasetReadinessData, jobData, modelData] = await Promise.all([
        getMlReadiness(300),
        getHandwritingDatasetReadiness({ target_min_count: 300, target_high_count: 500 }),
        listMlTrainingJobs({ limit: 50, offset: 0 }),
        listMlModelVersions({ limit: 20, offset: 0 }),
      ]);
      setReadiness(readinessData);
      setDatasetReadiness(datasetReadinessData);
      setJobs(jobData.items);
      setModels(modelData.items);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.response?.data?.detail ?? err?.message ?? "Unable to load ML training data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { readiness, datasetReadiness, jobs, models, loading, error, refresh };
}

export function MLTrainingOverviewPage() {
  const { readiness, datasetReadiness, jobs, models, loading, error, refresh } = useMlOverview();
  const [classSearch, setClassSearch] = useState("");
  const [classLanguageFilter, setClassLanguageFilter] = useState("");
  const [classStatusFilter, setClassStatusFilter] = useState("");
  const [classPage, setClassPage] = useState(1);
  const latestSmoke = useMemo(() => getLatestSmoke(jobs), [jobs]);
  const runningJobs = readiness?.training_jobs.running || 0;
  const succeededJobs = readiness?.training_jobs.succeeded || 0;
  const globalDataset = datasetReadiness?.global_readiness;
  const readinessPageSize = 25;
  const filteredReadinessClasses = useMemo(() => {
    const search = classSearch.trim().toLowerCase();
    return (datasetReadiness?.classes || []).filter((item) => {
      if (search && !item.class_label.toLowerCase().includes(search)) return false;
      if (classLanguageFilter && item.language !== classLanguageFilter && item.script_group !== classLanguageFilter) return false;
      if (classStatusFilter && item.readiness_status !== classStatusFilter) return false;
      return true;
    });
  }, [classLanguageFilter, classSearch, classStatusFilter, datasetReadiness?.classes]);
  const readinessTotalPages = Math.max(1, Math.ceil(filteredReadinessClasses.length / readinessPageSize));
  const paginatedReadinessClasses = filteredReadinessClasses.slice((classPage - 1) * readinessPageSize, classPage * readinessPageSize);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="ML Training" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ML Training</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Remote handwriting training readiness, smoke status, jobs, and model versions.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/system/ml-training/jobs">
            <Button variant="outline" size="sm">Jobs</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {error ? <InlineError message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Readiness Threshold" value={readiness?.threshold ?? "-"} detail="verified samples per label gate" />
        <SummaryCard label="Ready Classes" value={globalDataset?.ready_classes ?? "-"} detail={`${globalDataset?.blocking_classes ?? "-"} blocking`} />
        <SummaryCard label="Missing Classes" value={globalDataset?.missing_classes ?? "-"} />
        <SummaryCard label="Approved Pending" value={globalDataset?.approved_pending_samples ?? "-"} detail={globalDataset?.can_run_dry_run_promotion ? "dry-run available" : "nothing approved yet"} />
      </div>

      <Panel title="Dataset Readiness">
        {loading && !datasetReadiness ? (
          <LoadingBlock />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Full training is disabled. {globalDataset?.next_best_action || "Collect and verify handwriting samples first."}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Total Classes" value={globalDataset?.total_classes ?? "-"} />
              <SummaryCard label="Low Classes" value={globalDataset?.low_classes ?? "-"} />
              <SummaryCard label="Can Dry-run" value={globalDataset?.can_run_dry_run_promotion ? "Yes" : "No"} />
              <SummaryCard label="Full Training" value={globalDataset?.can_run_full_training ? "Allowed" : "Disabled"} />
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <input
                value={classSearch}
                onChange={(event) => {
                  setClassSearch(event.target.value);
                  setClassPage(1);
                }}
                placeholder="Search class label"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                value={classLanguageFilter}
                onChange={(event) => {
                  setClassLanguageFilter(event.target.value);
                  setClassPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All languages</option>
                <option value="eng">English</option>
                <option value="yor">Yoruba</option>
              </select>
              <select
                value={classStatusFilter}
                onChange={(event) => {
                  setClassStatusFilter(event.target.value);
                  setClassPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All statuses</option>
                <option value="missing">missing</option>
                <option value="low">low</option>
                <option value="ready">ready</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Candidates</th>
                    <th className="px-3 py-2">Verified</th>
                    <th className="px-3 py-2">Approved Pending</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Blocking</th>
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedReadinessClasses.map((item) => {
                    const percent = Math.min(100, Math.round((item.verified_count / item.target_min_count) * 100));
                    return (
                      <tr key={`${item.language}-${item.class_label}`} className={item.is_blocking_training ? "bg-red-50/50 dark:bg-red-950/10" : undefined}>
                        <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">{item.script_group} {item.class_label}</td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.candidate_count}</td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.verified_count}</td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.approved_pending_count}</td>
                        <td className="px-3 py-3"><StatusPill status={item.readiness_status} /></td>
                        <td className="px-3 py-3">{item.is_blocking_training ? <StatusPill status="missing" /> : <StatusPill status="ready" />}</td>
                        <td className="px-3 py-3">
                          <div className="h-2 w-28 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{item.recommended_action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredReadinessClasses.length === 0 ? <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No classes match these filters.</div> : null}
            </div>
            <Pagination currentPage={Math.min(classPage, readinessTotalPages)} totalPages={readinessTotalPages} onPageChange={setClassPage} />
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Latest Smoke Status" action={<Link className="text-sm font-medium text-brand-600" href="/system/ml-training/jobs">View all</Link>}>
          {latestSmoke ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><StatusPill status={latestSmoke.status} /><span className="text-gray-700 dark:text-gray-300">{latestSmoke.current_stage}</span></div>
              <div className="font-mono text-xs text-gray-500 dark:text-gray-400">{latestSmoke.id}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>Progress: {formatPercent(latestSmoke.progress_percentage)}</div>
                <div>Executor: {latestSmoke.executor_type}</div>
                <div>Instance: {latestSmoke.external_job_id || "-"}</div>
                <div>Finished: {formatDate(latestSmoke.finished_at)}</div>
              </div>
            </div>
          ) : loading ? <LoadingBlock /> : <div className="text-sm text-gray-500 dark:text-gray-400">No smoke jobs found.</div>}
        </Panel>

        <Panel title="Training Trigger">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>Full training launch remains intentionally disabled until the verified dataset gate passes, dry-run promotion is reviewed, and backend execution is explicitly approved.</p>
            <p>Blocking classes: {globalDataset?.blocking_classes ?? "-"}. Threshold: {datasetReadiness?.target_min_count ?? 300} verified samples per focused class.</p>
            <Button disabled size="sm">Start Training Coming Soon</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function JobsTable({ jobs }: { jobs: MlTrainingJob[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Language</th>
            <th className="px-3 py-2">Stage</th>
            <th className="px-3 py-2">Progress</th>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Instance</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-3 py-3"><StatusPill status={job.status} /></td>
              <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{job.language_code || "-"}</td>
              <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{job.current_stage}</td>
              <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{formatPercent(job.progress_percentage)}</td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{formatDate(job.created_at)}</td>
              <td className="max-w-48 truncate px-3 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{job.external_job_id || "-"}</td>
              <td className="px-3 py-3 text-right">
                <Link className="text-sm font-medium text-brand-600" href={`/operations/ml-training/jobs/${job.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MLTrainingJobsPage() {
  const [jobs, setJobs] = useState<MlTrainingJob[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offset = (page - 1) * PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listMlTrainingJobs({
        status: statusFilter || undefined,
        language_code: languageFilter || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setJobs(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load ML training jobs.");
    } finally {
      setLoading(false);
    }
  }, [languageFilter, offset, statusFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Training Jobs" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Jobs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Queued, running, and completed ML training jobs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
      </div>
      {error ? <InlineError message={error} /> : null}
      <Panel title="Jobs">
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All statuses</option>
            {["queued", "running", "succeeded", "failed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={languageFilter} onChange={(event) => { setLanguageFilter(event.target.value); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All languages</option>
            <option value="yor">yor</option>
            <option value="eng">eng</option>
          </select>
        </div>
        {loading && jobs.length === 0 ? <LoadingBlock /> : jobs.length > 0 ? <JobsTable jobs={jobs} /> : <div className="text-sm text-gray-500 dark:text-gray-400">No jobs found.</div>}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </Panel>
    </div>
  );
}

function metadataFromJob(job: MlTrainingJob) {
  const params = job.parameters || {};
  return {
    executor: job.executor_type,
    lambda_instance_id: job.external_job_id,
    logs_path: job.logs_path,
    dataset_path: job.dataset_path,
    dataset_version: job.dataset_version,
    model_target: job.model_status_target,
    callback_token_redacted: params.callback_token_redacted === true,
  };
}

export function MLTrainingJobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id;
  const [job, setJob] = useState<MlTrainingJob | null>(null);
  const [events, setEvents] = useState<MlTrainingJobEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobData, logsData] = await Promise.all([getMlTrainingJob(jobId), getMlTrainingJobLogs(jobId)]);
      setJob(jobData);
      setEvents(logsData.events);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load training job.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Training Job Detail" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Job Detail</h1>
          <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{jobId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
      </div>
      {error ? <InlineError message={error} /> : null}
      {loading && !job ? <LoadingBlock /> : null}
      {job ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Status" value={job.status} detail={job.current_stage} />
            <SummaryCard label="Progress" value={formatPercent(job.progress_percentage)} />
            <SummaryCard label="Language" value={job.language_code || "-"} />
            <SummaryCard label="Attempts" value={`${job.attempt_count}/${job.max_attempts}`} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(0, Number(job.progress_percentage || 0)))}%` }} />
          </div>
          {job.error_message ? <InlineError message={job.error_message} /> : null}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Lambda Metadata"><JsonPreview value={metadataFromJob(job)} /></Panel>
            <Panel title="Timing">
              <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div>Queued: {formatDate(job.queued_at)}</div>
                <div>Started: {formatDate(job.started_at)}</div>
                <div>Heartbeat: {formatDate(job.heartbeat_at)}</div>
                <div>Finished: {formatDate(job.finished_at)}</div>
              </div>
            </Panel>
          </div>
          <Panel title="Events / Logs">
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusPill status={event.event_type} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{event.message}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(event.created_at)}</span>
                  </div>
                  {event.details ? <div className="mt-3"><JsonPreview value={event.details} /></div> : null}
                </div>
              ))}
              {events.length === 0 ? <div className="text-sm text-gray-500 dark:text-gray-400">No events recorded.</div> : null}
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

const MODEL_PAGE_SIZE = 20;

export function MLModelVersionsPage() {
  const [models, setModels] = useState<MlModelVersion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [pendingModelAction, setPendingModelAction] = useState<{ model: MlModelVersion; action: "promote" | "rollback" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listMlModelVersions({
        status: statusFilter || undefined,
        language_code: languageFilter || undefined,
        limit: MODEL_PAGE_SIZE,
        offset: page * MODEL_PAGE_SIZE,
      });
      setModels(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load model versions.");
    } finally {
      setLoading(false);
    }
  }, [languageFilter, statusFilter, page]);

  useEffect(() => {
    setPage(0);
  }, [languageFilter, statusFilter]);

  const runModelAction = useCallback(async (model: MlModelVersion, action: "promote" | "rollback") => {
    if (!model.id) return;
    setActionId(model.id);
    setError(null);
    setSuccess(null);
    try {
      const response = action === "promote"
        ? await promoteMlModelVersion(model.id)
        : await rollbackMlModelVersion(model.id);
      setSuccess(response.message);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? `Unable to ${action} model version.`);
    } finally {
      setActionId(null);
      setPendingModelAction(null);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Model Versions" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Model Versions</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Staging and production handwriting model registry entries.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
      </div>
      {error ? <InlineError message={error} /> : null}
      {success ? <InlineSuccess message={success} /> : null}
      <Panel title="Versions">
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All statuses</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
            <option value="archived">archived</option>
          </select>
          <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All languages</option>
            <option value="yor">yor</option>
            <option value="eng">eng</option>
          </select>
        </div>
        {loading && models.length === 0 ? <LoadingBlock /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Language</th>
                  <th className="px-3 py-2">Version</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Validation</th>
                  <th className="px-3 py-2">Test</th>
                  <th className="px-3 py-2">Samples</th>
                  <th className="px-3 py-2">Performance</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {models.map((model, index) => {
                  const busy = actionId === model.id;
                  const canPromote = Boolean(model.id) && model.status === "staging" && !busy;
                  const canRollback = Boolean(model.id) && model.status === "production" && !busy;
                  return (
                    <tr key={model.id || `${model.model_name}-${index}`}>
                      <td className="px-3 py-3"><StatusPill status={model.status} /></td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{model.language_code || "-"}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{model.version || "-"}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{model.model_name || model.model_type || "-"}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{formatMetricPercent(model.validation_accuracy)}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{formatMetricPercent(model.test_accuracy)}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{formatNumber(model.training_dataset_size)}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                        {formatMetricPercent(pickMetric(model.metrics, ["macro_f1", "f1_macro"]))}
                      </td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{formatDate(model.created_at)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Button
                            disabled={!canPromote}
                            size="sm"
                            variant="outline"
                            onClick={() => setPendingModelAction({ model, action: "promote" })}
                          >
                            {busy ? "Working..." : "Promote"}
                          </Button>
                          <Button
                            disabled={!canRollback}
                            size="sm"
                            variant="outline"
                            onClick={() => setPendingModelAction({ model, action: "rollback" })}
                          >
                            {busy ? "Working..." : "Rollback"}
                          </Button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {model.status === "production" ? "Rollback restores latest archived version after confirmation." : model.status === "staging" ? "Promotion is staging-only and requires backend checks." : "Only staging rows can be promoted from here."}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {models.length === 0 ? <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No model versions found.</div> : null}
          </div>
        )}
      </Panel>
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / MODEL_PAGE_SIZE)}
        onPageChange={(newPage) => setPage(newPage)}
      />
      <ConfirmationModal
        isOpen={!!pendingModelAction}
        onClose={() => setPendingModelAction(null)}
        onConfirm={() => {
          if (pendingModelAction) void runModelAction(pendingModelAction.model, pendingModelAction.action);
        }}
        title={pendingModelAction?.action === "promote" ? "Promote Model Version" : "Rollback Model Version"}
        message={`${pendingModelAction?.action === "promote" ? "Promote" : "Rollback"} ${pendingModelAction?.model.language_code || "unknown"} ${pendingModelAction?.model.version || pendingModelAction?.model.id || ""}? Use this only for safe staging/dev model rows.`}
        confirmText={pendingModelAction?.action === "promote" ? "Promote" : "Rollback"}
        variant="warning"
        isLoading={!!actionId}
      />
    </div>
  );
}

function countFor(manifest: { status_counts?: Record<string, number> } | null | undefined, status: string) {
  return manifest?.status_counts?.[status] ?? 0;
}

function TrainingPromotionPreview({ result }: { result: HandwritingPromotionResult }) {
  return (
    <div className="mt-4 space-y-4">
      <div className={`rounded-lg border p-4 text-sm ${result.valid ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"}`}>
        Dry-run status: {result.status}. Real apply is {result.apply_allowed ? "allowed after exact confirmation" : "blocked"}.
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Approved" value={result.approved_count} />
        <SummaryCard label="Would Copy" value={result.files_to_copy.length} />
        <SummaryCard label="Skipped" value={result.skipped_count} />
        <SummaryCard label="Errors" value={result.validation_errors.length} />
      </div>
      <Panel title="Files To Promote">
        {result.files_to_copy.length > 0 ? (
          <div className="max-h-72 overflow-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs dark:divide-gray-800">
              <thead>
                <tr className="text-left uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Destination</th>
                  <th className="px-3 py-2">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {result.files_to_copy.map((file, index) => (
                  <tr key={`${file.source_key}-${file.destination_key}-${index}`}>
                    <td className="break-all px-3 py-2 text-gray-700 dark:text-gray-300">{file.source_key || "-"}</td>
                    <td className="break-all px-3 py-2 text-gray-700 dark:text-gray-300">{file.destination_key || "-"}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{file.class_id || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-sm text-gray-500 dark:text-gray-400">No files are ready to promote.</div>}
      </Panel>
      <Panel title="Per-Class Impact">
        {result.per_class_impact.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Before</th>
                  <th className="px-3 py-2">Would Add</th>
                  <th className="px-3 py-2">After Apply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {result.per_class_impact.map((item) => (
                  <tr key={item.class_id}>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{item.language_code} / {item.class_id}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.before}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.would_add}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-sm text-gray-500 dark:text-gray-400">No class impact reported.</div>}
      </Panel>
      {result.validation_errors.length > 0 ? (
        <Panel title="Validation Errors"><JsonPreview value={result.validation_errors} /></Panel>
      ) : null}
    </div>
  );
}

// Deprecated naming: now uses DB-backed handwriting_candidates.
// Kept for backward compatibility with existing routes.
export function MLCandidateReviewManifestsPage() {
  const [manifests, setManifests] = useState<HandwritingCandidateManifest[]>([]);
  const [readiness, setReadiness] = useState<VerifiedPromotionReadinessResponse | null>(null);
  const [collectionGaps, setCollectionGaps] = useState<VerifiedPromotionCollectionGapResponse | null>(null);
  const [gapSearch, setGapSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLanguage, setUploadLanguage] = useState<"yor" | "eng">("eng");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadContributor, setUploadContributor] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadValidationErrors, setUploadValidationErrors] = useState<Record<string, unknown>[]>([]);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [manifestResponse, readinessResponse, gapResponse] = await Promise.all([
        listHandwritingCandidateManifests({ limit: 50, offset: 0 }),
        getVerifiedPromotionReadiness(300),
        getVerifiedPromotionCollectionGaps({ target_low: 300, target_high: 500 }),
      ]);
      setManifests(manifestResponse.items);
      setReadiness(readinessResponse);
      setCollectionGaps(gapResponse);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load handwriting candidate manifests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await createHandwritingCandidateManifest({
        language_code: "yor",
        source: "drawings",
        source_prefix: "drawings/yor/",
        dry_run: true,
        limit: 1000,
      });
      setSuccess(`Candidate import preview ready. ${Number(result.would_insert_candidates ?? result.detected_count ?? 0).toLocaleString()} drawing candidate(s) found under drawings/yor/.`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to preview candidate import.");
    } finally {
      setGenerating(false);
      setShowGenerateConfirm(false);
    }
  }, [refresh]);

  const uploadCandidates = useCallback(async () => {
    if (!uploadLabel.trim() || uploadFiles.length === 0) {
      setError("Choose a class label and at least one image.");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await uploadHandwritingCandidatesDb({
        language: uploadLanguage,
        class_label: uploadLabel,
        contributor_id: uploadContributor.trim() || undefined,
        files: uploadFiles,
      });
      const validationErrors = asRecordArray(result.validation_errors);
      setUploadValidationErrors(validationErrors);
      if (Number(result.uploaded_count ?? 0) > 0 && result.manifest_id) {
        setSuccess(`Uploaded ${result.uploaded_count ?? 0} candidate(s) into DB review manifest ${String(result.manifest_id)}; ${result.rejected_count ?? 0} rejected by validation.`);
      } else {
        setSuccess(`Uploaded ${result.uploaded_count ?? 0} candidate(s); ${result.rejected_count ?? 0} rejected by validation.`);
      }
      await refresh();
    } catch (err: any) {
      setUploadValidationErrors(asRecordArray(err?.response?.data?.detail?.validation_errors));
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to upload handwriting candidates.");
    } finally {
      setUploading(false);
    }
  }, [refresh, uploadContributor, uploadFiles, uploadLabel, uploadLanguage]);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Handwriting Candidate Review" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Handwriting Candidate Review</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Review raw handwriting samples before guarded promotion into datasets/training/*.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
          <Button size="sm" onClick={() => setShowGenerateConfirm(true)} disabled={generating}>{generating ? "Previewing..." : "Preview Drawings Import"}</Button>
        </div>
      </div>
      {error ? <InlineError message={error} /> : null}
      {success ? <InlineSuccess message={success} /> : null}
      <Panel title="Verified Readiness" action={<Link href="/system/ml-training" className="text-sm text-brand-600 hover:underline">ML Training overview</Link>}>
        <div className="grid gap-4 md:grid-cols-2">
          {(readiness?.languages || []).map((lang) => (
            <div key={lang.language} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold uppercase text-gray-900 dark:text-white">{lang.language}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">target {lang.threshold}/class</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SummaryCard label="Ready Classes" value={lang.ready_count} />
                <SummaryCard label="Gaps" value={lang.not_ready_count} />
              </div>
              <div className="mt-3 max-h-40 overflow-auto text-xs text-gray-600 dark:text-gray-300">
                {lang.priority_gaps.map((gap) => (
                  <div key={gap.label} className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
                    <span>{gap.label}</span><span>{gap.count}/{lang.threshold}</span>
                  </div>
                ))}
                {lang.priority_gaps.length === 0 ? "All priority classes ready." : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Missing / Low Sample Classes">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Focused collection targets for handwriting classes blocking the verified-data gate. Counts include reviewed manifest approvals as pending impact, but do not assume promotion has been applied.
          </div>
          <input
            value={gapSearch}
            onChange={(event) => setGapSearch(event.target.value)}
            placeholder="Search class..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Candidates</th>
                <th className="px-3 py-2">Approved Pending</th>
                <th className="px-3 py-2">Verified</th>
                <th className="px-3 py-2">Projected</th>
                <th className="px-3 py-2">Need 300</th>
                <th className="px-3 py-2">Need 500</th>
                <th className="px-3 py-2">Collection Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(collectionGaps?.items || []).filter((gap) => {
                if (!gapSearch.trim()) return true;
                const q = gapSearch.toLowerCase();
                return gap.label.toLowerCase().includes(q) || gap.language.toLowerCase().includes(q);
              }).map((gap) => (
                <tr key={`${gap.language}-${gap.label}`} className="text-gray-700 dark:text-gray-200">
                  <td className="px-3 py-2 font-medium">{gap.language} {gap.label}</td>
                  <td className="px-3 py-2">{gap.current_candidates}</td>
                  <td className="px-3 py-2">{gap.approved_pending_samples}</td>
                  <td className="px-3 py-2">{gap.verified_samples}</td>
                  <td className="px-3 py-2">{gap.projected_after_approved_apply}</td>
                  <td className="px-3 py-2">{gap.needed_to_300}</td>
                  <td className="px-3 py-2">{gap.needed_to_500}</td>
                  <td className="px-3 py-2 font-medium">{gap.collection_target}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {collectionGaps?.items.length === 0 ? <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No focused collection gaps available.</div> : null}
        </div>
      </Panel>
      <Panel title="Candidate Upload">
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          Upload stores files as review candidates only. It never writes directly to datasets/training/* and does not make samples available for training until they are reviewed and promoted.
        </div>
        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_2fr_auto]">
          <select value={uploadLanguage} onChange={(event) => setUploadLanguage(event.target.value as "yor" | "eng")} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="eng">English</option>
            <option value="yor">Yoruba</option>
          </select>
          <input value={uploadLabel} onChange={(event) => setUploadLabel(event.target.value)} placeholder="Class label, e.g. F or ẹ́" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <input value={uploadContributor} onChange={(event) => setUploadContributor(event.target.value)} placeholder="Contributor/session (optional)" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setUploadFiles(Array.from(event.target.files || []))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <Button size="sm" onClick={() => void uploadCandidates()} disabled={uploading || uploadFiles.length === 0}>
            {uploading ? "Uploading..." : "Upload Candidates"}
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Selected files: {uploadFiles.length}. After upload, review them in the manifest detail page before promotion.
        </div>
        {uploadValidationErrors.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="font-medium">Upload validation errors</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {uploadValidationErrors.map((item, index) => (
                <li key={`${item.filename}-${item.error}-${index}`}>
                  {String(item.filename ?? "file")}: {String(item.error ?? "validation_failed")}
                  {item.details ? ` (${JSON.stringify(item.details)})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>
      <Panel title="Manifests">
        {loading && manifests.length === 0 ? <LoadingBlock /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Manifest</th>
                  <th className="px-3 py-2">Candidates</th>
                  <th className="px-3 py-2">Approved</th>
                  <th className="px-3 py-2">Rejected</th>
                  <th className="px-3 py-2">Pending</th>
                  <th className="px-3 py-2">Validation</th>
                  <th className="px-3 py-2">Apply</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {manifests.map((manifest) => (
                  <tr key={manifest.id}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{manifest.id}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(manifest.created_at)}</div>
                    </td>
                    <td className="px-3 py-3">{Number(manifest.summary?.inserted_count ?? manifest.summary?.detected_count ?? 0)}</td>
                    <td className="px-3 py-3">{countFor(manifest, "approved")}</td>
                    <td className="px-3 py-3">{countFor(manifest, "rejected")}</td>
                    <td className="px-3 py-3">{countFor(manifest, "pending")}</td>
                    <td className="px-3 py-3"><StatusPill status={manifest.status} /></td>
                    <td className="px-3 py-3"><StatusPill status="not_applied" /></td>
                    <td className="px-3 py-3">
                      <Link href={`/operations/ml-training/manifests/${manifest.id}`} className="text-brand-600 hover:underline">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {manifests.length === 0 ? <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No manifests found.</div> : null}
          </div>
        )}
      </Panel>
      <ConfirmationModal
        isOpen={showGenerateConfirm}
        onClose={() => setShowGenerateConfirm(false)}
        onConfirm={() => void generate()}
        title="Preview Drawings Import"
        message="Preview candidate import from drawings/yor/? This is read-only and will not promote samples or run training."
        confirmText="Preview Import"
        variant="info"
        isLoading={generating}
      />
    </div>
  );
}

function CandidatePreview({ candidate }: { candidate: HandwritingCandidate }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getHandwritingCandidatePreview(candidate.id);
      setUrl(response.preview_url);
    } finally {
      setLoading(false);
    }
  }, [candidate.id]);

  return (
    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={candidate.final_label || candidate.raw_label || "candidate"} loading="lazy" className="max-h-full max-w-full object-contain" />
      ) : (
        <button onClick={() => void load()} className="px-2 text-xs text-brand-600 hover:underline" disabled={loading}>
          {loading ? "Loading..." : "Preview"}
        </button>
      )}
    </div>
  );
}

// Deprecated naming: now uses DB-backed handwriting_candidates.
// Kept for backward compatibility with existing routes.
export function MLCandidateReviewManifestDetailPage() {
  const params = useParams<{ id: string }>();
  const manifestId = String(params?.id || "");
  const [manifest, setManifest] = useState<HandwritingCandidateManifest | null>(null);
  const [candidates, setCandidates] = useState<HandwritingCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [language, setLanguage] = useState("");
  const [label, setLabel] = useState("");
  const [caseGroup, setCaseGroup] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [conflictOnly, setConflictOnly] = useState(false);
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [promotionResult, setPromotionResult] = useState<HandwritingPromotionResult | null>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [applyConfirmationText, setApplyConfirmationText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleUpdateConfirm, setVisibleUpdateConfirm] = useState<{ ids: string[]; status: "pending" | "approved" | "rejected" } | null>(null);
  const limit = 25;

  // Vision labeling state
  const [providers, setProviders] = useState<VisionProvidersResponse | null>(null);
  const [visionEstimate, setVisionEstimate] = useState<VisionJobEstimate | null>(null);
  const [visionEstimateLoading, setVisionEstimateLoading] = useState(false);
  const [visionJobLoading, setVisionJobLoading] = useState(false);
  const [visionConfirmOpen, setVisionConfirmOpen] = useState(false);
  const [visionConfirmationText, setVisionConfirmationText] = useState("");
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [usingSuggestionId, setUsingSuggestionId] = useState<string | null>(null);
  const [visionProvider, setVisionProvider] = useState<string>("openai");

  const refresh = useCallback(async () => {
    if (!manifestId) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, candidateResponse] = await Promise.all([
        getHandwritingCandidateManifest(manifestId),
        listHandwritingCandidates({
          manifest_id: manifestId,
          language_code: language || undefined,
          case_group: (caseGroup || undefined) as "LOWER_CASE" | "UPPER_CASE" | undefined,
          label: label || undefined,
          review_status: (reviewStatus || undefined) as "pending" | "approved" | "rejected" | undefined,
          conflict_only: conflictOnly,
          duplicate_only: duplicateOnly,
          limit,
          offset,
        }),
      ]);
      setManifest(detail);
      setCandidates(candidateResponse.items);
      setTotal(candidateResponse.total);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load candidate manifest.");
    } finally {
      setLoading(false);
    }
  }, [caseGroup, conflictOnly, duplicateOnly, label, language, manifestId, offset, reviewStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadProviders = useCallback(async () => {
    try {
      const result = await getHandwritingVisionProviders();
      setProviders(result);
    } catch {
      // Providers unavailable, UI shows disabled
    }
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const runVisionEstimate = useCallback(async () => {
    setVisionEstimateLoading(true);
    setError(null);
    try {
      const provider = visionProvider || "openai";
      const model = provider === "deepseek" ? "deepseek-chat" : "gpt-4.1-mini";
      const result = await estimateHandwritingVisionJob({
        provider: provider as "openai" | "deepseek",
        model,
        manifest_id: manifestId,
        language_code: (manifest?.language_code as "yor" | "eng") ?? "yor",
        filters: { review_status: "pending", vision_status: "not_requested" },
        max_candidates: 50,
        mode: "batch",
      });
      setVisionEstimate(result);
      if (result.requires_confirmation) {
        setVisionConfirmOpen(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to estimate vision job.");
    } finally {
      setVisionEstimateLoading(false);
    }
  }, [manifestId, manifest?.language_code, visionProvider]);

  const runVisionJob = useCallback(async () => {
    setVisionJobLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const provider = visionProvider || "openai";
      const model = provider === "deepseek" ? "deepseek-chat" : "gpt-4.1-mini";
      await createHandwritingVisionJob({
        provider: provider as "openai" | "deepseek",
        model,
        manifest_id: manifestId,
        language_code: (manifest?.language_code as "yor" | "eng") ?? "yor",
        filters: { review_status: "pending", vision_status: "not_requested" },
        max_candidates: 50,
        mode: "batch",
        confirmation: visionConfirmationText || undefined,
      });
      setSuccess("Vision label job created. Check Vision Jobs page for status.");
      setVisionConfirmOpen(false);
      setVisionConfirmationText("");
      setVisionEstimate(null);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to create vision job.");
    } finally {
      setVisionJobLoading(false);
    }
  }, [manifestId, manifest?.language_code, visionConfirmationText, visionProvider, refresh]);

  const runSingleSuggestion = useCallback(async (candidateId: string) => {
    setSuggestingId(candidateId);
    setError(null);
    setSuccess(null);
    try {
      const result = await suggestHandwritingCandidateLabel(candidateId);
      setSuccess(`Vision suggestion ready. Label: ${result.suggestion.predicted_label ?? "unknown"} (confidence: ${result.suggestion.confidence ?? "-"})`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Vision suggestion failed.");
    } finally {
      setSuggestingId(null);
    }
  }, [refresh]);

  const runUseSuggestion = useCallback(async (candidateId: string) => {
    setUsingSuggestionId(candidateId);
    setError(null);
    setSuccess(null);
    try {
      const result = await acceptHandwritingVisionSuggestion(candidateId, true);
      setSuccess(`Suggestion applied: ${result.final_label} (${result.final_case_group}). ${result.note ?? ""}`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to apply suggestion.");
    } finally {
      setUsingSuggestionId(null);
    }
  }, [refresh]);

  const openaiEnabled = useMemo(
    () => providers?.providers?.some((p) => p.name === "openai" && p.enabled) ?? false,
    [providers]
  );
  const deepseekEnabled = useMemo(
    () => providers?.providers?.some((p) => p.name === "deepseek" && p.enabled) ?? false,
    [providers]
  );

  const updateVisible = useCallback(async (status: "pending" | "approved" | "rejected", candidateIds?: string[], confirmed = false) => {
    const ids = candidateIds || candidates.map((candidate) => candidate.id);
    if (ids.length === 0) return;
    if (candidateIds === undefined && !confirmed) {
      setVisibleUpdateConfirm({ ids, status });
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const response = await bulkUpdateHandwritingCandidates({ candidate_ids: ids, review_status: status });
      setSuccess(`Updated ${response.updated} candidate(s).`);
      setVisibleUpdateConfirm(null);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to update candidates.");
    }
  }, [candidates, refresh]);

  const selectedCandidateIds = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const approvedCount = manifest ? countFor(manifest, "approved") : 0;
  const applyAllowed = promotionResult?.mode === "dry_run" && promotionResult.valid && promotionResult.apply_allowed && countFor(manifest, "pending") === 0;

  const runPromotionDryRun = useCallback(async () => {
    setPromotionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await dryRunHandwritingCandidatePromotion(manifestId);
      setPromotionResult(result);
      setSuccess("Promotion dry-run completed.");
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to run promotion dry-run.");
    } finally {
      setPromotionLoading(false);
    }
  }, [manifestId, refresh]);

  const runPromotionApply = useCallback(async () => {
    setPromotionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await applyHandwritingCandidatePromotion(manifestId, { confirmation: applyConfirmationText });
      setPromotionResult(result);
      setSuccess(`Promotion apply completed. Copied ${result.copied_count} file(s).`);
      setApplyConfirmOpen(false);
      setApplyConfirmationText("");
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to apply promotion.");
    } finally {
      setPromotionLoading(false);
    }
  }, [applyConfirmationText, manifestId, refresh]);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Candidate Manifest Review" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{manifestId}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Approve, reject, or correct raw candidates. Promotion into datasets/training/* remains a separate guarded phase.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
      </div>
      {error ? <InlineError message={error} /> : null}
      {success ? <InlineSuccess message={success} /> : null}
      {manifest ? (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Candidates" value={total} />
          <SummaryCard label="Approved" value={countFor(manifest, "approved")} />
          <SummaryCard label="Rejected" value={countFor(manifest, "rejected")} />
          <SummaryCard label="Pending" value={countFor(manifest, "pending")} />
        </div>
      ) : null}
      <Panel title="Vision Labeling">
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
          Vision suggestions assist review, not replace it. Suggestions never auto-approve or auto-promote candidates.
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <SummaryCard label="OpenAI" value={openaiEnabled ? "Enabled" : "Disabled"} detail={openaiEnabled ? "gpt-4.1-mini" : "OPENAI_API_KEY missing"} />
          <SummaryCard label="DeepSeek" value={deepseekEnabled ? "Enabled" : "Disabled"} detail={providers?.providers?.find((p) => p.name === "deepseek")?.disabled_reason || "No image endpoint"} />
          <SummaryCard label="Suggestions" value="Manual only" detail="Dashboard-initiated, never auto-run" />
        </div>
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={visionProvider} onChange={(event) => setVisionProvider(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            {openaiEnabled ? <option value="openai">OpenAI (gpt-4.1-mini)</option> : null}
            {deepseekEnabled ? <option value="deepseek">DeepSeek (deepseek-chat)</option> : null}
            {!openaiEnabled && !deepseekEnabled ? <option value="">No provider enabled</option> : null}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void runVisionEstimate()} disabled={!openaiEnabled && !deepseekEnabled || visionEstimateLoading}>
            {visionEstimateLoading ? "Estimating..." : "Estimate Vision Labels"}
          </Button>
          {visionEstimate ? (
            <Button size="sm" onClick={() => setVisionConfirmOpen(true)} disabled={!openaiEnabled && !deepseekEnabled || visionJobLoading || visionEstimate.blocked}>
              {visionJobLoading ? "Creating..." : "Create Vision Label Job"}
            </Button>
          ) : null}
        </div>
        {visionEstimate ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Estimate</h3>
            <div className="mt-2 grid gap-2 text-sm text-gray-700 dark:text-gray-300 md:grid-cols-3">
              <div><span className="font-medium">Candidates:</span> {visionEstimate.candidate_count}</div>
              <div><span className="font-medium">Cost:</span> ${visionEstimate.estimated_cost.low.toFixed(3)}–${visionEstimate.estimated_cost.high.toFixed(3)} USD</div>
              <div><span className="font-medium">Confirmation:</span> {visionEstimate.requires_confirmation ? "Required" : "Not required"}</div>
            </div>
            {visionEstimate.blocked ? (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">Blocked: {visionEstimate.blocked_reason}</div>
            ) : null}
          </div>
        ) : null}
      </Panel>
      <Panel title="Promotion Guardrails">
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Promotion writes approved candidates to datasets/training/*. Pending candidates block apply. Rejected candidates are never promoted.
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void runPromotionDryRun()} disabled={promotionLoading || approvedCount === 0}>
            {promotionLoading ? "Working..." : "Dry-run Promotion"}
          </Button>
          <Button size="sm" onClick={() => setApplyConfirmOpen(true)} disabled={promotionLoading || !applyAllowed}>
            Apply Approved Promotion
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Approved" value={approvedCount} />
          <SummaryCard label="Promotion" value={applyAllowed ? "Apply Ready" : "Guarded"} detail={applyAllowed ? "Exact confirmation required" : "Run a valid dry-run first"} />
          <SummaryCard label="Target" value="datasets/training/*" detail="Copy only, never move" />
        </div>
        {promotionResult ? <TrainingPromotionPreview result={promotionResult} /> : null}
      </Panel>
      <Panel title="Candidates">
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={language} onChange={(event) => { setOffset(0); setLanguage(event.target.value); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All languages</option><option value="yor">yor</option><option value="eng">eng</option>
          </select>
          <select value={reviewStatus} onChange={(event) => { setOffset(0); setReviewStatus(event.target.value); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All statuses</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option>
          </select>
          <select value={caseGroup} onChange={(event) => { setOffset(0); setCaseGroup(event.target.value); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All case groups</option><option value="LOWER_CASE">LOWER_CASE</option><option value="UPPER_CASE">UPPER_CASE</option>
          </select>
          <input value={label} onChange={(event) => { setOffset(0); setLabel(event.target.value); }} placeholder="Label" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={conflictOnly} onChange={(event) => { setOffset(0); setConflictOnly(event.target.checked); }} /> Conflicts</label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={duplicateOnly} onChange={(event) => { setOffset(0); setDuplicateOnly(event.target.checked); }} /> Duplicates</label>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setVisibleUpdateConfirm({ ids: selectedCandidateIds, status: "approved" })} disabled={selectedCandidateIds.length === 0}>Approve Selected</Button>
          <Button variant="outline" size="sm" onClick={() => setVisibleUpdateConfirm({ ids: selectedCandidateIds, status: "rejected" })} disabled={selectedCandidateIds.length === 0}>Reject Selected</Button>
          <Button variant="outline" size="sm" onClick={() => setVisibleUpdateConfirm({ ids: selectedCandidateIds, status: "pending" })} disabled={selectedCandidateIds.length === 0}>Reset Selected</Button>
          <Button variant="outline" size="sm" onClick={() => void updateVisible("approved")}>Approve Visible</Button>
        </div>
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-4 md:flex-row">
                <CandidatePreview candidate={candidate} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(candidate.id)}
                      onChange={(event) => {
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          if (event.target.checked) next.add(candidate.id);
                          else next.delete(candidate.id);
                          return next;
                        });
                      }}
                    />
                    <StatusPill status={candidate.review_status} />
                    {candidate.quality_flags?.label_conflict ? <StatusPill status="conflict" /> : null}
                    <span className="font-semibold text-gray-900 dark:text-white">{candidate.language_code} / {candidate.final_case_group || candidate.suggested_case_group || "-"} / {candidate.final_label || candidate.suggested_label || candidate.raw_label || "-"}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{candidate.source_type}</span>
                  </div>
                  <div className="mt-2 break-all text-xs text-gray-500 dark:text-gray-400">{candidate.source_key}</div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    vision {candidate.vision_status || "not_requested"} · confidence {candidate.vision_confidence ?? "-"}
                    {candidate.suggested_label ? (
                      <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">
                        AI: {candidate.suggested_case_group}/{candidate.suggested_label}
                      </span>
                    ) : null}
                    {candidate.vision_suggestion ? (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        {((candidate.vision_suggestion as Record<string, unknown>)?.review_recommendation as string) || ""}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(candidate.quality_flags || {}).filter(([, value]) => Boolean(value)).map(([flag]) => <span key={flag} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{flag}</span>)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-row gap-2 md:flex-col">
                  <Button size="sm" variant="outline" onClick={() => void updateVisible("approved", [candidate.id], true)}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => void updateVisible("rejected", [candidate.id], true)}>Reject</Button>
                  <Button size="sm" variant="outline" onClick={() => void updateVisible("pending", [candidate.id], true)}>Pending</Button>
                  {(openaiEnabled || deepseekEnabled) ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => void runSingleSuggestion(candidate.id)} disabled={suggestingId === candidate.id}>
                        {suggestingId === candidate.id ? "..." : "Suggest"}
                      </Button>
                      {candidate.vision_status === "completed" && candidate.suggested_label ? (
                        <Button size="sm" variant="outline" onClick={() => void runUseSuggestion(candidate.id)} disabled={usingSuggestionId === candidate.id}>
                          {usingSuggestionId === candidate.id ? "..." : "Use Suggestion"}
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {loading ? <LoadingBlock /> : null}
          {!loading && candidates.length === 0 ? <div className="text-sm text-gray-500 dark:text-gray-400">No candidates match these filters.</div> : null}
        </div>
        <div className="mt-4">
          <Pagination currentPage={Math.floor(offset / limit) + 1} totalPages={Math.max(1, Math.ceil(total / limit))} onPageChange={(page) => setOffset((page - 1) * limit)} />
        </div>
      </Panel>
      <ConfirmationModal
        isOpen={!!visibleUpdateConfirm}
        onClose={() => setVisibleUpdateConfirm(null)}
        onConfirm={() => {
          if (visibleUpdateConfirm) void updateVisible(visibleUpdateConfirm.status, visibleUpdateConfirm.ids, true);
        }}
        title="Update Visible Candidates"
        message={`Set ${visibleUpdateConfirm?.ids.length || 0} visible candidates to ${visibleUpdateConfirm?.status || "pending"}?`}
        confirmText="Update Candidates"
        variant="warning"
        isLoading={loading}
      />
      <Modal
        isOpen={applyConfirmOpen}
        onClose={() => {
          if (!promotionLoading) {
            setApplyConfirmOpen(false);
            setApplyConfirmationText("");
          }
        }}
        title="Apply training dataset promotion"
        maxWidth="md"
        showCloseButton={!promotionLoading}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            This copies approved candidate images into datasets/training/*. It does not run training.
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type exactly <span className="font-mono">PROMOTE {manifestId}</span>
          </label>
          <input
            value={applyConfirmationText}
            onChange={(event) => setApplyConfirmationText(event.target.value)}
            placeholder={`PROMOTE ${manifestId}`}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setApplyConfirmOpen(false);
                setApplyConfirmationText("");
              }}
              disabled={promotionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void runPromotionApply()}
              disabled={promotionLoading || applyConfirmationText !== `PROMOTE ${manifestId}`}
            >
              Apply Promotion
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={visionConfirmOpen}
        onClose={() => {
          if (!visionJobLoading) {
            setVisionConfirmOpen(false);
            setVisionConfirmationText("");
          }
        }}
        title="Create Vision Label Job"
        maxWidth="md"
        showCloseButton={!visionJobLoading}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            This sends candidate images to OpenAI for handwriting label suggestions. Estimated cost: ${visionEstimate?.estimated_cost.low.toFixed(3)}–${visionEstimate?.estimated_cost.high.toFixed(3)} USD.
            Suggestions do not approve or promote candidates.
          </div>
          {visionEstimate?.requires_confirmation ? (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type exactly <span className="font-mono">VISION LABEL {manifestId}</span>
              </label>
              <input
                value={visionConfirmationText}
                onChange={(event) => setVisionConfirmationText(event.target.value)}
                placeholder={`VISION LABEL ${manifestId}`}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVisionConfirmOpen(false);
                setVisionConfirmationText("");
              }}
              disabled={visionJobLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void runVisionJob()}
              disabled={
                visionJobLoading ||
                (visionEstimate?.requires_confirmation === true &&
                  visionConfirmationText !== `VISION LABEL ${manifestId}`)
              }
            >
              Create Vision Job
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function MLVisionJobsPage() {
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [providers, setProviders] = useState<VisionProvidersResponse | null>(null);
  const limit = 20;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providersResult] = await Promise.all([
        getHandwritingVisionProviders().catch(() => ({ providers: [] })),
      ]);
      setProviders(providersResult);
      const { listHandwritingVisionJobs } = await import("@/lib/adminMlApi");
      const result = await listHandwritingVisionJobs({
        status: statusFilter || undefined,
        provider: providerFilter || undefined,
        limit,
        offset,
      });
      setJobs(result.items.map((item) => ({ ...item })));
      setTotal(result.total);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load vision jobs.");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, statusFilter, providerFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCancel = useCallback(async (jobId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const { cancelHandwritingVisionJob } = await import("@/lib/adminMlApi");
      await cancelHandwritingVisionJob(jobId);
      setSuccess(`Vision job ${jobId} cancelled.`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to cancel job.");
    }
  }, [refresh]);

  const handlePoll = useCallback(async (jobId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await pollHandwritingVisionJob(jobId);
      setSuccess(`Poll: ${result.status}${result.message ? ` - ${result.message}` : ""}`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to poll job.");
    }
  }, [refresh]);

  const handleImport = useCallback(async (jobId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await importHandwritingVisionJobResults(jobId);
      setSuccess(`Import: ${result.completed_count ?? 0} completed, ${result.failed_count ?? 0} failed`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to import results.");
    }
  }, [refresh]);

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Vision Label Jobs" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vision Label Jobs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Vision model labeling jobs for handwriting candidate review.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
      </div>
      {error ? <InlineError message={error} /> : null}
      {success ? <InlineSuccess message={success} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Providers</h3>
          <div className="mt-2 space-y-2">
            {providers?.providers?.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <StatusPill status={p.enabled ? "approved" : "rejected"} />
                <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {p.enabled ? `model: ${p.default_model}` : p.disabled_reason}
                </span>
              </div>
            )) || <div className="text-sm text-gray-500 dark:text-gray-400">Loading providers...</div>}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Info</h3>
          <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>Suggestions assist review, never auto-approve.</p>
            <p>Batch mode preferred for cost savings (50% discount).</p>
            <p>Sync mode available for single-candidate suggestions.</p>
          </div>
        </div>
      </div>
      <Panel title="Jobs">
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(event) => { setOffset(0); setStatusFilter(event.target.value); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All statuses</option>
            <option value="queued">queued</option>
            <option value="running">running</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <select value={providerFilter} onChange={(event) => { setOffset(0); setProviderFilter(event.target.value); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">All providers</option>
            <option value="openai">openai</option>
            <option value="deepseek">deepseek</option>
          </select>
        </div>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={String(job.id)} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={String(job.status)} />
                <span className="font-semibold text-gray-900 dark:text-white">{String(job.provider)} / {String(job.model)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{String(job.mode)}</span>
                {job.manifest_id ? <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{String(job.manifest_id).slice(0, 8)}...</span> : null}
              </div>
              <div className="mt-2 grid gap-2 text-sm text-gray-700 dark:text-gray-300 md:grid-cols-3">
                <div><span className="font-medium">Requested:</span> {Number(job.request_count)}</div>
                <div><span className="font-medium">Completed:</span> {Number(job.completed_count)}</div>
                <div><span className="font-medium">Failed:</span> {Number(job.failed_count)}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.created_at ? <span className="text-xs text-gray-500 dark:text-gray-400">Created: {formatDate(String(job.created_at))}</span> : null}
                {job.completed_at ? <span className="text-xs text-gray-500 dark:text-gray-400">Completed: {formatDate(String(job.completed_at))}</span> : null}
              </div>
              {job.error_message ? (
                <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-500/20 dark:text-red-200">{String(job.error_message)}</div>
              ) : null}
              {job.provider_batch_id ? (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Batch: {String(job.provider_batch_id).slice(0, 30)}...</div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/system/ml-training/vision-jobs/${String(job.id)}`} className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-2 text-xs bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600">View</Link>
                {String(job.status) === "queued" || String(job.status) === "running" ? (
                  <Button size="sm" variant="outline" onClick={() => void handleCancel(String(job.id))}>Cancel</Button>
                ) : null}
                {String(job.status) === "queued" || String(job.status) === "running" ? (
                  <Button size="sm" variant="outline" onClick={() => void handlePoll(String(job.id))}>Poll</Button>
                ) : null}
                {(String(job.status) === "completed" || String(job.status) === "running") && job.provider_batch_id ? (
                  <Button size="sm" variant="outline" onClick={() => void handleImport(String(job.id))}>Import Results</Button>
                ) : null}
              </div>
            </div>
          ))}
          {loading ? <LoadingBlock /> : null}
          {!loading && jobs.length === 0 ? <div className="text-sm text-gray-500 dark:text-gray-400">No vision jobs found.</div> : null}
        </div>
        <div className="mt-4">
          <Pagination currentPage={Math.floor(offset / limit) + 1} totalPages={Math.max(1, Math.ceil(total / limit))} onPageChange={(page) => setOffset((page - 1) * limit)} />
        </div>
      </Panel>
    </div>
  );
}

export function MLVisionJobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = String(params?.id || "");
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHandwritingVisionJob(jobId);
      setJob(result as unknown as Record<string, unknown>);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to load job.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handlePoll = useCallback(async () => {
    setError(null);
    try {
      const result = await pollHandwritingVisionJob(jobId);
      setSuccess(`Poll: ${result.status}${result.message ? ` - ${result.message}` : ""}`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to poll.");
    }
  }, [jobId, refresh]);

  const handleImport = useCallback(async () => {
    setError(null);
    try {
      const result = await importHandwritingVisionJobResults(jobId);
      setSuccess(`Import: ${result.completed_count ?? 0} completed, ${result.failed_count ?? 0} failed`);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to import.");
    }
  }, [jobId, refresh]);

  const handleCancel = useCallback(async () => {
    setError(null);
    try {
      const { cancelHandwritingVisionJob } = await import("@/lib/adminMlApi");
      await cancelHandwritingVisionJob(jobId);
      setSuccess("Job cancelled.");
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message ?? err?.message ?? "Unable to cancel.");
    }
  }, [jobId, refresh]);

  const items = (Array.isArray(job?.items) ? job.items : []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6 p-6">
      <PageBreadCrumb pageTitle="Vision Job Detail" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            <Link href="/system/ml-training/vision-jobs" className="text-brand-500 hover:underline">Vision Jobs</Link>
            {" / "}{jobId.slice(0, 8)}...
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
          {String(job?.status) === "queued" || String(job?.status) === "running" ? (
            <Button variant="outline" size="sm" onClick={() => void handlePoll()}>Poll</Button>
          ) : null}
          {(String(job?.status) === "completed" || String(job?.status) === "running") && job?.provider_batch_id ? (
            <Button variant="outline" size="sm" onClick={() => void handleImport()}>Import Results</Button>
          ) : null}
          {String(job?.status) === "queued" || String(job?.status) === "running" ? (
            <Button variant="outline" size="sm" onClick={() => void handleCancel()}>Cancel</Button>
          ) : null}
        </div>
      </div>
      {error ? <InlineError message={error} /> : null}
      {success ? <InlineSuccess message={success} /> : null}
      {loading ? <LoadingBlock /> : null}
      {!loading && job ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Status" value={String(job.status)} />
            <SummaryCard label="Provider" value={`${String(job.provider)} / ${String(job.model)}`} />
            <SummaryCard label="Mode" value={String(job.mode)} />
            <SummaryCard label="Requested" value={String(job.request_count)} />
            <SummaryCard label="Completed" value={String(job.completed_count)} />
            <SummaryCard label="Failed" value={String(job.failed_count)} />
            <SummaryCard label="Created" value={formatDate(String(job.created_at || ""))} />
            <SummaryCard label="Completed at" value={formatDate(String(job.completed_at || null))} />
          </div>
          {job.manifest_id ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Manifest: <Link href={`/system/ml-training/manifests/${String(job.manifest_id)}`} className="text-brand-500 hover:underline">{String(job.manifest_id)}</Link>
            </div>
          ) : null}
          {job.provider_batch_id ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              OpenAI Batch: <span className="font-mono">{String(job.provider_batch_id)}</span>
            </div>
          ) : null}
          {job.estimated_cost ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Estimated cost: ${String((job.estimated_cost as Record<string, unknown>)?.low ?? "-")}–${String((job.estimated_cost as Record<string, unknown>)?.high ?? "-")} USD
            </div>
          ) : null}
          {job.error_message ? (
            <div className="rounded bg-red-100 p-3 text-sm text-red-800 dark:bg-red-500/20 dark:text-red-200">{String(job.error_message)}</div>
          ) : null}

          <Panel title={`Items (${items.length})`}>
            <div className="space-y-2">
              {items.map((item) => {
                const suggestion = item.parsed_suggestion as Record<string, unknown> | undefined;
                return (
                  <div key={String(item.id)} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={String(item.status)} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Candidate: {String(item.candidate_id).slice(0, 8)}...
                      </span>
                      {job.manifest_id ? (
                        <Link href={`/system/ml-training/manifests/${String(job.manifest_id)}`} className="text-xs text-brand-500 hover:underline">
                          View in manifest
                        </Link>
                      ) : null}
                    </div>
                    {suggestion ? (
                      <div className="mt-2 grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:grid-cols-3">
                        <div>Label: <span className="font-medium">{String(suggestion.predicted_label ?? "-")}</span></div>
                        <div>Case: <span className="font-medium">{String(suggestion.case_group ?? "-")}</span></div>
                        <div>Confidence: <span className="font-medium">{String(suggestion.confidence ?? "-")}</span></div>
                        <div className="md:col-span-2">Recommendation: <span className="font-medium">{String(suggestion.review_recommendation ?? "-")}</span></div>
                        <div>Reason: <span className="text-xs">{String(suggestion.reason ?? "-")}</span></div>
                      </div>
                    ) : item.status === "failed" && item.error_message ? (
                      <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-500/20 dark:text-red-200">{String(item.error_message)}</div>
                    ) : null}
                  </div>
                );
              })}
              {items.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No items found.</div>
              ) : null}
            </div>
          </Panel>
        </>
      ) : null}
      {!loading && !job ? <div className="text-sm text-gray-500 dark:text-gray-400">Job not found.</div> : null}
    </div>
  );
}
