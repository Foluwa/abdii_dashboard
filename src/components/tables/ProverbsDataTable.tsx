import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { FiEdit, FiTrash2, FiVolume2 } from "react-icons/fi";
import { AudioWaveform } from "@/components/ui/audio/AudioWaveform";
import type { Proverb } from "@/types/api";

interface ProverbsDataTableProps {
  proverbs: Proverb[];
  isLoading: boolean;
  selectedProverbs?: string[];
  onSelectProverb?: (proverbId: string) => void;
  onSelectAll?: () => void;
  onEdit: (proverb: Proverb) => void;
  onDelete: (proverbId: string) => void;
  onRegenerateAudio: (proverb: Proverb) => void;
}

export default function ProverbsDataTable({
  proverbs,
  isLoading,
  selectedProverbs = [],
  onSelectProverb,
  onSelectAll,
  onEdit,
  onDelete,
  onRegenerateAudio,
}: ProverbsDataTableProps) {
  const renderRegenerationBadge = (status?: string | null, error?: string | null) => {
    if (!status) {
      return null;
    }

    if (status === "queued") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Audio queued
        </span>
      );
    }

    if (status === "processing") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
          Audio processing
        </span>
      );
    }

    if (status !== "failed") {
      return null;
    }

    return (
      <span
        title={error || "The latest audio regeneration attempt failed."}
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      >
        Last regeneration failed
      </span>
    );
  };

  const isRegenerationPending = (status?: string | null) => status === "queued" || status === "processing";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <>
    {/* Desktop Table View */}
    <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectAll && (
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedProverbs.length === proverbs.length && proverbs.length > 0}
                    onChange={onSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                </th>
              )}
              <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Proverb
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Translation
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Meaning
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Audio
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {proverbs.length > 0 ? (
              proverbs.map((proverb) => (
                <TableRow key={proverb.id}>
                  {onSelectProverb && (
                    <TableCell className="px-5 py-4 text-start w-12">
                      <input
                        type="checkbox"
                        checked={selectedProverbs.includes(proverb.id)}
                        onChange={() => onSelectProverb(proverb.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                    </TableCell>
                  )}
                  {/* Proverb */}
                  <TableCell className="px-5 py-4 max-w-xs">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {proverb.proverb}
                    </div>
                  </TableCell>

                  {/* Translation */}
                  <TableCell className="px-5 py-4 max-w-xs">
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {proverb.translation}
                    </div>
                  </TableCell>

                  {/* Meaning */}
                  <TableCell className="px-5 py-4 max-w-md">
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {proverb.meaning || "-"}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-col items-start gap-2">
                      {proverb.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                          {proverb.category}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
                      )}
                      {renderRegenerationBadge(proverb.last_regeneration_status, proverb.last_regeneration_error)}
                    </div>
                  </TableCell>

                  {/* Audio */}
                  <TableCell className="px-5 py-4">
                    {proverb.audio_url ? (
                      <div className="min-w-[280px] max-w-md">
                        <AudioWaveform
                          src={proverb.audio_url}
                          height={40}
                          waveColor="#94a3b8"
                          progressColor="#3b82f6"
                          cursorColor="#1d4ed8"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-600">No audio</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onRegenerateAudio(proverb)}
                        disabled={isRegenerationPending(proverb.last_regeneration_status)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-brand-400 dark:hover:bg-brand-900/20"
                      >
                        <FiVolume2 className="h-3.5 w-3.5" />
                        {proverb.last_regeneration_status === "queued"
                          ? "Queued"
                          : proverb.last_regeneration_status === "processing"
                            ? "Processing..."
                            : "Regenerate"}
                      </button>
                      <button
                        onClick={() => onEdit(proverb)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/20"
                      >
                        <FiEdit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(proverb.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <td
                  colSpan={onSelectAll ? 7 : 6}
                  className="px-5 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">No proverbs found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Try adjusting your filters or add a new proverb
                    </p>
                  </div>
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>

    {/* Mobile Grid View */}
    <div className="lg:hidden grid grid-cols-1 gap-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : proverbs.length > 0 ? (
        proverbs.map((proverb) => (
          <div
            key={proverb.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
          >
            {/* Proverb */}
            <div className="mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Proverb
                    </div>
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      {proverb.proverb}
                    </div>
                  </div>
                  {onSelectProverb && (
                    <input
                      type="checkbox"
                      checked={selectedProverbs.includes(proverb.id)}
                      onChange={() => onSelectProverb(proverb.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                  )}
              </div>
            </div>

            {/* Translation */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                Translation
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {proverb.translation}
              </div>
            </div>

            {/* Meaning */}
            {proverb.meaning && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Meaning
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {proverb.meaning}
                </div>
              </div>
            )}

            {/* Category */}
            {proverb.category && (
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                  {proverb.category}
                </span>
              </div>
            )}

            {proverb.last_regeneration_status && (
              <div className="mb-3">
                {renderRegenerationBadge(proverb.last_regeneration_status, proverb.last_regeneration_error)}
              </div>
            )}

            {/* Audio */}
            {proverb.audio_url && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Audio
                </div>
                <AudioWaveform
                  src={proverb.audio_url}
                  height={40}
                  waveColor="#94a3b8"
                  progressColor="#3b82f6"
                  cursorColor="#1d4ed8"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              <button
                onClick={() => onRegenerateAudio(proverb)}
                disabled={isRegenerationPending(proverb.last_regeneration_status)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-900/20 dark:text-brand-400"
              >
                <FiVolume2 className="h-3.5 w-3.5" />
                {proverb.last_regeneration_status === "queued"
                  ? "Queued"
                  : proverb.last_regeneration_status === "processing"
                    ? "Processing..."
                    : "Regenerate"}
              </button>
              <button
                onClick={() => onEdit(proverb)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400"
              >
                <FiEdit className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(proverb.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 p-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No proverbs found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Try adjusting your filters or add a new proverb
          </p>
        </div>
      )}
    </div>
    </>
  );
}
