"use client";

import React, { useState } from "react";
import { useAppSettings } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/SimpleAlert";
import { AppSetting } from "@/types/api";

export default function AppConfigPage() {
  const { user, isAdmin } = useAuth();
  const { settings, isLoading, isError, refresh } = useAppSettings();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const startEdit = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    setEditValue(JSON.stringify(setting.setting_value, null, 2));
    setEditDescription(setting.description || "");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
    setEditDescription("");
  };

  const saveEdit = async (key: string) => {
    if (!key) {
      setErrorMessage("Invalid setting key");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    try {
      // Parse JSON value
      const parsedValue = JSON.parse(editValue);
      
      const payload = {
        setting_value: parsedValue,
        description: editDescription || null,
      };

      await apiClient.put(`/api/v1/admin/configs/app-settings/${key}`, payload);
      setSuccessMessage(`✓ Setting "${key}" updated successfully`);
      setEditingKey(null);
      refresh();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        setErrorMessage("Invalid JSON format. Please check your syntax.");
      } else {
        setErrorMessage(error.response?.data?.detail || "Failed to update setting");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const categories = settings
    ? Array.from(new Set(settings.map((s) => s.category).filter(Boolean)))
    : [];
  
  const filteredSettings = settings.filter(
    (setting) => filterCategory === "all" || setting.category === filterCategory
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="App Settings" />
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorStatus = isError?.response?.status;
    let errorMessage: string;
    
    if (errorStatus === 401) {
      errorMessage = "Your session has expired. Please log in again.";
    } else if (errorStatus === 403) {
      errorMessage = `You don't have permission to view app settings. Your role: ${user?.role || 'unknown'}. Admin role required.`;
    } else {
      errorMessage = "Failed to load app settings. Please check your API connection.";
    }
    
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="App Settings" />
        <Alert variant="error">
          {errorMessage}
        </Alert>
      </div>
    );
  }

  // Show warning if user is not admin but somehow got here
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="App Settings" />
        <Alert variant="warning">
          This page requires admin privileges. Your current role: {user?.role || 'unknown'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <PageBreadCrumb pageTitle="App Settings" />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage application-wide settings with JSON configuration
        </p>
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter:
          </span>
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              filterCategory === "all"
                ? "bg-brand-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All ({settings.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterCategory === cat
                  ? "bg-brand-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {cat} ({settings.filter((s) => s.category === cat).length})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredSettings.length === 0 ? (
          <div className="p-8 text-center bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No settings found in this category
            </p>
          </div>
        ) : (
          filteredSettings.map((setting) => (
            <div
              key={setting.setting_key}
              className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {setting.setting_key}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900">
                        {setting.category}
                      </span>
                      {setting.is_public && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:text-green-300 dark:bg-green-900">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  {editingKey !== setting.setting_key && (
                    <button
                      onClick={() => startEdit(setting)}
                      className="px-3 py-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingKey === setting.setting_key ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Configuration (JSON)
                      </label>
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 text-sm font-mono bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder='{"key": "value"}'
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Enter valid JSON format
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="Describe this setting..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(setting.setting_key)}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                      {JSON.stringify(setting.setting_value, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(setting.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          📖 Flashcard Settings Guide
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>flashcards.word_order</strong> - Controls how words are ordered in flashcard sessions:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                strategy: "recommended"
              </code>{" "}
              - Order by lesson → frequency → alphabetical
            </li>
            <li>
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                strategy: "random"
              </code>{" "}
              - Fully randomized order
            </li>
            <li>
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                strategy: "alphabetical"
              </code>{" "}
              - Sort A-Z by word
            </li>
            <li>
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                randomize: true
              </code>{" "}
              - Override any strategy with random
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
