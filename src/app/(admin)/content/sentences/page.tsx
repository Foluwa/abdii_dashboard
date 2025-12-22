/**
 * Sentences Management Page
 * CRUD interface for sentence content
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import FormModal from '@/components/admin/FormModal';
import StatusBadge from '@/components/admin/StatusBadge';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Toast from '@/components/ui/toast/Toast';
import { StyledSelect } from '@/components/ui/form/StyledSelect';
import { Sentence, SentenceCreate, SentenceUpdate, PaginatedResponse } from '@/types/content';
import { Language } from '@/types/common';
import { TableColumn } from '@/types/common';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiGlobe, FiBarChart2, FiCheckCircle } from 'react-icons/fi';

export default function SentencesPage() {
  const router = useRouter();
  const toast = useToast();
  
  // State
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    language_id: '',
    difficulty: '',
    is_published: '',
    search: '',
  });

  // Form state
  const [formData, setFormData] = useState<SentenceCreate | SentenceUpdate>({
    language_id: '',
    text: '',
    translation: '',
    romanization: '',
    difficulty_level: 1,
    category: '',
    tags: [],
    usage_context: '',
    cultural_notes: '',
    is_published: false,
  });

  // Fetch languages
  useEffect(() => {
    fetchLanguages();
  }, []);

  // Fetch sentences
  useEffect(() => {
    fetchSentences();
  }, [currentPage, filters]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file size must be less than 10MB');
      return;
    }

    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  };

  const fetchLanguages = async () => {
    try {
      const response = await apiClient.get<{ languages: Language[] }>('/api/v1/languages');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  };

  const fetchSentences = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('page_size', '50');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });

      const response = await apiClient.get<PaginatedResponse<Sentence>>(
        `/api/v1/admin/content/sentences?${params.toString()}`
      );

      setSentences(response.data.items);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Failed to fetch sentences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSentence(null);
    setFormData({
      language_id: '',
      text: '',
      translation: '',
      romanization: '',
      difficulty_level: 1,
      category: '',
      tags: [],
      usage_context: '',
      cultural_notes: '',
      is_published: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (sentence: Sentence) => {
    setEditingSentence(sentence);
    setFormData({
      text: sentence.text,
      translation: sentence.translation,
      romanization: sentence.romanization || '',
      difficulty_level: sentence.difficulty_level || 1,
      category: sentence.category || '',
      tags: sentence.tags,
      usage_context: sentence.usage_context || '',
      cultural_notes: sentence.cultural_notes || '',
      is_published: sentence.is_published,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingSentence) {
        // Update
        await apiClient.put(`/api/v1/admin/content/sentences/${editingSentence.id}`, formData);
        
        // Upload audio if file is selected
        if (audioFile) {
          setUploadingAudio(true);
          const audioFormData = new FormData();
          audioFormData.append('audio', audioFile);
          try {
            await apiClient.post(
              `/api/v1/admin/content/sentences/${editingSentence.id}/audio`,
              audioFormData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            toast.success('Sentence and audio updated successfully!');
          } catch (audioErr) {
            console.error('Audio upload error:', audioErr);
            toast.error('Sentence updated but audio upload failed');
          } finally {
            setUploadingAudio(false);
          }
        } else {
          toast.success('Sentence updated successfully!');
        }
      } else {
        // Create
        const response = await apiClient.post('/api/v1/admin/content/sentences', formData);
        
        // Upload audio if file is selected
        if (audioFile && response.data?.id) {
          setUploadingAudio(true);
          const audioFormData = new FormData();
          audioFormData.append('audio', audioFile);
          try {
            await apiClient.post(
              `/api/v1/admin/content/sentences/${response.data.id}/audio`,
              audioFormData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            toast.success('Sentence and audio created successfully!');
          } catch (audioErr) {
            console.error('Audio upload error:', audioErr);
            toast.error('Sentence created but audio upload failed');
          } finally {
            setUploadingAudio(false);
          }
        } else {
          toast.success('Sentence created successfully!');
        }
      }

      setIsModalOpen(false);
      setAudioFile(null);
      setAudioPreview(null);
      fetchSentences();
    } catch (error) {
      console.error('Failed to save sentence:', error);
      toast.error('Failed to save sentence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sentence?')) return;

    try {
      await apiClient.delete(`/api/v1/admin/content/sentences/${id}`);
      fetchSentences();
    } catch (error) {
      console.error('Failed to delete sentence:', error);
      alert('Failed to delete sentence');
    }
  };

  // Table columns
  const columns: TableColumn<Sentence>[] = [
    {
      key: 'text',
      label: 'Text',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{String(value)}</span>
      ),
    },
    {
      key: 'translation',
      label: 'Translation',
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
      ),
    },
    {
      key: 'difficulty_level',
      label: 'Difficulty',
      align: 'center',
      render: (value) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800">
          Level {String(value)}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => String(value || '-'),
    },
    {
      key: 'is_published',
      label: 'Status',
      align: 'center',
      render: (value) => (
        <StatusBadge status={value ? 'published' : 'draft'} />
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageBreadCrumb pageTitle="Sentences" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage sentence content for language learning
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          Add Sentence
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <StyledSelect
              label="Language"
              value={filters.language_id}
              onChange={(e) => setFilters({ ...filters, language_id: e.target.value })}
              options={[
                { value: "", label: "All Languages" },
                ...languages.map((lang) => ({ value: lang.id, label: lang.name })),
              ]}
              fullWidth
            />
          </div>

          <div>
            <StyledSelect
              label="Difficulty"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              options={[
                { value: "", label: "All Levels" },
                ...[1, 2, 3, 4, 5].map((level) => ({ value: level.toString(), label: `Level ${level}` })),
              ]}
              fullWidth
            />
          </div>

          <div>
            <StyledSelect
              label="Status"
              value={filters.is_published}
              onChange={(e) => setFilters({ ...filters, is_published: e.target.value })}
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Published" },
                { value: "false", label: "Draft" },
              ]}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search text or translation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as any}
        data={sentences as any}
        keyExtractor={(item: any) => item.id}
        loading={loading}
        emptyMessage="No sentences found"
        actions={(item: any) => (
          <>
            <button
              onClick={() => handleEdit(item)}
              className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingSentence ? 'Edit Sentence' : 'Create Sentence'}
        size="lg"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          {!editingSentence && (
            <div>
              <StyledSelect
                label="Language *"
                value={(formData as SentenceCreate).language_id}
                onChange={(e) => setFormData({ ...formData, language_id: e.target.value })}
                options={[
                  { value: "", label: "Select Language" },
                  ...languages.map((lang) => ({ value: lang.id, label: lang.name })),
                ]}
                fullWidth
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Text *
            </label>
            <input
              type="text"
              value={(formData as any).text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Translation *
            </label>
            <input
              type="text"
              value={(formData as any).translation}
              onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <StyledSelect
                label="Difficulty Level"
                value={(formData as any).difficulty_level?.toString()}
                onChange={(e) => setFormData({ ...formData, difficulty_level: Number(e.target.value) })}
                options={[1, 2, 3, 4, 5].map((level) => ({
                  value: level.toString(),
                  label: `Level ${level}`,
                }))}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={(formData as any).category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Audio Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Audio File
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
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

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(formData as any).is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Published
              </span>
            </label>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
