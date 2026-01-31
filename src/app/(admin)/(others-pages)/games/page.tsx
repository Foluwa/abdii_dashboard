"use client";

import React, { useState } from "react";
import { useGames, useLanguages } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import type { Game, Language, GameType } from "@/types/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Toast from "@/components/ui/toast/Toast";
import Alert from "@/components/ui/alert/Alert";
import { StyledSelect } from "@/components/ui/form/StyledSelect";
import StatusBadge from "@/components/admin/StatusBadge";
import { ConfirmationModal } from "@/components/ui/modal/ConfirmationModal";
import Link from "next/link";
import { FiGlobe, FiGrid } from "react-icons/fi";

export default function GamesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [gameType, setGameType] = useState<GameType | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { games, total, isLoading, isError, refresh } = useGames({ 
    language_id: selectedLanguage ? Number(selectedLanguage) : undefined, 
    game_type: gameType,
    page, 
    limit 
  });
  const { languages } = useLanguages();

  const [formData, setFormData] = useState({
    language_id: "",
    game_type: "flashcard" as GameType,
    name: "",
    description: "",
    rules: {} as Record<string, any>,
    config: {} as Record<string, any>,
    is_active: true,
  });

  const gameTypes: GameType[] = ["flashcard", "quiz", "matching", "fill_blank", "pronunciation"];

  const defaultGameRules: Record<GameType, Record<string, any>> = {
    flashcard: {
      show_pronunciation: true,
      auto_play_audio: true,
      shuffle_cards: true,
    },
    quiz: {
      questions_per_session: 10,
      time_limit_seconds: 30,
      show_correct_answer: true,
      randomize_options: true,
    },
    matching: {
      pairs_count: 6,
      time_limit_seconds: 60,
      show_hint: false,
    },
    fill_blank: {
      sentences_per_session: 10,
      show_word_bank: true,
      case_sensitive: false,
    },
    pronunciation: {
      attempts_allowed: 3,
      accuracy_threshold: 0.7,
      show_phonetic: true,
    },
  };

  const openCreateModal = () => {
    setEditingGame(null);
    setFormData({
      language_id: selectedLanguage || (languages?.[0]?.id ?? ""),
      game_type: "flashcard",
      name: "",
      description: "",
      rules: defaultGameRules.flashcard,
      config: { difficulty: "beginner", points_per_correct: 10 },
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormData({
      language_id: String(game.language_id),
      game_type: game.game_type,
      name: game.title,
      description: game.description || "",
      rules: game.rules || defaultGameRules[game.game_type],
      config: { difficulty: "beginner", points_per_correct: 10 },
      is_active: game.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGame(null);
    setErrorMessage("");
  };

  const handleGameTypeChange = (type: GameType) => {
    setFormData(prev => ({
      ...prev,
      game_type: type,
      rules: defaultGameRules[type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!formData.name.trim()) {
      setErrorMessage("Game name is required");
      return;
    }

    try {
      if (editingGame) {
        await apiClient.put(`/api/v1/admin/games/${editingGame.id}`, formData);
        setSuccessMessage("Game updated successfully");
      } else {
        await apiClient.post("/api/v1/admin/games", formData);
        setSuccessMessage("Game created successfully");
      }
      closeModal();
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to save game");
    }
  };

  const handleDeleteClick = (gameId: string, gameName: string) => {
    setDeleteConfirm({ id: gameId, name: gameName });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await apiClient.delete(`/api/v1/admin/games/${deleteConfirm.id}`);
      setSuccessMessage("Game deleted successfully");
      refresh();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to delete game");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const toggleGameStatus = async (gameId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/api/v1/admin/games/${gameId}`, {
        is_active: !currentStatus
      });
      setSuccessMessage(`Game ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to update game status");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Games Management" />
        <Alert variant="error" title="Error" message="Failed to load games. Please check your API connection." />
      </div>
    );
  }

  const totalPages = Math.ceil((total || 0) / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageBreadCrumb pageTitle="Games Management" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage language learning games and activities
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          + Create Game
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && <Toast type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
      {errorMessage && <Toast type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 dark:bg-gray-900 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <StyledSelect
              label="Language"
              value={selectedLanguage || ""}
              onChange={(e) => {
                setSelectedLanguage(e.target.value || undefined);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Languages" },
                ...(languages?.map((lang: Language) => ({ value: lang.id, label: lang.name })) || []),
              ]}
              fullWidth
            />
          </div>

          <div>
            <StyledSelect
              label="Game Type"
              value={gameType || ""}
              onChange={(e) => {
                setGameType((e.target.value as GameType) || undefined);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Types" },
                ...gameTypes.map((type) => ({
                  value: type,
                  label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                })),
              ]}
              fullWidth
            />
          </div>

          <div>
            <StyledSelect
              label="Per Page"
              value={limit.toString()}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              options={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
                { value: "50", label: "50" },
              ]}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Games Table - Desktop Only */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading games...</p>
          </div>
        ) : games && games.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {games.map((game: Game) => (
                    <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {game.title}
                          </div>
                          {game.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {game.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {languages?.find((l: Language) => Number(l.id) === game.language_id)?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {game.game_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          status={game.is_active ? "active" : "inactive"} 
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(game.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleGameStatus(String(game.id), game.is_active)}
                            className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            {game.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => openEditModal(game)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(String(game.id), game.title)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(page * limit, total || 0)}</span> of{" "}
                    <span className="font-medium">{total || 0}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No games found. Create your first game!</p>
          </div>
        )}
      </div>

      {/* Games Grid - Mobile Only */}
      <div className="lg:hidden">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading games...</p>
          </div>
        ) : games && games.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {games.map((game: Game) => (
              <div
                key={game.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              >
                {/* Game Title & Description */}
                <div className="mb-3">
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {game.title}
                  </div>
                  {game.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {game.description}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300">
                    {languages?.find((l: Language) => Number(l.id) === game.language_id)?.name || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {game.game_type.replace('_', ' ')}
                  </span>
                  <StatusBadge status={game.is_active ? "active" : "inactive"} />
                </div>

                {/* Created Date */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Created: {new Date(game.created_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                  <button
                    onClick={() => toggleGameStatus(String(game.id), game.is_active)}
                    className="w-full px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 rounded-lg transition-colors"
                  >
                    {game.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(game)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(String(game.id), game.title)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <p>No games found. Create your first game!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingGame ? "Edit Game" : "Create New Game"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <Alert variant="error" title="Error" message={errorMessage} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <StyledSelect
                    label="Language *"
                    value={formData.language_id}
                    onChange={(e) => setFormData({ ...formData, language_id: e.target.value })}
                    options={[
                      { value: "", label: "Select language" },
                      ...(languages?.map((lang: Language) => ({ value: lang.id, label: lang.name })) || []),
                    ]}
                    fullWidth
                    required
                  />
                </div>

                <div>
                  <StyledSelect
                    label="Game Type *"
                    value={formData.game_type}
                    onChange={(e) => handleGameTypeChange(e.target.value as GameType)}
                    options={gameTypes.map((type) => ({
                      value: type,
                      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    }))}
                    fullWidth
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Game Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="e.g., Beginner Flashcards"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Brief description of the game"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Game Rules (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.rules, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, rules: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                  placeholder='{"show_pronunciation": true}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Define game-specific rules and settings
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-brand-600 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  {editingGame ? "Update Game" : "Create Game"}
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
        title="Delete Game"
        message={`Are you sure you want to delete game "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
