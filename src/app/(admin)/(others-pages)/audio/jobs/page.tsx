"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/SimpleAlert";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import { FaSync, FaCheckCircle, FaExclamationCircle, FaClock, FaPlay } from "react-icons/fa";

interface AudioJob {
  id: string;
  content_type: string;
  content_id: string;
  text: string;
  language_code: string;
  voice_id?: string;
  provider: string;
  status: string;
  priority: number;
  audio_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function AudioJobsPage() {
  const [jobs, setJobs] = useState<AudioJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterProvider, setFilterProvider] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const limit = 20;

  useEffect(() => {
    fetchJobs();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchJobs, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [page, filterStatus, filterProvider, autoRefresh]);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/v1/admin/audio/jobs?page=${page}&limit=${limit}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterProvider) url += `&provider=${filterProvider}`;

      const response = await apiClient.get(url);
      const data = response.data;
      setJobs(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      await apiClient.post(`/api/v1/admin/audio/jobs/${jobId}/retry`);
      setSuccessMessage("Job queued for retry");
      fetchJobs();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to retry job");
      setTimeout(() => setError(""), 5000);
    }
  };

  const cancelJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this job?")) return;

    try {
      await apiClient.post(`/api/v1/admin/audio/jobs/${jobId}/cancel`);
      setSuccessMessage("Job cancelled successfully");
      fetchJobs();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to cancel job");
      setTimeout(() => setError(""), 5000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="text-green-600" />;
      case "failed":
        return <FaExclamationCircle className="text-red-600" />;
      case "processing":
        return <FaSync className="text-blue-600 animate-spin" />;
      case "pending":
        return <FaClock className="text-yellow-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "processing":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    return `${seconds.toFixed(1)}s`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <PageBreadCrumb pageTitle="Audio Jobs" />

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audio Generation Jobs</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor TTS generation jobs and their status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <StyledSelect
            label="Status"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            fullWidth
            options={[
              { value: "", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "cancelled", label: "Cancelled" }
            ]}
            placeholder="All Statuses"
          />
        </div>
        <div className="flex-1">
          <StyledSelect
            label="Provider"
            value={filterProvider}
            onChange={(e) => {
              setFilterProvider(e.target.value);
              setPage(1);
            }}
            fullWidth
            options={[
              { value: "", label: "All Providers" },
              { value: "google", label: "Google TTS" },
              { value: "spitch", label: "Spitch" },
              { value: "elevenlabs", label: "ElevenLabs" }
            ]}
            placeholder="All Providers"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <FaClock className="mx-auto text-gray-400 text-5xl mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No audio jobs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Text
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {job.text}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {job.content_type} • {job.language_code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {job.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {job.duration_seconds && <div>Duration: {formatDuration(job.duration_seconds)}</div>}
                        {job.file_size_bytes && <div>Size: {formatFileSize(job.file_size_bytes)}</div>}
                        {job.error_message && (
                          <div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                            Error: {job.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>Retries: {job.retry_count}/{job.max_retries}</div>
                        <div className="text-xs text-gray-500">
                          Priority: {job.priority}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {job.audio_url && (
                          <a
                            href={job.audio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 dark:text-green-400 text-sm inline-flex items-center gap-1"
                          >
                            <FaPlay className="text-xs" /> Play
                          </a>
                        )}
                        {job.status === "failed" && job.retry_count < job.max_retries && (
                          <button
                            onClick={() => retryJob(job.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                          >
                            Retry
                          </button>
                        )}
                        {(job.status === "pending" || job.status === "processing") && (
                          <button
                            onClick={() => cancelJob(job.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} jobs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
