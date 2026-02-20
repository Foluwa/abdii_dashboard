"use client";

import React, { useState } from "react";
import { useAlertHistory } from "@/hooks/useApi";
import type { AlertLevel, AlertCategory, AlertHistoryItem } from "@/types/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/SimpleAlert";
import StatusBadge from "@/components/admin/StatusBadge";
import { StyledSelect } from "@/components/ui/form/StyledSelect";

export default function AlertsPage() {
  const [level, setLevel] = useState<AlertLevel | undefined>(undefined);
  const [category, setCategory] = useState<AlertCategory | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 50;

  const { alerts, isLoading, isError } = useAlertHistory({ level, category, page, limit });
  const items = alerts?.items ?? [];
  const total = alerts?.total ?? 0;

  const getLevelBadgeStatus = (alertLevel: AlertLevel) => {
    switch (alertLevel) {
      case "critical":
        return "error" as const;
      case "error":
        return "error" as const;
      case "warning":
        return "warning" as const;
      case "info":
        return "info" as const;
      default:
        return "info" as const;
    }
  };

  const parseApiTimestamp = (timestamp?: string | null) => {
    if (!timestamp) return null;

    // FastAPI commonly returns microseconds (6 digits). JS Date only supports milliseconds.
    // Also, when no timezone is included, treat it as UTC for consistent display.
    let normalized = timestamp.replace(/(\.\d{3})\d+/, "$1");
    const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized);
    if (!hasTimezone) normalized = `${normalized}Z`;

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatTimestamp = (timestamp?: string | null) => {
    const date = parseApiTimestamp(timestamp);
    return date ? date.toLocaleString() : "—";
  };

  const formatMessageHtml = (message: string) => {
    let html = message || "";
    html = html.replace(/\n/g, "<br/>");
    // Basic hardening (admin-only content, but avoid obvious XSS vectors)
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    html = html.replace(/javascript:/gi, "");
    return html;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Alert History" />
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i: any) => (
              <div key={i} className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Alert History" />
        <Alert variant="error">
          Failed to load alert history. Please check your API connection.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <PageBreadCrumb pageTitle="Alert History" />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View system alerts and notifications (auto-refreshes every 60 seconds)
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="flex flex-wrap gap-4">
          <StyledSelect
            label="Level"
            value={level || ""}
            onChange={(e) => {
              setLevel(e.target.value as AlertLevel || undefined);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Levels" },
              { value: "info", label: "Info" },
              { value: "warning", label: "Warning" },
              { value: "error", label: "Error" },
              { value: "critical", label: "Critical" }
            ]}
            placeholder="All Levels"
          />

          <StyledSelect
            label="Category"
            value={category || ""}
            onChange={(e) => {
              setCategory(e.target.value as AlertCategory || undefined);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              { value: "telegram", label: "Telegram" },
              { value: "system", label: "System" },
              { value: "resource", label: "Resource" },
              { value: "error", label: "Error" }
            ]}
            placeholder="All Categories"
          />

          {(level || category) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setLevel(undefined);
                  setCategory(undefined);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        {items.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((alert: any) => (
              <div key={alert.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={getLevelBadgeStatus(alert.alert_level)} label={alert.alert_level} />
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded dark:bg-gray-800 dark:text-gray-300">
                        {alert.alert_category}
                      </span>
                      {alert.sent_successfully && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded dark:bg-green-900 dark:text-green-300">
                          Sent
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400"
                      dangerouslySetInnerHTML={{ __html: formatMessageHtml(alert.message) }}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(alert.sent_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No alerts found</p>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} alerts
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
