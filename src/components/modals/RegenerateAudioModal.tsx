"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/ui/modal";
import { FiVolume2 } from "react-icons/fi";

interface Voice {
  id: string;
  name: string;
  provider: string;
  language_code: string;
}

interface RegenerateAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: {
    id: string;
    lemma: string;
    language_code: string;
  } | null;
  onSuccess?: () => void;
}

export function RegenerateAudioModal({ isOpen, onClose, word, onSuccess }: RegenerateAudioModalProps) {
  const toast = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [textOverride, setTextOverride] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  useEffect(() => {
    if (isOpen && word) {
      setTextOverride(word.lemma); // Default to word text
      fetchVoices();
    }
  }, [isOpen, word]);

  const fetchVoices = async () => {
    if (!word) return;
    
    setIsLoadingVoices(true);
    try {
      // Map ISO 639-3 to ISO 639-1 for TTS providers
      const languageCodeMap: { [key: string]: string } = {
        'yor': 'yo',  // Yoruba
        'eng': 'en',  // English
        'hau': 'ha',  // Hausa
        'ibo': 'ig',  // Igbo
        'swa': 'sw',  // Swahili
      };
      
      const ttsLanguageCode = languageCodeMap[word.language_code] || word.language_code;
      
      const response = await apiClient.get('/api/v1/admin/audio/voices', {
        params: {
          language_code: ttsLanguageCode,
          is_active: true
        }
      });
      
      const voicesList = response.data.items || [];
      setVoices(voicesList);
      
      // Auto-select first voice
      if (voicesList.length > 0) {
        setSelectedVoiceId(voicesList[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching voices:", error);
      toast.error("Failed to load voices");
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!word || !selectedVoiceId) {
      toast.error("Please select a voice");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/api/v1/admin/content/words/single/${word.id}/regenerate-audio`, {
        voice_id: selectedVoiceId,
        text_override: textOverride !== word.lemma ? textOverride : null
      });
      
      toast.success("Audio regeneration queued successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to regenerate audio");
    } finally {
      setIsLoading(false);
    }
  };

  if (!word) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Regenerate Audio: ${word.lemma}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Voice Provider *
          </label>
          
          {isLoadingVoices ? (
            <div className="text-sm text-gray-500">Loading voices...</div>
          ) : voices.length === 0 ? (
            <div className="text-sm text-red-600">
              No active voices found for {word.language_code}
            </div>
          ) : (
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.provider})
                </option>
              ))}
            </select>
          )}
          
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Choose the TTS provider and voice for audio generation
          </p>
        </div>

        {/* Text Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text to Speak
          </label>
          <input
            type="text"
            value={textOverride}
            onChange={(e) => setTextOverride(e.target.value)}
            placeholder={word.lemma}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Override the text sent to TTS (with tonal marks). Leave as default to use the word lemma.
          </p>
        </div>

        {/* Voice Preview Info */}
        {selectedVoiceId && (
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <FiVolume2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium">
                  {voices.find(v => v.id === selectedVoiceId)?.name}
                </p>
                <p className="text-xs mt-1 text-blue-700 dark:text-blue-400">
                  Provider: {voices.find(v => v.id === selectedVoiceId)?.provider} • 
                  Language: {word.language_code}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedVoiceId || voices.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
          >
            <FiVolume2 className="h-4 w-4" />
            {isLoading ? "Regenerating..." : "Regenerate Audio"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
