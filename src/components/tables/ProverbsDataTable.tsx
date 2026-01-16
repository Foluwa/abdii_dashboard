import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AudioWaveform } from "@/components/ui/audio/AudioWaveform";
import type { Proverb } from "@/types/api";

interface ProverbsDataTableProps {
  proverbs: Proverb[];
  isLoading: boolean;
  onEdit: (proverb: Proverb) => void;
  onDelete: (proverbId: number) => void;
}

export default function ProverbsDataTable({
  proverbs,
  isLoading,
  onEdit,
  onDelete,
}: ProverbsDataTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
          <TableBody>
            {proverbs.length > 0 ? (
              proverbs.map((proverb) => (
                <TableRow key={proverb.id}>
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
                    {proverb.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                        {proverb.category}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
                    )}
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
                  colSpan={6}
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
  );
}
