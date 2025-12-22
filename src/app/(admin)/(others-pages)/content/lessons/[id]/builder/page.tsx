"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { Lesson, Word, Sentence, Phrase, Proverb } from "@/types/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/SimpleAlert";

type ContentType = "word" | "sentence" | "phrase" | "proverb";

interface LessonContent {
  content_type: ContentType;
  content_id: string;
  order: number;
  item?: any; // The actual content item
}

export default function LessonBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent[]>([]);
  const [availableContent, setAvailableContent] = useState<{
    words: Word[];
    sentences: Sentence[];
    phrases: Phrase[];
    proverbs: Proverb[];
  }>({
    words: [],
    sentences: [],
    phrases: [],
    proverbs: [],
  });
  
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("word");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

  useEffect(() => {
    if (lesson?.language_id) {
      loadAvailableContent();
    }
  }, [lesson?.language_id, selectedContentType]);

  const loadLessonData = async () => {
    try {
      const response = await apiClient.get(`/api/v1/admin/lessons/${lessonId}`);
      setLesson(response.data);
      
      // Load lesson content
      const contentResponse = await apiClient.get(`/api/v1/admin/lessons/${lessonId}/content`);
      setLessonContent(contentResponse.data.items || []);
      
      setIsLoading(false);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to load lesson");
      setIsLoading(false);
    }
  };

  const loadAvailableContent = async () => {
    if (!lesson?.language_id) return;

    try {
      const endpoints: Record<ContentType, string> = {
        word: `/api/v1/admin/words?language_id=${lesson.language_id}&page=1&limit=100`,
        sentence: `/api/v1/admin/sentences?language_id=${lesson.language_id}&page=1&limit=100`,
        phrase: `/api/v1/admin/phrases?language_id=${lesson.language_id}&page=1&limit=100`,
        proverb: `/api/v1/admin/proverbs?language_id=${lesson.language_id}&page=1&limit=100`,
      };

      const response = await apiClient.get(endpoints[selectedContentType]);
      
      setAvailableContent(prev => ({
        ...prev,
        [`${selectedContentType}s`]: response.data.items || [],
      }));
    } catch (error) {
      console.error("Failed to load content:", error);
    }
  };

  const addContentToLesson = (contentId: string, contentType: ContentType) => {
    // Check if already added
    const exists = lessonContent.some(
      (item) => item.content_id === contentId && item.content_type === contentType
    );
    
    if (exists) {
      setErrorMessage("This content is already in the lesson");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const newContent: LessonContent = {
      content_type: contentType,
      content_id: contentId,
      order: lessonContent.length + 1,
    };

    setLessonContent([...lessonContent, newContent]);
  };

  const removeContent = (index: number) => {
    const updated = lessonContent.filter((_, i) => i !== index);
    // Re-order
    updated.forEach((item, i) => {
      item.order = i + 1;
    });
    setLessonContent(updated);
  };

  const moveContent = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessonContent.length) return;

    const updated = [...lessonContent];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Re-order
    updated.forEach((item, i) => {
      item.order = i + 1;
    });
    
    setLessonContent(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await apiClient.put(`/api/v1/admin/lessons/${lessonId}/content`, {
        content: lessonContent.map(item => ({
          content_type: item.content_type,
          content_id: item.content_id,
          order: item.order,
        })),
      });
      
      setSuccessMessage("Lesson content saved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to save lesson content");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!lesson) return;

    try {
      await apiClient.put(`/api/v1/admin/lessons/${lessonId}`, {
        ...lesson,
        status: "published",
      });
      setSuccessMessage("Lesson published successfully");
      router.push("/content/lessons");
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Failed to publish lesson");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Lesson Builder" />
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Lesson Builder" />
        <Alert variant="error">Lesson not found</Alert>
      </div>
    );
  }

  const filteredContent = availableContent[`${selectedContentType}s` as keyof typeof availableContent].filter(
    (item: any) => {
      const text = selectedContentType === "word" 
        ? item.word 
        : item.text || item.yoruba_text || "";
      return text.toLowerCase().includes(searchQuery.toLowerCase());
    }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageBreadCrumb pageTitle={`Build: ${lesson.title}`} />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add and organize content for this lesson
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/content/lessons")}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Progress"}
          </button>
          {lesson.status === "draft" && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Publish Lesson
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Content */}
        <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Content
            </h3>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Content Type Selector */}
            <div className="flex gap-2">
              {(["word", "sentence", "phrase", "proverb"] as ContentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedContentType(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedContentType === type
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${selectedContentType}s...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />

            {/* Content List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {filteredContent.length > 0 ? (
                filteredContent.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => addContentToLesson(item.id, selectedContentType)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedContentType === "word" ? item.word : item.text || item.yoruba_text}
                        </p>
                        {item.translation && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.translation}
                          </p>
                        )}
                      </div>
                      <button className="text-brand-600 text-sm hover:text-brand-700">
                        + Add
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No {selectedContentType}s found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lesson Content ({lessonContent.length} items)
            </h3>
          </div>
          
          <div className="p-4">
            {lessonContent.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {lessonContent.map((item, index) => (
                  <div
                    key={`${item.content_type}-${item.content_id}-${index}`}
                    className="p-3 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">
                            #{item.order}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {item.content_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          ID: {item.content_id}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveContent(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveContent(index, "down")}
                          disabled={index === lessonContent.length - 1}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeContent(index)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No content added yet. Start by selecting content from the left panel.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
