'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Pagination from '@/components/tables/Pagination';
import { useToast } from '@/contexts/ToastContext';
import { listDailyContentFeed, getAudienceTrend } from '@/lib/notificationsApi';
import type { DailyContentFeedItem, AudienceSnapshotItem } from '@/types/notifications';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function openRate(item: DailyContentFeedItem): number {
  if (item.sent_count === 0) return 0;
  return Math.round((item.open_count / item.sent_count) * 100);
}

export default function DailyContentNotificationsPage() {
  const toast = useToast();
  const [feed, setFeed] = useState<DailyContentFeedItem[]>([]);
  const [trend, setTrend] = useState<AudienceSnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [feedItems, trendItems] = await Promise.all([
        listDailyContentFeed({ limit: 200, offset: 0 }),
        getAudienceTrend({ days: 30 }),
      ]);
      setFeed(feedItems);
      // Trend comes back most-recent-first; charts read left-to-right.
      setTrend([...trendItems].reverse());
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? error?.message ?? 'Failed to load daily content data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalDays = feed.length;
  const totalSent = feed.reduce((sum, item) => sum + item.sent_count, 0);
  const totalOpens = feed.reduce((sum, item) => sum + item.open_count, 0);
  const totalFailed = feed.reduce((sum, item) => sum + item.failed_count, 0);
  const overallOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;

  const totalPages = Math.max(1, Math.ceil(totalDays / limit));
  const pageItems = useMemo(
    () => feed.slice((page - 1) * limit, page * limit),
    [feed, page, limit]
  );
  const pageStart = totalDays === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = totalDays === 0 ? 0 : Math.min(page * limit, totalDays);

  const chartOptions: ApexOptions = {
    chart: { fontFamily: 'Outfit, sans-serif', height: 280, type: 'area', toolbar: { show: false } },
    colors: ['#465FFF', '#9CB9FF', '#34D399'],
    stroke: { curve: 'smooth', width: [2, 2, 2] },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0 } },
    markers: { size: 0, hover: { size: 5 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'top', horizontalAlign: 'left' },
    xaxis: {
      type: 'category',
      categories: trend.map((t) => formatDate(t.snapshot_date)),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '12px', colors: ['#6B7280'] } } },
    tooltip: { enabled: true },
  };
  const chartSeries = [
    { name: 'Total eligible', data: trend.map((t) => t.total_eligible) },
    { name: 'Android', data: trend.map((t) => t.android_eligible) },
    { name: 'iOS', data: trend.map((t) => t.ios_eligible) },
  ];

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Daily Content Notifications" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Days Sent</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{totalDays.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Recipients</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{totalSent.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Opens</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{totalOpens.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Open Rate</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{overallOpenRate}%</div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Push-Eligible Audience (30 days)</h2>
        {trend.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No audience snapshots yet — the daily snapshot job populates this over time.
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[600px]">
              <ReactApexChart options={chartOptions} series={chartSeries} type="area" height={280} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Content Feed</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Content</th>
                <th className="px-3 py-3">Language</th>
                <th className="px-3 py-3 text-right">Recipients</th>
                <th className="px-3 py-3 text-right">Android</th>
                <th className="px-3 py-3 text-right">iOS</th>
                <th className="px-3 py-3 text-right">Failed</th>
                <th className="px-3 py-3 text-right">Opens</th>
                <th className="px-3 py-3 text-right">Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    No daily content sent yet.
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.content_log_id} className="border-b border-gray-100 align-top dark:border-gray-800">
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{formatDate(item.content_date)}</td>
                    <td className="px-3 py-3 capitalize text-gray-700 dark:text-gray-300">{item.content_type}</td>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">{item.content_text || '—'}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.language_code}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{item.sent_count.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{item.android_sent.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{item.ios_sent.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{item.failed_count.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{item.open_count.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{openRate(item)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {pageStart} to {pageEnd} of {totalDays} entries
          </p>
          <div className="ml-auto">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
