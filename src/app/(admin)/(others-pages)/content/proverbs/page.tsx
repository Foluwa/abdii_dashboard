"use client";

import React, { useState } from "react";
import { useProverbs, useLanguages } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import type { Proverb } from "@/types/api";
import { FiVolume2 } from "react-icons/fi";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Toast from "@/components/ui/toast/Toast";
import Alert from "@/components/ui/alert/Alert";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import { ConfirmationModal } from "@/components/ui/modal/ConfirmationModal";
import ProverbsDataTable from "@/components/tables/ProverbsDataTable";
import { RegenerateAudioModal } from "@/components/modals/RegenerateAudioModal";
import { scheduleQueuedAudioRefresh } from "@/lib/audioRegeneration";

export default function ProverbsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [editingProverb, setEditingProverb] = useState<Proverb | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; proverb: string } | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regeneratingTarget, setRegeneratingTarget] = useState<any | null>(null);
  const [selectedProverbs, setSelectedProverbs] = useState<string[]>([]);
  const [showBulkRegenerateConfirm, setShowBulkRegenerateConfirm] = useState(false);
  const [isBulkRegenerating, setIsBulkRegenerating] = useState(false);
  const [bulkRegenerateLanguage, setBulkRegenerateLanguage] = useState<string>("yoruba");
  const [bulkRegenerateVoiceId, setBulkRegenerateVoiceId] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Helper to format error messages (handles both string and object errors)
  const formatErrorMessage = (error: any, fallbackMessage: string): string => {
    const detail = error?.response?.data?.detail;
    
    // If detail is a string, return it
    if (typeof detail === 'string') {
      return detail;
    }
    
    // If detail is an array (Pydantic validation errors)
    if (Array.isArray(detail) && detail.length > 0) {
      // Extract first error message
      const firstError = detail[0];
      return firstError.msg || firstError.message || JSON.stringify(firstError);
    }
    
    // If detail is an object, try to extract a message
    if (typeof detail === 'object' && detail !== null) {
      return detail.msg || detail.message || JSON.stringify(detail);
    }
    
    // Fallback to error message or default
    return error?.message || fallbackMessage;
  };

  const { proverbs, total, isLoading, isError, refresh } = useProverbs({ 
    language_id: selectedLanguage, 
    category, 
    page, 
    limit 
  });
  const { languages } = useLanguages();

  // Deduplicate proverbs to prevent duplicate key errors
  const uniqueProverbs = React.useMemo(() => {
    if (!proverbs) return [];
    const seen = new Set<string>();
    return proverbs.filter((proverb: Proverb) => {
      if (seen.has(proverb.id)) {
        return false;
      }
      seen.add(proverb.id);
      return true;
    });
  }, [proverbs]);

  const [formData, setFormData] = useState({
    language_id: 0,
    proverb: "",
    translation: "",
    meaning: "",
    category: "",
  });

  const openCreateModal = () => {
    setEditingProverb(null);
    setFormData({
      language_id: selectedLanguage || (languages?.[0]?.id ?? 0),
      proverb: "",
      translation: "",
      meaning: "",
      category: "",
    });
    setAudioFile(null);
    setAudioPreview(null);
    setShowModal(true);
  };

  const openEditModal = (proverb: Proverb) => {
    setEditingProverb(proverb);
    setFormData({
      language_id: proverb.language_id,
      proverb: proverb.proverb,
      translation: proverb.translation,
      meaning: proverb.meaning || "",
      category: proverb.category || "",
    });
    setAudioFile(null);
    setAudioPreview(proverb.audio_url || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProverb(null);
    setAudioFile(null);
    setAudioPreview(null);
    setErrorMessage("");
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setErrorMessage('Please select a valid audio file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Audio file must be less than 5MB');
        return;
      }
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    try {
      let proverbId: string;
      if (editingProverb) {
        await apiClient.put(`/api/v1/admin/proverbs/${editingProverb.id}`, formData);
        proverbId = editingProverb.id;
        setSuccessMessage("Proverb updated successfully");
      } else {
        const response = await apiClient.post("/api/v1/admin/proverbs", formData);
        proverbId = response.data.id;
        setSuccessMessage("Proverb created successfully");
      }

      // Upload audio if provided
      if (audioFile && proverbId) {
        setUploadingAudio(true);
        const audioFormData = new FormData();
        audioFormData.append('audio', audioFile);
        
        try {
          await apiClient.post(`/api/v1/admin/proverbs/${proverbId}/audio`, audioFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          setSuccessMessage(editingProverb ? "Proverb and audio updated successfully" : "Proverb and audio created successfully");
        } catch (audioError: any) {
          console.error('Audio upload error:', audioError);
          setErrorMessage('Proverb saved but audio upload failed: ' + formatErrorMessage(audioError, audioError.message || 'Unknown error'));
        } finally {
          setUploadingAudio(false);
        }
      }

      closeModal();
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(formatErrorMessage(error, "Failed to save proverb"));
    }
  };

  const handleDeleteClick = (proverbId: string, proverbText: string) => {
    setDeleteConfirm({ id: proverbId, proverb: proverbText });
  };

  const handleSelectAllProverbs = () => {
    if (selectedProverbs.length === uniqueProverbs.length) {
      setSelectedProverbs([]);
      return;
    }

    setSelectedProverbs(uniqueProverbs.map((proverb: Proverb) => proverb.id));
  };

  const handleSelectProverb = (proverbId: string) => {
    setSelectedProverbs((prev) =>
      prev.includes(proverbId)
        ? prev.filter((id) => id !== proverbId)
        : [...prev, proverbId]
    );
  };

  const handleRegenerateAudio = (proverb: Proverb) => {
    const languageCode = languages?.find((lang: any) => lang.id === proverb.language_id)?.iso_639_3 || "yor";
    setRegeneratingTarget({
      id: proverb.id,
      contentType: "proverb",
      displayText: proverb.proverb,
      defaultText: proverb.proverb,
      languageCode,
      submitEndpoint: `/api/v1/admin/content/proverbs/${proverb.id}/regenerate-audio`,
    });
    setShowRegenerateModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await apiClient.delete(`/api/v1/admin/proverbs/${deleteConfirm.id}`);
      setSuccessMessage("Proverb deleted successfully");
      setDeleteConfirm(null);
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(formatErrorMessage(error, "Failed to delete proverb"));
      setDeleteConfirm(null);
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleBulkRegenerateAudio = async () => {
    if (selectedProverbs.length === 0) return;
    
    // Fetch available voices when opening modal
    setIsLoadingVoices(true);
    try {
      const response = await apiClient.get("/api/v1/admin/audio/voices", {
        params: { is_active: true, limit: 100 }
      });
      const voices = response.data.voices || response.data.items || [];
      setAvailableVoices(voices);
      
      // Find default Yoruba voice (Spitch provider)
      const defaultVoice = voices.find((v: any) => 
        v.language_code === "yo" && v.provider === "spitch" && v.is_active
      );
      setBulkRegenerateVoiceId(defaultVoice?.id || "");
    } catch (error) {
      console.error("Failed to load voices:", error);
      setAvailableVoices([]);
    } finally {
      setIsLoadingVoices(false);
    }
    
    setShowBulkRegenerateConfirm(true);
  };

  const confirmBulkRegenerateAudio = async () => {
    setIsBulkRegenerating(true);
    try {
      const payload: any = {
        proverb_ids: selectedProverbs,
        language: bulkRegenerateLanguage, // Send selected language
      };
      
      // Only include voice_id if one is selected
      if (bulkRegenerateVoiceId) {
        payload.voice_id = bulkRegenerateVoiceId;
      }
      
      await apiClient.post("/api/v1/admin/content/proverbs/bulk/regenerate-audio", payload);
      setSuccessMessage(`Audio regeneration started for ${selectedProverbs.length} ${bulkRegenerateLanguage} proverb(s)`);
      setSelectedProverbs([]);
      setShowBulkRegenerateConfirm(false);
      refresh();
      scheduleQueuedAudioRefresh(refresh);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(formatErrorMessage(error, "Failed to regenerate proverb audio"));
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsBulkRegenerating(false);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Proverbs" />
        <Alert variant="error" title="Error" message="Failed to load proverbs. Please check your API connection." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageBreadCrumb pageTitle="Proverbs" />

      {/* Messages */}
      {successMessage && <Toast type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
      {errorMessage && <Toast type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proverbs Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage proverbs and cultural sayings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedProverbs.length > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProverbs.length} selected
              </span>
              <button
                onClick={handleBulkRegenerateAudio}
                disabled={isBulkRegenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
              >
                <FiVolume2 className="h-4 w-4" />
                {isBulkRegenerating ? "Regenerating..." : "Regenerate Audio"}
              </button>
            </>
          )}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Proverb
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 max-w-full md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search proverbs..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <StyledSelect
          label="Language"
          value={selectedLanguage || ""}
          onChange={(e) => {
            setSelectedLanguage(e.target.value ? Number(e.target.value) : undefined);
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by category..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <StyledSelect
          label="Per Page"
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
          fullWidth
        />
      </div>

      {/* Proverbs Table - Desktop and Mobile */}
      <ProverbsDataTable
        proverbs={uniqueProverbs}
        isLoading={isLoading}
        selectedProverbs={selectedProverbs}
        onSelectAll={handleSelectAllProverbs}
        onSelectProverb={handleSelectProverb}
        onEdit={openEditModal}
        onRegenerateAudio={handleRegenerateAudio}
        onDelete={(id) => {
          const proverb = uniqueProverbs.find((p: Proverb) => p.id === id);
          handleDeleteClick(id, proverb?.proverb || 'this proverb');
        }}
      />

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} proverbs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
              {(() => {
                const totalPages = Math.ceil(total / limit);
                const pageNumbers = [];
                const maxVisible = 7;
                
                if (totalPages <= maxVisible) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  // Show first, last, and pages around current
                  if (page <= 3) {
                    // Near start
                    for (let i = 1; i <= 5; i++) pageNumbers.push(i);
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                  } else if (page >= totalPages - 2) {
                    // Near end
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
                  } else {
                    // Middle
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = page - 1; i <= page + 1; i++) pageNumbers.push(i);
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                  }
                }
                
                return pageNumbers.map((num, idx) => 
                  num === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => setPage(num as number)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        page === num
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  )
                );
              })()}
            </div>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= total}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {editingProverb ? "Edit Proverb" : "Add New Proverb"}
            </h2>
            
            {errorMessage && <Alert variant="error" title="Error" message={errorMessage} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <StyledSelect
                label="Language"
                value={formData.language_id}
                onChange={(e) => setFormData({ ...formData, language_id: Number(e.target.value) })}
                required
                fullWidth
                options={[
                  { value: "", label: "Select language", disabled: true },
                  ...(languages?.map((lang: any) => ({
                    value: lang.id,
                    label: lang.name
                  })) || [])
                ]}
                placeholder="Select language"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proverb *</label>
                <textarea
                  value={formData.proverb}
                  onChange={(e) => setFormData({ ...formData, proverb: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Translation *</label>
                <textarea
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meaning/Context</label>
                <textarea
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  rows={3}
                  placeholder="Explain the cultural context or deeper meaning..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Wisdom, Life, Family, Nature"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Audio Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audio File (Optional)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 focus:outline-none p-2"
                />
                {audioPreview && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {audioFile ? 'New audio file selected' : 'Current audio'}
                    </p>
                    <audio controls className="w-full h-10">
                      <source src={audioPreview} />
                    </audio>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Max file size: 5MB. Supported formats: MP3, WAV, OGG
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={uploadingAudio}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAudio ? "Uploading..." : editingProverb ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Proverb"
        message={`Are you sure you want to delete "${deleteConfirm?.proverb?.substring(0, 50)}${deleteConfirm?.proverb && deleteConfirm.proverb.length > 50 ? '...' : ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Bulk Regenerate Audio Modal */}
      {showBulkRegenerateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Regenerate Audio for {selectedProverbs.length} Proverb{selectedProverbs.length !== 1 ? 's' : ''}
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={bulkRegenerateLanguage}
                  onChange={(e) => {
                    setBulkRegenerateLanguage(e.target.value);
                    // Reset voice selection when language changes
                    setBulkRegenerateVoiceId("");
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="yoruba">Yoruba</option>
                  <option value="english">English</option>
                </select>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice (Optional)
                </label>
                {isLoadingVoices ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading voices...</div>
                ) : (
                  <select
                    value={bulkRegenerateVoiceId}
                    onChange={(e) => setBulkRegenerateVoiceId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">Use default voice for language</option>
                    {availableVoices
                      .filter((voice) => {
                        const langCode = bulkRegenerateLanguage === "yoruba" ? "yo" : "en";
                        return voice.language_code === langCode || voice.language_code.startsWith(langCode);
                      })
                      .map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.display_name || voice.voice_name} ({voice.provider})
                          {voice.gender ? ` - ${voice.gender}` : ''}
                        </option>
                      ))}
                  </select>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use the default active voice for the selected language
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will queue fresh audio generation jobs. Jobs are processed in the background.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmBulkRegenerateAudio}
                disabled={isBulkRegenerating || isLoadingVoices}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
              >
                {isBulkRegenerating ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                onClick={() => {
                  setShowBulkRegenerateConfirm(false);
                  setBulkRegenerateLanguage("yoruba");
                  setBulkRegenerateVoiceId("");
                }}
                disabled={isBulkRegenerating}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <RegenerateAudioModal
        isOpen={showRegenerateModal}
        onClose={() => {
          setShowRegenerateModal(false);
          setRegeneratingTarget(null);
        }}
        target={regeneratingTarget}
        onSuccess={() => {
          scheduleQueuedAudioRefresh(refresh);
        }}
      />
    </div>
  );
}
