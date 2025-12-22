"use client";

import React, { useState } from "react";
import { useLanguages } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Toast from "@/components/ui/toast/Toast";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import NumbersDataTable from "@/components/tables/NumbersDataTable";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/modal/ConfirmationModal";
import { FiPlus, FiGlobe, FiHash } from "react-icons/fi";

interface Number {
  id: string;
  language_id: string;
  number_value: number;
  number_type: string;
  word: string;
  word_normalized: string;
  written_form?: string;
  ordinal_word?: string;
  is_compound: boolean;
  base_numbers?: number[];
  formation_rule?: string;
  arithmetic_expression?: string;
  ipa_pronunciation?: string;
  number_system: string;
  cultural_context?: string;
  usage_notes?: string;
  difficulty_level: number;
  display_order: number;
  is_active: boolean;
  audio?: any[];
}

interface NumbersResponse {
  total: number;
  page: number;
  limit: number;
  items: Number[];
}

export default function NumbersPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState<Number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; word: string } | null>(null);
  
  const [numbers, setNumbers] = useState<Number[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { languages } = useLanguages();

  const [formData, setFormData] = useState({
    language_id: "",
    number_value: 1,
    number_type: "cardinal",
    word: "",
    word_normalized: "",
    written_form: "",
    ordinal_word: "",
    is_compound: false,
    formation_rule: "",
    arithmetic_expression: "",
    ipa_pronunciation: "",
    number_system: "decimal",
    cultural_context: "",
    usage_notes: "",
    difficulty_level: 1,
    display_order: 1,
    is_active: true,
  });

  // Fetch numbers
  const fetchNumbers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (selectedLanguage) {
        params.append("language_id", selectedLanguage);
      }
      if (search) {
        params.append("search", search);
      }

      const response = await apiClient.get<NumbersResponse>(
        `/api/v1/admin/numbers?${params.toString()}`
      );
      setNumbers(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Failed to fetch numbers:", error);
      setErrorMessage("Failed to load numbers");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNumbers();
  }, [selectedLanguage, search, page, limit]);

  const openCreateModal = () => {
    setEditingNumber(null);
    setFormData({
      language_id: selectedLanguage || (languages?.[0]?.id ?? ""),
      number_value: 1,
      number_type: "cardinal",
      word: "",
      word_normalized: "",
      written_form: "",
      ordinal_word: "",
      is_compound: false,
      formation_rule: "",
      arithmetic_expression: "",
      ipa_pronunciation: "",
      number_system: "decimal",
      cultural_context: "",
      usage_notes: "",
      difficulty_level: 1,
      display_order: 1,
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (number: Number) => {
    setEditingNumber(number);
    setFormData({
      language_id: number.language_id,
      number_value: number.number_value,
      number_type: number.number_type,
      word: number.word,
      word_normalized: number.word_normalized,
      written_form: number.written_form || "",
      ordinal_word: number.ordinal_word || "",
      is_compound: number.is_compound,
      formation_rule: number.formation_rule || "",
      arithmetic_expression: number.arithmetic_expression || "",
      ipa_pronunciation: number.ipa_pronunciation || "",
      number_system: number.number_system,
      cultural_context: number.cultural_context || "",
      usage_notes: number.usage_notes || "",
      difficulty_level: number.difficulty_level,
      display_order: number.display_order,
      is_active: number.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNumber(null);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    try {
      if (editingNumber) {
        await apiClient.put(`/api/v1/admin/numbers/${editingNumber.id}`, formData);
        setSuccessMessage("Number updated successfully");
      } else {
        await apiClient.post("/api/v1/admin/numbers", formData);
        setSuccessMessage("Number created successfully");
      }
      closeModal();
      fetchNumbers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to save number");
    }
  };

  const handleDeleteClick = (id: string, word: string) => {
    setDeleteConfirm({ id, word });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const id = deleteConfirm.id;
      await apiClient.delete(`/api/v1/admin/numbers/${id}`);
      setSuccessMessage("Number deleted successfully");
      setDeleteConfirm(null);
      fetchNumbers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to delete number");
      setDeleteConfirm(null);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <div className="p-6">
      <PageBreadCrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Content", href: "/content" },
          { label: "Numbers", active: true },
        ]}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Numbers Management
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage numbers (1-1000+) across all languages
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-300 dark:focus:ring-brand-800"
          >
            <FiPlus className="w-5 h-5" />
            Add Number
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <Toast type="success" message={successMessage} onClose={() => setSuccessMessage("")} />
        )}
        {errorMessage && (
          <Toast type="error" message={errorMessage} onClose={() => setErrorMessage("")} />
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <FiGlobe className="w-5 h-5 text-gray-400" />
            <StyledSelect
              value={selectedLanguage || ""}
              onChange={(e) => {
                setSelectedLanguage(e.target.value || undefined);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Languages" },
                ...(languages?.map((lang) => ({
                  value: lang.id,
                  label: lang.name
                })) || [])
              ]}
              fullWidth
            />
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search numbers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <NumbersDataTable
          numbers={numbers}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={(id) => {
            const number = numbers.find(n => n.id === id);
            handleDeleteClick(id, number?.word || `#${number?.number_value}` || 'this number');
          }}
          languages={languages || []}
        />

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 px-5 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2">
            {(() => {
              const totalPages = Math.ceil(total / limit);
              const maxVisiblePages = 5;
              let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

              if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              const pages = [];

              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setPage(1)}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" className="px-2 text-gray-400">...</span>
                  );
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      i === page
                        ? "bg-brand-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" className="px-2 text-gray-400">...</span>
                  );
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setPage(totalPages)}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingNumber ? "Edit Number" : "Create Number"}
          maxWidth="3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <Alert type="error" message={errorMessage} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language */}
              <div>
                <StyledSelect
                  label="Language"
                  required
                  value={formData.language_id}
                  onChange={(e) => setFormData({ ...formData, language_id: e.target.value })}
                  options={[
                    { value: "", label: "Select Language" },
                    ...(languages?.map((lang) => ({
                      value: lang.id,
                      label: lang.name
                    })) || [])
                  ]}
                  fullWidth
                />
              </div>

              {/* Number Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.number_value}
                  onChange={(e) => setFormData({ ...formData, number_value: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Word */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Word *
                </label>
                <input
                  type="text"
                  required
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Word Normalized */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Normalized *
                </label>
                <input
                  type="text"
                  required
                  value={formData.word_normalized}
                  onChange={(e) => setFormData({ ...formData, word_normalized: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Number System */}
              <div>
                <StyledSelect
                  label="Number System"
                  required
                  value={formData.number_system}
                  onChange={(e) => setFormData({ ...formData, number_system: e.target.value })}
                  options={[
                    { value: "decimal", label: "Decimal" },
                    { value: "vigesimal", label: "Vigesimal" }
                  ]}
                  fullWidth
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty (1-5) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5"
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* IPA Pronunciation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IPA Pronunciation
              </label>
              <input
                type="text"
                value={formData.ipa_pronunciation}
                onChange={(e) => setFormData({ ...formData, ipa_pronunciation: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Usage Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usage Notes
              </label>
              <textarea
                rows={3}
                value={formData.usage_notes}
                onChange={(e) => setFormData({ ...formData, usage_notes: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-300 dark:focus:ring-brand-800 transition-colors"
              >
                {editingNumber ? "Update Number" : "Create Number"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Number"
        message={`Are you sure you want to delete "${deleteConfirm?.word}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
