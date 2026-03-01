"use client";

import React, { useMemo, useState } from 'react';

import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Alert from '@/components/ui/alert/SimpleAlert';
import StatusBadge from '@/components/admin/StatusBadge';
import { useAdminAuditLogList, useAdminCurriculumOpsMetrics } from '@/hooks/useApi';

function getResult(details: unknown): string {
  const d = details as any;
  return (d?.result || 'unknown') as string;
}

function getValidationStatus(details: unknown): string | null {
  const d = details as any;
  return typeof d?.validation_status === 'string' ? d.validation_status : null;
}

type Totals = {
  total: number;
  success: number;
  blocked: number;
  failed: number;
  unknown: number;
};

function resultBadge(result: string) {
  const r = (result || '').toLowerCase();
  if (r === 'success') return <StatusBadge status="success" label="Success" />;
  if (r === 'blocked') return <StatusBadge status="warning" label="Blocked" />;
  if (r === 'failed') return <StatusBadge status="error" label="Failed" />;
  return <StatusBadge status="info" label={result || 'unknown'} />;
}

export default function CurriculumOpsPage() {
  const [days, setDays] = useState(7);
  const { metrics, isLoading, isError, refresh } = useAdminCurriculumOpsMetrics(days);

  const [nowAnchorMs, setNowAnchorMs] = useState<number>(() => Date.now());
  const fromTs24h = useMemo(() => new Date(nowAnchorMs - 24 * 60 * 60 * 1000).toISOString(), [nowAnchorMs]);

  const courseAudit = useAdminAuditLogList({
    page: 1,
    limit: 200,
    action_prefix: 'course.',
    from_ts: fromTs24h,
  });

  const blueprintAudit = useAdminAuditLogList({
    page: 1,
    limit: 200,
    action_prefix: 'lesson_blueprint.',
    from_ts: fromTs24h,
  });

  const last24hItems = useMemo(() => {
    const a = courseAudit.data?.items ?? [];
    const b = blueprintAudit.data?.items ?? [];
    return [...a, ...b].sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
  }, [courseAudit.data?.items, blueprintAudit.data?.items]);

  const last24hSummary = useMemo(() => {
    let publishSuccess = 0;
    let publishBlocked = 0;
    let publishFailed = 0;
    const validationStatusCounts = new Map<string, number>();

    for (const item of last24hItems) {
      const action = item.action || '';
      const result = (getResult(item.details) || '').toLowerCase();
      const vs = getValidationStatus(item.details);

      if (vs) validationStatusCounts.set(vs, (validationStatusCounts.get(vs) || 0) + 1);

      if (action.endsWith('.publish')) {
        if (result === 'success') publishSuccess += 1;
        else if (result === 'blocked') publishBlocked += 1;
        else if (result === 'failed') publishFailed += 1;
      }
    }

    const topValidationStatuses = Array.from(validationStatusCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      publishSuccess,
      publishBlocked,
      publishFailed,
      topValidationStatuses,
    };
  }, [last24hItems]);

  const recentBlockedOrFailed = useMemo(() => {
    return last24hItems
      .filter((i) => {
        const r = (getResult(i.details) || '').toLowerCase();
        return r === 'blocked' || r === 'failed';
      })
      .slice(0, 20);
  }, [last24hItems]);

  const totals = useMemo((): Totals => {
    const rows = metrics?.rows ?? [];
    const t: Totals = { total: 0, success: 0, blocked: 0, failed: 0, unknown: 0 };
    for (const row of rows) {
      t.total += row.count;
      const r = (row.result || '').toLowerCase();
      if (r === 'success') t.success += row.count;
      else if (r === 'blocked') t.blocked += row.count;
      else if (r === 'failed') t.failed += row.count;
      else t.unknown += row.count;
    }
    return t;
  }, [metrics]);

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="error">
          Failed to load curriculum ops metrics. Please check your permissions and try again.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <PageBreadCrumb pageTitle="Curriculum Ops" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Audit-derived operational counts for validate/publish actions on courses and lesson blueprints.
          </p>
        </div>
        <button
          onClick={() => {
            setNowAnchorMs(Date.now());
            refresh();
            courseAudit.refresh();
            blueprintAudit.refresh();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Last 24h (from audit log)</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Window starts: {fromTs24h}</div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Publish — Success: <span className="font-medium text-gray-900 dark:text-white">{last24hSummary.publishSuccess}</span> | Blocked:{' '}
            <span className="font-medium text-gray-900 dark:text-white">{last24hSummary.publishBlocked}</span> | Failed:{' '}
            <span className="font-medium text-gray-900 dark:text-white">{last24hSummary.publishFailed}</span>
          </div>
        </div>

        {last24hSummary.topValidationStatuses.length > 0 && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            Top validation statuses: {' '}
            {last24hSummary.topValidationStatuses
              .map(([k, v]) => `${k} (${v})`)
              .join(' · ')}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-900 dark:text-white">Recent blocked/failed (last 24h)</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Showing up to 20 most recent.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Recent blocked/failed">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Time</th>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Action</th>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Result</th>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Target</th>
              </tr>
            </thead>
            <tbody>
              {(courseAudit.isLoading || blueprintAudit.isLoading) && (
                <tr>
                  <td className="p-6 text-gray-500 dark:text-gray-400" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              )}
              {!courseAudit.isLoading && !blueprintAudit.isLoading && recentBlockedOrFailed.length === 0 && (
                <tr>
                  <td className="p-6 text-gray-500 dark:text-gray-400" colSpan={4}>
                    No blocked/failed actions in this window.
                  </td>
                </tr>
              )}
              {recentBlockedOrFailed.map((row) => (
                <tr key={row.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-4 text-gray-900 dark:text-white font-mono">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-mono">{row.action}</td>
                  <td className="p-4">{resultBadge(getResult(row.details))}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-mono">
                    {row.target_type}:{' '}
                    {row.target_id || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="curriculumOpsDays"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Time Range
            </label>
            <select
              id="curriculumOpsDays"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Window: <span className="text-gray-900 dark:text-white">{metrics?.window_days ?? days} days</span>
            </div>
          </div>
          <div className="flex items-end">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total: <span className="text-gray-900 dark:text-white">{totals.total}</span>
            </div>
          </div>
          <div className="flex items-end">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Success: <span className="text-gray-900 dark:text-white">{totals.success}</span> | Blocked:{' '}
              <span className="text-gray-900 dark:text-white">{totals.blocked}</span> | Failed:{' '}
              <span className="text-gray-900 dark:text-white">{totals.failed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Day</th>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Action</th>
                <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Result</th>
                <th className="text-right p-4 font-medium text-gray-900 dark:text-white">Count</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="p-6 text-gray-500 dark:text-gray-400" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && (metrics?.rows?.length ?? 0) === 0 && (
                <tr>
                  <td className="p-6 text-gray-500 dark:text-gray-400" colSpan={4}>
                    No metrics in this window.
                  </td>
                </tr>
              )}
              {(metrics?.rows ?? []).map((row, idx) => (
                <tr key={`${row.day}-${row.action}-${row.result}-${idx}`} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-4 text-gray-900 dark:text-white font-mono">{row.day}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-mono">{row.action}</td>
                  <td className="p-4">{resultBadge(row.result)}</td>
                  <td className="p-4 text-right text-gray-900 dark:text-white">{row.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
