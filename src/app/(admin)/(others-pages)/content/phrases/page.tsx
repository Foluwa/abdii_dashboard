"use client";

import React, { useState } from "react";
import { useLanguages } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Toast from "@/components/ui/toast/Toast";
import Alert from "@/components/ui/alert/Alert";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import { ConfirmationModal } from "@/components/ui/modal/ConfirmationModal";

interface Phrase {
  id: string;
  language_id: string;
  phrase: string;
  translation: string;
  literal_translation?: string;
  romanization?: string;
  difficulty_level?: number;
  category?: string;
  tags: string[];
  usage_context?: string;
  cultural_notes?: string;
  is_published: boolean;
  audio_url?: string;
  created_at: string;
  updated_at: string;
}

export default function PhrasesPage() {
  const { languages } = useLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; phrase: string } | null>(null);

  const [formData, setFormData] = useState({
    language_id: "",
    phrase: "",
    translation: "",
    literal_translation: "",
    romanization: "",
    difficulty_level: 1,
    category: "",
    tags: [] as string[],
    usage_context: "",
    cultural_notes: "",
    is_published: false,
  });

  const fetchPhrases = async (languageId: string, currentPage: number = 1) => {
    if (!languageId) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(
        `/api/v1/admin/content/phrases?language_id=${languageId}&page=${currentPage}&page_size=${limit}`
      );
      const data = response.data;
      setPhrases(data.items || []);
      setTotal(data.total || 0);
      setPage(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load phrases");
      setPhrases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguage(languageId);
    setPage(1);
    fetchPhrases(languageId, 1);
  };

  const openCreateModal = () => {
    setEditingPhrase(null);
    setFormData({
      language_id: selectedLanguage,
      phrase: "",
      translation: "",
      literal_translation: "",
      romanization: "",
      difficulty_level: 1,
      category: "",
      tags: [],
      usage_context: "",
      cultural_notes: "",
      is_published: false,
    });
    setShowModal(true);
  };

  const openEditModal = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setFormData({
      language_id: phrase.language_id,
      phrase: phrase.phrase,
      translation: phrase.translation,
      literal_translation: phrase.literal_translation || "",
      romanization: phrase.romanization || "",
      difficulty_level: phrase.difficulty_level || 1,
      category: phrase.category || "",
      tags: phrase.tags || [],
      usage_context: phrase.usage_context || "",
      cultural_notes: phrase.cultural_notes || "",
      is_published: phrase.is_published,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPhrase(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (editingPhrase) {
        await apiClient.put(`/api/v1/admin/content/phrases/${editingPhrase.id}`, formData);
        setSuccessMessage("Phrase updated successfully");
      } else {
        await apiClient.post("/api/v1/admin/content/phrases", formData);
        setSuccessMessage("Phrase created successfully");
      }
      closeModal();
      fetchPhrases(selectedLanguage, page);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to save phrase");
    }
  };

  const handleDeleteClick = (phraseId: string, phraseText: string) => {
    setDeleteConfirm({ id: phraseId, phrase: phraseText });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await apiClient.delete(`/api/v1/admin/content/phrases/${deleteConfirm.id}`);
      setSuccessMessage("Phrase deleted successfully");
      setDeleteConfirm(null);
      fetchPhrases(selectedLanguage, page);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to delete phrase");
      setDeleteConfirm(null);
      setTimeout(() => setError(""), 5000);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <PageBreadCrumb pageTitle="Phrases" />

      {successMessage && <Toast type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
      {error && <Toast type="error" message={error} onClose={() => setError("")} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phrases Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage common phrases and expressions
          </p>
        </div>
        {selectedLanguage && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Phrase
          </button>
        )}
      </div>

      {/* Language Selector */}
      <div className="mb-6 max-w-md">
        <StyledSelect
          label="Select Language"
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          options={[
            { value: "", label: "-- Select a Language --" },
            ...languages.map((lang: any) => ({
              value: lang.id,
              label: `${lang.name} (${lang.native_name})`
            }))
          ]}
          fullWidth
        />
      </div>

      {/* Phrases Table - Desktop Only */}
      {selectedLanguage && (
        <>
        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : phrases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No phrases found for this language</p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Phrase
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Phrase
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Translation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {phrases.map((phrase) => (
                      <tr key={phrase.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {phrase.phrase}
                          </div>
                          {phrase.romanization && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {phrase.romanization}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {phrase.translation}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {phrase.category || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Level {phrase.difficulty_level || 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              phrase.is_published
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {phrase.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(phrase)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(phrase.id, phrase.phrase)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm"
                          >
                            Delete
                          </button>
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
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} phrases
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchPhrases(selectedLanguage, page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchPhrases(selectedLanguage, page + 1)}
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

        {/* Mobile Grid View */}
        <div className="lg:hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : phrases.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">No phrases found for this language</p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Phrase
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {phrases.map((phrase) => (
                <div key={phrase.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  {/* Phrase */}
                  <div className="mb-3">
                    <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {phrase.phrase}
                    </div>
                    {phrase.romanization && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {phrase.romanization}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Translation
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {phrase.translation}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {phrase.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {phrase.category}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Level {phrase.difficulty_level || 1}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        phrase.is_published
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {phrase.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <button
                      onClick={() => openEditModal(phrase)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(phrase.id, phrase.phrase)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPhrase ? "Edit Phrase" : "Add Phrase"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <Alert variant="error" title="Error" message={error} />}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phrase *
                  </label>
                  <input
                    type="text"
                    value={formData.phrase}
                    onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Translation *
                  </label>
                  <input
                    type="text"
                    value={formData.translation}
                    onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Literal Translation
                  </label>
                  <input
                    type="text"
                    value={formData.literal_translation}
                    onChange={(e) => setFormData({ ...formData, literal_translation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Romanization
                  </label>
                  <input
                    type="text"
                    value={formData.romanization}
                    onChange={(e) => setFormData({ ...formData, romanization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., greeting, travel, food"
                  />
                </div>

                <div>
                  <StyledSelect
                    label="Difficulty Level"
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: parseInt(e.target.value) })}
                    options={[1, 2, 3, 4, 5].map((level) => ({
                      value: level,
                      label: `Level ${level}`
                    }))}
                    fullWidth
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usage Context
                  </label>
                  <textarea
                    value={formData.usage_context}
                    onChange={(e) => setFormData({ ...formData, usage_context: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="When and how to use this phrase"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cultural Notes
                  </label>
                  <textarea
                    value={formData.cultural_notes}
                    onChange={(e) => setFormData({ ...formData, cultural_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Cultural context or significance"
                  />
                </div>

                <div className="col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="is_published" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Published (visible to users)
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPhrase ? "Update" : "Create"}
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
        title="Delete Phrase"
        message={`Are you sure you want to delete "${deleteConfirm?.phrase?.substring(0, 50)}${deleteConfirm?.phrase && deleteConfirm.phrase.length > 50 ? '...' : ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
