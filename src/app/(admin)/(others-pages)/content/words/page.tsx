"use client";

import React, { useState } from "react";
import { useWords, useLanguages } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import type { Word } from "@/types/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/SimpleAlert";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import WordsDataTable from "@/components/tables/WordsDataTable";
import { Modal } from "@/components/ui/modal";
import { FiPlus, FiGlobe, FiTrash2, FiVolume2 } from "react-icons/fi";

export default function WordsPage() {
  const toast = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const { words, total, isLoading, isError, refresh } = useWords({ 
    language_id: selectedLanguage, 
    search, 
    page, 
    limit 
  });
  const { languages } = useLanguages();

  const [formData, setFormData] = useState({
    language_id: "",
    word: "",
    pos: "noun",
    word_category: "",
    difficulty_level: 1,
    usage_notes: "",
    ipa_pronunciation: "",
    s3_bucket_key: "",
    audio_duration_sec: null as number | null,
  });

  const openCreateModal = () => {
    setEditingWord(null);
    setFormData({
      language_id: selectedLanguage || (languages?.[0]?.id ?? ""),
      word: "",
      pos: "noun",
      word_category: "",
      difficulty_level: 1,
      usage_notes: "",
      ipa_pronunciation: "",
      s3_bucket_key: "",
      audio_duration_sec: null,
    });
    setAudioFile(null);
    setAudioPreview(null);
    setShowModal(true);
  };

  const openEditModal = (word: any) => {
    setEditingWord(word);
    setFormData({
      language_id: word.language_id,
      word: word.word,
      pos: word.pos || "noun",
      word_category: word.category || "",
      difficulty_level: word.difficulty_level || 1,
      usage_notes: word.usage_notes || "",
      ipa_pronunciation: word.ipa_pronunciation || "",
      s3_bucket_key: word.audio_key || "",
      audio_duration_sec: word.audio_duration_sec || null,
    });
    setAudioFile(null);
    setAudioPreview(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWord(null);
    setErrorMessage("");
    setAudioFile(null);
    setAudioPreview(null);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file size must be less than 10MB');
      return;
    }

    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  };

  const handleSelectAll = () => {
    if (selectedWords.length === words.length) {
      setSelectedWords([]);
    } else {
      setSelectedWords(words.map(w => w.id));
    }
  };

  const handleSelectWord = (wordId: string) => {
    setSelectedWords(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedWords.length === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedWords.length} word(s)?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Backend endpoint for bulk delete (to be implemented)
      await apiClient.post('/api/v1/admin/content/words/bulk-delete', {
        word_ids: selectedWords
      });
      toast.success(`Successfully deleted ${selectedWords.length} word(s)`);
      setSelectedWords([]);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete words');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkRegenerateAudio = async () => {
    if (selectedWords.length === 0) return;
    
    const confirmed = window.confirm(`Regenerate audio for ${selectedWords.length} word(s)?`);
    if (!confirmed) return;

    setIsRegenerating(true);
    try {
      // Backend endpoint for bulk audio regeneration (to be implemented)
      await apiClient.post('/api/v1/admin/content/words/bulk-regenerate-audio', {
        word_ids: selectedWords
      });
      toast.success(`Audio regeneration started for ${selectedWords.length} word(s)`);
      setSelectedWords([]);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to regenerate audio');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    try {
      if (editingWord) {
        await apiClient.put(`/api/v1/admin/content/words/${editingWord.id}`, formData);
        
        // Upload audio if file is selected
        if (audioFile) {
          setUploadingAudio(true);
          const audioFormData = new FormData();
          audioFormData.append('audio', audioFile);
          try {
            await apiClient.post(
              `/api/v1/admin/content/words/${editingWord.id}/audio`,
              audioFormData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          } catch (audioErr: any) {
            console.error('Audio upload error:', audioErr);
            toast.error('Word updated but audio upload failed');
          } finally {
            setUploadingAudio(false);
          }
        }
        
        toast.success("Word updated successfully!");
      } else {
        const response = await apiClient.post('/api/v1/admin/content/words', formData);
        
        // Upload audio if file is selected
        if (audioFile && response.data?.id) {
          setUploadingAudio(true);
          const audioFormData = new FormData();
          audioFormData.append('audio', audioFile);
          try {
            await apiClient.post(
              `/api/v1/admin/content/words/${response.data.id}/audio`,
              audioFormData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          } catch (audioErr: any) {
            console.error('Audio upload error:', audioErr);
            toast.error('Word created but audio upload failed');
          } finally {
            setUploadingAudio(false);
          }
        }
        
        toast.success("Word created successfully");
      }
      closeModal();
      refresh();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to save word");
    }
  };

  const handleDelete = async (wordId: string) => {
    try {
      await apiClient.delete(`/api/v1/admin/words/${wordId}`);
      toast.success("Word deleted successfully");
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete word");
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Words" />
        <Alert variant="error">Failed to load words. Please check your API connection.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageBreadCrumb pageTitle="Words Management" />
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Manage vocabulary words, translations, and audio pronunciations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedWords.length > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWords.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
              >
                <FiTrash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
              <button
                onClick={handleBulkRegenerateAudio}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
              >
                <FiVolume2 className="h-4 w-4" />
                {isRegenerating ? 'Regenerating...' : 'Regenerate Audio'}
              </button>
            </>
          )}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <FiPlus className="h-4 w-4" />
            Add New Word
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-4">
            {/* Language Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <FiGlobe className="h-3.5 w-3.5" />
                  Language
                </div>
              </label>
              <StyledSelect
                value={selectedLanguage || ""}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value || undefined);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All Languages" },
                  ...(languages?.map((lang: any) => ({
                    value: lang.id,
                    label: lang.name
                  })) || [])
                ]}
                fullWidth
              />
            </div>

            {/* Items Per Page */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Items per page
              </label>
              <StyledSelect
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                options={[
                  { value: 20, label: "20" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Words</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{total || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/20">
                <FiGlobe className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Page</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{page}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Showing</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <WordsDataTable
        words={words || []}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onSearch={(query) => {
          setSearch(query);
          setPage(1);
        }}
        searchQuery={search}
        selectedWords={selectedWords}
        onSelectWord={handleSelectWord}
        onSelectAll={handleSelectAll}
      />

      {/* Pagination */}
      {total > limit && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-3 px-5 py-4">
            {/* Previous Button */}
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
              {(() => {
                const totalPages = Math.ceil(total / limit);
                const pageNumbers = [];
                const maxVisiblePages = 5;
                
                let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                // First page
                if (startPage > 1) {
                  pageNumbers.push(
                    <button
                      key={1}
                      onClick={() => setPage(1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-gray-800 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pageNumbers.push(
                      <span key="ellipsis1" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                }
                
                // Page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        i === page
                          ? "bg-brand-600 text-white shadow-sm"
                          : "border border-gray-300 bg-gray-800 text-gray-300 hover:bg-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                
                // Last page
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pageNumbers.push(
                      <span key="ellipsis2" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  pageNumbers.push(
                    <button
                      key={totalPages}
                      onClick={() => setPage(totalPages)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-gray-800 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pageNumbers;
              })()}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= total}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} className="max-w-2xl">
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingWord ? "Edit Word" : "Create New Word"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {editingWord ? "Update word information below" : "Fill in the details to add a new word"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {errorMessage && (
              <Alert variant="error" className="mb-4">
                {errorMessage}
              </Alert>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Language */}
              <div className="sm:col-span-2">
                <StyledSelect
                  label="Language"
                  required
                  value={formData.language_id}
                  onChange={(e) => setFormData({ ...formData, language_id: e.target.value })}
                  options={[
                    { value: "", label: "Select language" },
                    ...(languages?.map((lang: any) => ({
                      value: lang.id,
                      label: lang.name
                    })) || [])
                  ]}
                  fullWidth
                />
              </div>

              {/* Word */}
              <div className="sm:col-span-2">
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  Word <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  required
                  placeholder="Enter word"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
                />
              </div>

              {/* Part of Speech */}
              <div>
                <StyledSelect
                  label="Part of Speech"
                  required
                  value={formData.pos}
                  onChange={(e) => setFormData({ ...formData, pos: e.target.value })}
                  options={[
                    { value: "noun", label: "Noun" },
                    { value: "verb", label: "Verb" },
                    { value: "adjective", label: "Adjective" },
                    { value: "adverb", label: "Adverb" },
                    { value: "pronoun", label: "Pronoun" },
                    { value: "other", label: "Other" }
                  ]}
                  fullWidth
                />
              </div>

              {/* Difficulty Level */}
              <div>
                <StyledSelect
                  label="Difficulty Level"
                  required
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: Number(e.target.value) })}
                  options={[
                    { value: 1, label: "Level 1 (Beginner)" },
                    { value: 2, label: "Level 2 (Elementary)" },
                    { value: 3, label: "Level 3 (Intermediate)" },
                    { value: 4, label: "Level 4 (Advanced)" },
                    { value: 5, label: "Level 5 (Expert)" }
                  ]}
                  fullWidth
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-2">
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.word_category}
                  onChange={(e) => setFormData({ ...formData, word_category: e.target.value })}
                  placeholder="e.g., Animals, Food, Colors"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
                />
              </div>

              {/* IPA Pronunciation */}
              <div className="sm:col-span-2">
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  IPA Pronunciation
                </label>
                <input
                  type="text"
                  value={formData.ipa_pronunciation}
                  onChange={(e) => setFormData({ ...formData, ipa_pronunciation: e.target.value })}
                  placeholder="Enter IPA pronunciation"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
                />
              </div>

              {/* Usage Notes */}
              <div className="sm:col-span-2">
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  Usage Notes
                </label>
                <textarea
                  value={formData.usage_notes}
                  onChange={(e) => setFormData({ ...formData, usage_notes: e.target.value })}
                  rows={3}
                  placeholder="Enter usage notes or examples"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
                />
              </div>

              {/* Audio Upload */}
              <div className="col-span-2">
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  Audio File
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {audioPreview && (
                  <div className="mt-3">
                    <audio controls src={audioPreview} className="w-full" />
                  </div>
                )}
                {uploadingAudio && (
                  <p className="mt-2 text-sm text-gray-500">Uploading audio...</p>
                )}
              </div>

              {/* Audio S3 Key */}
              <div>
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  Audio S3 Bucket Key
                </label>
                <input
                  type="text"
                  value={formData.s3_bucket_key}
                  onChange={(e) => setFormData({ ...formData, s3_bucket_key: e.target.value })}
                  placeholder="audio/words/word.mp3"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
                />
              </div>

              {/* Audio Duration */}
              <div>
                <label className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
                  Audio Duration (seconds)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.audio_duration_sec ?? ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    audio_duration_sec: e.target.value ? Number(e.target.value) : null 
                  })}
                  placeholder="2.5"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 disabled:cursor-default disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-300 dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus:ring-brand-800"
              >
                {editingWord ? "Update Word" : "Create Word"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
