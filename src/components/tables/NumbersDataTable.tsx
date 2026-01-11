import React, { useState } from "react";
import { FiEdit, FiTrash2, FiHash, FiVolume2 } from "react-icons/fi";

interface Number {
  id: string;
  language_id: string;
  number_value: number;
  number_type: string;
  word: string;
  word_normalized: string;
  is_compound: boolean;
  number_system: string;
  difficulty_level: number;
  is_active: boolean;
  audio?: Array<{
    id: string;
    s3_bucket_key: string;
    audio_duration_sec?: number;
  }>;
}

interface Language {
  id: string;
  name: string;
}

interface Props {
  numbers: Number[];
  isLoading: boolean;
  onEdit: (number: Number) => void;
  onDelete: (id: string) => void;
  languages: Language[];
}

const NumbersDataTable: React.FC<Props> = ({ 
  numbers, 
  isLoading, 
  onEdit, 
  onDelete,
  languages 
}) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const getLanguageName = (languageId: string) => {
    const lang = languages.find((l) => l.id === languageId);
    return lang?.name || "Unknown";
  };

  const playAudio = (s3Key: string) => {
    setPlayingAudio(s3Key);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    console.log('🎵 Audio key:', s3Key);
    console.warn('⚠️ Backend audio endpoint not configured. Audio files cannot be played.');
    console.info('ℹ️ The backend at', baseUrl, 'needs to serve audio files from:', s3Key);
    console.info('ℹ️ Configure the backend to either:');
    console.info('  1. Serve static files from /audio/ directory');
    console.info('  2. Add API endpoint: /api/v1/audio/* to serve files');
    console.info('  3. Return pre-signed S3 URLs in the API response');
    
    setPlayingAudio(null);
  };

  const getDifficultyBadge = (level: number) => {
    const colors = {
      1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      2: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      3: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      4: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      5: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[level as keyof typeof colors] || colors[3];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <FiHash className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No numbers found</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Try adjusting your filters or add new numbers
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Value</th>
            <th scope="col" className="px-6 py-3">Word</th>
            <th scope="col" className="px-6 py-3">Language</th>
            <th scope="col" className="px-6 py-3">Type</th>
            <th scope="col" className="px-6 py-3">System</th>
            <th scope="col" className="px-6 py-3">Difficulty</th>
            <th scope="col" className="px-6 py-3">Compound</th>
            <th scope="col" className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {numbers.map((number) => (
            <tr
              key={number.id}
              className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {/* Value */}
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                {number.number_value}
              </td>

              {/* Word */}
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {number.word}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {number.word_normalized}
                  </div>
                </div>
              </td>

              {/* Language */}
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300">
                  {getLanguageName(number.language_id)}
                </span>
              </td>

              {/* Type */}
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  {number.number_type}
                </span>
              </td>

              {/* Number System */}
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  number.number_system === 'vigesimal' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {number.number_system}
                </span>
              </td>

              {/* Difficulty */}
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadge(number.difficulty_level)}`}>
                  Level {number.difficulty_level}
                </span>
              </td>

              {/* Compound */}
              <td className="px-6 py-4">
                {number.is_compound ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                    Compound
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Simple
                  </span>
                )}
              </td>
udio */}
              <td className="px-4 py-3">
                {number.audio && number.audio.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playAudio(number.audio![0].s3_bucket_key)}
                      disabled={playingAudio === number.audio![0].s3_bucket_key}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30"
                    >
                      <FiVolume2
                        className={`h-3.5 w-3.5 ${playingAudio === number.audio![0].s3_bucket_key ? "animate-pulse" : ""}`}
                      />
                      {number.audio[0].audio_duration_sec
                        ? `${number.audio[0].audio_duration_sec.toFixed(1)}s`
                        : "Play"}
                    </button>
                    <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                  </div>
                ) : (
                  <span className="text-xs italic text-gray-400 dark:text-gray-500">
                    No audio
                  </span>
                )}
              </td>

              {/* A
              {/* Actions */}
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(number)}
                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(number.id)}
                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NumbersDataTable;
