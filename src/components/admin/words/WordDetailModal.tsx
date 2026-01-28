/**
 * Word Detail Modal
 * Comprehensive view of word data with:
 * - All senses and glosses
 * - Examples with audio
 * - Pronunciations and forms
 * - Related terms
 * - Audio playback
 * - Example generation
 */

'use client';

import React, { useState } from 'react';
import { useWordDetail, useExampleGeneration, useExampleManagement } from '@/hooks/useWordManagement';
import { FiX, FiVolume2, FiPlus, FiEdit2, FiTrash2, FiLoader, FiSave, FiRefreshCw } from 'react-icons/fi';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface WordDetailModalProps {
  wordId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function WordDetailModal({ wordId, onClose, onUpdate }: WordDetailModalProps) {
  const { wordDetail, isLoading, mutate } = useWordDetail(wordId);
  const { generateExamples, isGenerating } = useExampleGeneration();
  const { deleteExample, isSubmitting } = useExampleManagement();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'audio'>('overview');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  // Edit states
  const [isEditingLemma, setIsEditingLemma] = useState(false);
  const [editedLemma, setEditedLemma] = useState('');
  const [editingGlossId, setEditingGlossId] = useState<string | null>(null);
  const [editedGloss, setEditedGloss] = useState('');
  const [editingExampleId, setEditingExampleId] = useState<string | null>(null);
  const [editedExampleYoruba, setEditedExampleYoruba] = useState('');
  const [editedExampleEnglish, setEditedExampleEnglish] = useState('');
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);

  const handleUpdateLemma = async () => {
    if (!editedLemma.trim()) return;
    
    try {
      await apiClient.patch(`/admin/content/words/${wordId}`, { lemma: editedLemma });
      showToast('Lemma updated successfully', 'success');
      setIsEditingLemma(false);
      mutate();
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update lemma', 'error');
    }
  };

  const handleUpdateGloss = async (glossId: string) => {
    if (!editedGloss.trim()) return;
    
    try {
      await apiClient.patch(`/admin/content/glosses/${glossId}`, { definition: editedGloss });
      showToast('Definition updated successfully', 'success');
      setEditingGlossId(null);
      mutate();
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update definition', 'error');
    }
  };

  const handleUpdateExample = async (exampleId: string) => {
    try {
      await apiClient.patch(`/admin/content/examples/${exampleId}`, {
        example_yoruba: editedExampleYoruba,
        example_english: editedExampleEnglish
      });
      showToast('Example updated successfully', 'success');
      setEditingExampleId(null);
      mutate();
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update example', 'error');
    }
  };

  const handleRegenerateAudio = async () => {
    if (!confirm('Regenerate audio for this word? This will create a new audio generation job.')) return;
    
    setIsRegeneratingAudio(true);
    try {
      await apiClient.post(`/api/v1/admin/content/words/single/${wordId}/regenerate-audio`, {});
      showToast('Audio regeneration queued successfully', 'success');
      setTimeout(() => mutate(), 2000); // Refresh after 2s
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to regenerate audio', 'error');
    } finally {
      setIsRegeneratingAudio(false);
    }
  };

  const startEditLemma = () => {
    setEditedLemma(word.lemma);
    setIsEditingLemma(true);
  };

  const startEditGloss = (glossId: string, currentDefinition: string) => {
    setEditedGloss(currentDefinition);
    setEditingGlossId(glossId);
  };

  const startEditExample = (example: any) => {
    setEditedExampleYoruba(example.example_yoruba);
    setEditedExampleEnglish(example.example_english || '');
    setEditingExampleId(example.id);
  };

  const handleGenerateExamples = async () => {
    const count = prompt('How many examples to generate? (1-10)', '3');
    if (!count) return;
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1 || numCount > 10) {
      alert('Please enter a number between 1 and 10');
      return;
    }

    await generateExamples(wordId, numCount);
    mutate();
    onUpdate();
  };

  const handleDeleteExample = async (exampleId: string) => {
    if (!confirm('Delete this example?')) return;
    await deleteExample(exampleId);
    mutate();
    onUpdate();
  };

  const playAudio = (audioUrl: string, id: string) => {
    if (playingAudio === id) {
      setPlayingAudio(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingAudio(id);
    audio.onended = () => setPlayingAudio(null);
  };

  if (isLoading || !wordDetail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8">
          <FiLoader className="animate-spin text-brand-600 w-8 h-8" />
        </div>
      </div>
    );
  }

  const { word } = wordDetail;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1">
            {isEditingLemma ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedLemma}
                  onChange={(e) => setEditedLemma(e.target.value)}
                  className="text-2xl font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleUpdateLemma}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  <FiSave size={18} />
                </button>
                <button
                  onClick={() => setIsEditingLemma(false)}
                  className="p-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded"
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {word.lemma}
                </h2>
                <button
                  onClick={startEditLemma}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiEdit2 size={18} />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {word.pos} · {word.language_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-4">
            {['overview', 'examples', 'audio'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Senses and Glosses */}
              {wordDetail.senses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Definitions
                  </h3>
                  <div className="space-y-4">
                    {wordDetail.senses.map((sense, idx) => (
                      <div
                        key={sense.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            {sense.glosses.map((gloss) => (
                              <div key={gloss.id}>
                                {editingGlossId === gloss.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editedGloss}
                                      onChange={(e) => setEditedGloss(e.target.value)}
                                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateGloss(gloss.id)}
                                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded"
                                    >
                                      <FiSave size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingGlossId(null)}
                                      className="p-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded"
                                    >
                                      <FiX size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="flex-1 text-gray-900 dark:text-white">
                                      {gloss.definition}
                                    </p>
                                    <button
                                      onClick={() => startEditGloss(gloss.id, gloss.definition)}
                                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                      <FiEdit2 size={14} />
                                    </button>
                                  </div>
                                )}
                                {gloss.gloss_index > 0 && (
                                  <span className="inline-block mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Variant {gloss.gloss_index}
                                  </span>
                                )}
                              </div>
                            ))}
                            {sense.domain_tags && sense.domain_tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {sense.domain_tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pronunciations */}
              {wordDetail.pronunciations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Pronunciations
                  </h3>
                  <div className="space-y-2">
                    {wordDetail.pronunciations.map((pron) => (
                      <div
                        key={pron.id}
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                          {pron.ipa}
                        </span>
                        {pron.notation && (
                          <span className="text-xs text-gray-500">
                            ({pron.notation})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forms */}
              {wordDetail.forms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Forms
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {wordDetail.forms.map((form) => (
                      <div
                        key={form.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                      >
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {form.form_type}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {form.form}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Terms */}
              {wordDetail.related_terms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Related Terms
                  </h3>
                  <div className="space-y-2">
                    {wordDetail.related_terms.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                          {rel.relation_type}:
                        </span>
                        <span className="font-medium">{rel.related_word}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'examples' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usage Examples ({wordDetail.examples.length})
                </h3>
                <button
                  onClick={handleGenerateExamples}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                  {isGenerating ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Generate Examples
                    </>
                  )}
                </button>
              </div>

              {wordDetail.examples.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No examples yet. Click "Generate Examples" to create some.
                </div>
              ) : (
                <div className="space-y-4">
                  {wordDetail.examples.map((example) => (
                    <div
                      key={example.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      {editingExampleId === example.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Yoruba
                            </label>
                            <input
                              type="text"
                              value={editedExampleYoruba}
                              onChange={(e) => setEditedExampleYoruba(e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              English
                            </label>
                            <input
                              type="text"
                              value={editedExampleEnglish}
                              onChange={(e) => setEditedExampleEnglish(e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateExample(example.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                            >
                              <FiSave />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingExampleId(null)}
                              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <p className="text-gray-900 dark:text-white font-medium">
                              {example.example_yoruba}
                            </p>
                            {example.example_english && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {example.example_english}
                              </p>
                            )}
                            {example.audio_url && (
                              <button
                                onClick={() => playAudio(example.audio_url!, `example-${example.id}`)}
                                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-2 text-sm"
                              >
                                <FiVolume2 />
                                {playingAudio === `example-${example.id}` ? 'Playing...' : 'Play Audio'}
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditExample(example)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDeleteExample(example.id)}
                              disabled={isSubmitting}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'audio' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Audio Files ({wordDetail.audio_files?.length ?? 0})
                </h3>
                <button
                  onClick={handleRegenerateAudio}
                  disabled={isRegeneratingAudio}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                  {isRegeneratingAudio ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw />
                      Regenerate Audio
                    </>
                  )}
                </button>
              </div>

              {(wordDetail.audio_files?.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No audio files available. Click "Regenerate Audio" to create audio for this word.
                </div>
              ) : (
                <div className="space-y-3">
                  {wordDetail.audio_files?.map((audio) => (
                    <div
                      key={audio.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {audio.provider}
                          </span>
                          {audio.voice_id && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {audio.voice_id}
                            </span>
                          )}
                        </div>
                        {audio.format && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {audio.format.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => playAudio(audio.audio_url, `audio-${audio.id}`)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 text-sm"
                      >
                        <FiVolume2 />
                        {playingAudio === `audio-${audio.id}` ? 'Playing...' : 'Play'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
