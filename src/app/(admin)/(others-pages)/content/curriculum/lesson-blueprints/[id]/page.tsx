'use client';

import React, { useMemo, useState } from 'react';

import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Alert from '@/components/ui/alert/SimpleAlert';
import Toast from '@/components/ui/toast/Toast';
import { ConfirmationModal } from '@/components/ui/modal/ConfirmationModal';
import StatusBadge from '@/components/admin/StatusBadge';

import ValidationResultViewer from '@/components/admin/curriculum/ValidationResultViewer';
import { useAdminBlueprint, usePublicBlueprint } from '@/hooks/useApi';
import { useCurriculumManagement } from '@/hooks/useCurriculumManagement';

export default function AdminLessonBlueprintDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const blueprintId = params.id;

  const {
    data: adminData,
    isLoading: isLoadingAdmin,
    isError: adminError,
    refresh: refreshAdmin,
    mutate: mutateAdmin,
  } = useAdminBlueprint(blueprintId);

  const {
    blueprint: publicBlueprint,
    isLoading: isLoadingPublic,
    isError: publicError,
  } = usePublicBlueprint(blueprintId);

  const {
    validateBlueprint,
    publishBlueprint,
    unpublishBlueprint,
    isValidating,
    isPublishing,
    isUnpublishing,
  } = useCurriculumManagement();

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);

  const blueprint = adminData?.blueprint;
  const validation = adminData?.validation;

  const canPublish = !!validation?.can_publish;

  const statusBadge = useMemo(() => {
    const status = blueprint?.status;
    if (!status) return <StatusBadge status="info" label="Unknown" />;
    if (status === 'published') return <StatusBadge status="published" />;
    if (status === 'draft') return <StatusBadge status="draft" />;
    if (status === 'archived') return <StatusBadge status="archived" />;
    return <StatusBadge status="info" label={status} />;
  }, [blueprint?.status]);

  const enabledBadge = blueprint?.enabled ? (
    <StatusBadge status="active" label="Enabled" />
  ) : (
    <StatusBadge status="inactive" label="Disabled" />
  );

  const availabilityBadge = publicBlueprint?.availability ? (
    <StatusBadge
      status={
        publicBlueprint.availability === 'available'
          ? 'success'
          : publicBlueprint.availability === 'coming_soon'
          ? 'pending'
          : 'inactive'
      }
      label={publicBlueprint.availability}
    />
  ) : (
    <StatusBadge status="info" label={isLoadingPublic ? 'Loading…' : '—'} />
  );

  const handleValidate = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const next = await validateBlueprint(blueprintId);
      await mutateAdmin(next, { revalidate: false });
      setSuccessMessage('Validation completed.');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to validate blueprint');
    }
  };

  const handlePublish = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const outcome = await publishBlueprint(blueprintId);
      await mutateAdmin(outcome.body, { revalidate: false });

      if (outcome.ok) {
        setSuccessMessage('Blueprint published.');
      } else {
        setErrorMessage('Publish blocked by server validation (409). Review issues below.');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to publish blueprint');
    }
  };

  const handleUnpublish = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await unpublishBlueprint(blueprintId);
      setSuccessMessage('Blueprint unpublished (archived).');
      await refreshAdmin();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to unpublish blueprint');
    }
  };

  if (adminError || publicError) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Lesson Blueprint" />
        <Alert variant="error">
          Failed to load blueprint details. Please check your API connection.
        </Alert>
      </div>
    );
  }

  if (isLoadingAdmin || !adminData) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Lesson Blueprint" />
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" />
          <span>Loading blueprint…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageBreadCrumb pageTitle="Lesson Blueprint" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Server-authoritative validation and publishing workflow
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleValidate}
            disabled={isValidating || isPublishing || isUnpublishing}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {isValidating ? 'Validating…' : 'Validate'}
          </button>

          <button
            onClick={() => setConfirmPublishOpen(true)}
            disabled={!canPublish || isValidating || isPublishing || isUnpublishing}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canPublish ? 'Publish disabled: fix blocking errors first' : undefined}
          >
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>

          <button
            onClick={() => setConfirmUnpublishOpen(true)}
            disabled={isValidating || isPublishing || isUnpublishing}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUnpublishing ? 'Unpublishing…' : 'Unpublish'}
          </button>
        </div>
      </div>

      {successMessage && (
        <Toast type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}
      {errorMessage && (
        <Toast type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
      )}

      {/* Blueprint summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Blueprint Key</dt>
              <dd className="text-gray-900 dark:text-white font-mono break-all">{blueprint?.blueprint_key}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Lesson Kind</dt>
              <dd className="text-gray-900 dark:text-white">{blueprint?.lesson_kind}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Schema Version</dt>
              <dd className="text-gray-900 dark:text-white">{blueprint?.schema_version}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Status</dt>
              <dd>{statusBadge}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Enabled</dt>
              <dd>{enabledBadge}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Availability</dt>
              <dd>{availabilityBadge}</dd>
            </div>
          </dl>
          {isLoadingPublic && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading availability…</p>
          )}
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">IDs</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Blueprint ID</dt>
              <dd className="text-gray-900 dark:text-white font-mono break-all">{blueprint?.id}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Course ID</dt>
              <dd className="text-gray-900 dark:text-white font-mono break-all">{blueprint?.course_id}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Section ID</dt>
              <dd className="text-gray-900 dark:text-white font-mono break-all">{blueprint?.section_id}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ValidationResultViewer validation={validation} />

      <ConfirmationModal
        isOpen={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        onConfirm={async () => {
          await handlePublish();
          setConfirmPublishOpen(false);
        }}
        title="Publish lesson blueprint"
        message="Publishing is server-authoritative and will re-run validation. Continue?"
        confirmText="Publish"
        cancelText="Cancel"
        variant="warning"
        isLoading={isPublishing}
      />

      <ConfirmationModal
        isOpen={confirmUnpublishOpen}
        onClose={() => setConfirmUnpublishOpen(false)}
        onConfirm={async () => {
          await handleUnpublish();
          setConfirmUnpublishOpen(false);
        }}
        title="Unpublish lesson blueprint"
        message="Unpublishing archives the blueprint and disables it. Continue?"
        confirmText="Unpublish"
        cancelText="Cancel"
        variant="danger"
        isLoading={isUnpublishing}
      />
    </div>
  );
}
