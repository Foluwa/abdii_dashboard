"use client";

import React, { useState } from "react";
import { useLanguages } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import type { Language } from "@/types/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Toast from "@/components/ui/toast/Toast";
import Alert from "@/components/ui/alert/Alert";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import { ConfirmationModal } from "@/components/ui/modal/ConfirmationModal";
import { FiGlobe, FiUsers, FiBook, FiMusic } from "react-icons/fi";

export default function LanguagesPage() {
  const { languages, isLoading, isError, refresh } = useLanguages();
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    native_name: "",
    iso_639_3: "",
    text_direction: "ltr" as "ltr" | "rtl",
    flag_emoji: "",
    is_deleted: false,
  });

  const openCreateModal = () => {
    setEditingLanguage(null);
    setFormData({
      name: "",
      native_name: "",
      iso_639_3: "",
      text_direction: "ltr",
      flag_emoji: "",
      is_deleted: false,
    });
    setShowModal(true);
  };

  const openEditModal = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      native_name: language.native_name,
      iso_639_3: language.iso_639_3,
      text_direction: (language.text_direction === "rtl" ? "rtl" : "ltr") as "ltr" | "rtl",
      flag_emoji: language.flag_emoji || "",
      is_deleted: language.is_deleted ?? false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLanguage(null);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      if (editingLanguage) {
        await apiClient.put(`/api/v1/admin/languages/${editingLanguage.id}`, formData);
        setSuccessMessage("Language updated successfully");
      } else {
        await apiClient.post("/api/v1/admin/languages", formData);
        setSuccessMessage("Language created successfully");
      }
      closeModal();
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to save language");
    }
  };

  const handleDeleteClick = (languageId: string, name: string) => {
    setDeleteConfirm({ id: languageId, name });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await apiClient.delete(`/api/v1/admin/languages/${deleteConfirm.id}`);
      setSuccessMessage("Language deleted successfully");
      setDeleteConfirm(null);
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to delete language");
      setDeleteConfirm(null);
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageBreadCrumb pageTitle="Languages" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <PageBreadCrumb pageTitle="Languages" />
        <Alert variant="error" title="Error" message="Failed to load languages. Please check your API connection." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageBreadCrumb pageTitle="Languages" />

      {successMessage && <Toast type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
      {errorMessage && <Toast type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Languages</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage available languages in the platform
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Language
        </button>
      </div>

      {/* Languages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languages.map((language: Language) => (
          <div
            key={language.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{language.flag_emoji || "🌐"}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {language.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language.native_name}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  !language.is_deleted
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {!language.is_deleted ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <FiBook className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Letters</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {language.total_letters || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FiMusic className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phonics</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {language.total_phonics || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FiUsers className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Learners</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {language.user_count || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FiGlobe className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Code</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                    {language.iso_639_3}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => openEditModal(language)}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(language.id, language.name)}
                className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {languages.length === 0 && (
        <div className="text-center py-12">
          <FiGlobe className="mx-auto text-gray-400 text-5xl mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No languages found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Language
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingLanguage ? "Edit Language" : "Add Language"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <Alert variant="error" title="Error" message={errorMessage} />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="e.g., Yoruba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Native Name *
                </label>
                <input
                  type="text"
                  value={formData.native_name}
                  onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="e.g., Èdè Yorùbá"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ISO 639-3 Code *
                </label>
                <input
                  type="text"
                  value={formData.iso_639_3}
                  onChange={(e) => setFormData({ ...formData, iso_639_3: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                  required
                  maxLength={3}
                  placeholder="e.g., yor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Flag Emoji
                </label>
                <input
                  type="text"
                  value={formData.flag_emoji}
                  onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="🇳🇬"
                />
              </div>

              <div>
                <StyledSelect
                  label="Text Direction"
                  value={formData.text_direction}
                  onChange={(e) => setFormData({ ...formData, text_direction: e.target.value as "ltr" | "rtl" })}
                  options={[
                    { value: "ltr", label: "Left to Right (LTR)" },
                    { value: "rtl", label: "Right to Left (RTL)" }
                  ]}
                  fullWidth
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_deleted"
                  checked={!formData.is_deleted}
                  onChange={(e) => setFormData({ ...formData, is_deleted: !e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="is_deleted" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingLanguage ? "Update" : "Create"}
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
        title="Delete Language"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will affect all content in this language and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
