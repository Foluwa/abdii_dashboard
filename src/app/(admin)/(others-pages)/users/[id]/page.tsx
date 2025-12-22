"use client";

import React from "react";
import { useUserDetail } from "@/hooks/useApi";
import { useParams } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/SimpleAlert";
import StatusBadge from "@/components/admin/StatusBadge";
import type { UserRole } from "@/types/auth";

export default function UserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);
  const { user, isLoading, isError } = useUserDetail(userId);

  const getRoleBadgeStatus = (userRole: UserRole) => {
    switch (userRole) {
      case "admin":
        return "error" as const;
      case "manager":
        return "warning" as const;
      case "user":
        return "info" as const;
      default:
        return "info" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="User Details" />
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800 animate-pulse">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="User Details" />
        <Alert variant="error">
          Failed to load user details. The user may not exist or there was an API error.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageBreadCrumb pageTitle="User Details" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detailed information for user #{user.id}
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Information
          </h3>
          <div className="flex gap-2">
            <StatusBadge status={getRoleBadgeStatus(user.role)} label={user.role} />
            <StatusBadge status={user.is_active ? "success" : "error"} 
              label={user.is_active ? "Active" : "Inactive"} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Name
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.name || "Not set"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.email || "Not set"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Telegram ID
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.telegram_id || "Not connected"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Telegram Username
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.telegram_username ? `@${user.telegram_username}` : "Not set"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Current Streak
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.current_streak} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Longest Streak
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.longest_streak} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              XP Points
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.xp_points.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Created At
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Last Login
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Last Active
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {user.last_active ? new Date(user.last_active).toLocaleString() : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* Learning Progress Card */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Learning Progress
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="p-4 text-center border border-gray-200 rounded-lg dark:border-gray-800">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {user.lessons_completed}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Lessons Completed
            </p>
          </div>

          <div className="p-4 text-center border border-gray-200 rounded-lg dark:border-gray-800">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {user.words_learned}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Words Learned
            </p>
          </div>

          <div className="p-4 text-center border border-gray-200 rounded-lg dark:border-gray-800">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {user.quizzes_taken}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Quizzes Taken
            </p>
          </div>

          <div className="p-4 text-center border border-gray-200 rounded-lg dark:border-gray-800">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {user.quiz_score_avg ? `${user.quiz_score_avg.toFixed(1)}%` : "N/A"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Average Quiz Score
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
