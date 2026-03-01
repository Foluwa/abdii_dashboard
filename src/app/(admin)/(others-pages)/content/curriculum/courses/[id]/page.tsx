'use client';

import React, { useMemo, useState } from 'react';

import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Alert from '@/components/ui/alert/SimpleAlert';
import Toast from '@/components/ui/toast/Toast';
import { ConfirmationModal } from '@/components/ui/modal/ConfirmationModal';
import StatusBadge from '@/components/admin/StatusBadge';

import ValidationResultViewer from '@/components/admin/curriculum/ValidationResultViewer';
import { useAdminCourse, useCourseCurriculum } from '@/hooks/useApi';
import { useCurriculumManagement } from '@/hooks/useCurriculumManagement';

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = React.use(params);

  const {
    data: adminData,
    isLoading: isLoadingAdmin,
    isError: adminError,
    refresh: refreshAdmin,
    mutate: mutateAdmin,
  } = useAdminCourse(courseId);

  const {
    curriculum,
    isLoading: isLoadingCurriculum,
    isError: curriculumError,
  } = useCourseCurriculum(courseId);

  const {
    validateCourse,
    publishCourse,
    unpublishCourse,
    isValidating,
    isPublishing,
    isUnpublishing,
  } = useCurriculumManagement();

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);

  const course = adminData?.course;
  const validation = adminData?.validation;
  const canPublish = !!validation?.can_publish;

  const statusBadge = useMemo(() => {
    const status = course?.status;
    if (!status) return <StatusBadge status="info" label="Unknown" />;
    if (status === 'published') return <StatusBadge status="published" />;
    if (status === 'draft') return <StatusBadge status="draft" />;
    if (status === 'archived') return <StatusBadge status="archived" />;
    return <StatusBadge status="info" label={status} />;
  }, [course?.status]);

  const enabledBadge = course?.enabled ? (
    <StatusBadge status="active" label="Enabled" />
  ) : (
    <StatusBadge status="inactive" label="Disabled" />
  );

  const availabilityBadge = curriculum?.availability ? (
    <StatusBadge
      status={
        curriculum.availability === 'available'
          ? 'success'
          : curriculum.availability === 'coming_soon'
          ? 'pending'
          : 'inactive'
      }
      label={curriculum.availability}
    />
  ) : (
    <StatusBadge status="info" label={isLoadingCurriculum ? 'Loading…' : '—'} />
  );

  const handleValidate = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const next = await validateCourse(courseId);
      await mutateAdmin(next, { revalidate: false });
      setSuccessMessage('Course validation completed.');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to validate course');
    }
  };

  const handlePublish = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const outcome = await publishCourse(courseId);
      await mutateAdmin(outcome.body, { revalidate: false });

      if (outcome.ok) {
        setSuccessMessage('Course published.');
      } else {
        setErrorMessage('Publish blocked by server validation (409). Review issues below.');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to publish course');
    }
  };

  const handleUnpublish = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await unpublishCourse(courseId);
      setSuccessMessage('Course unpublished (archived).');
      await refreshAdmin();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to unpublish course');
    }
  };

  if (adminError || curriculumError) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Course" />
        <Alert variant="error">
          Failed to load course details. Please check your API connection.
        </Alert>
      </div>
    );
  }

  if (isLoadingAdmin || !adminData) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Course" />
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" />
          <span>Loading course…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageBreadCrumb pageTitle="Course" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Course validation and publishing (server-authoritative)
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

      {/* Course summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Course Key</dt>
              <dd className="text-gray-900 dark:text-white font-mono break-all">{course?.course_key}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Title</dt>
              <dd className="text-gray-900 dark:text-white">{course?.title}</dd>
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
          {isLoadingCurriculum && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading curriculum overview…</p>
          )}
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">IDs</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-400">Course ID</dt>
              <dd className="text-gray-900 dark:text-white font-mono break-all">{course?.id}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ValidationResultViewer validation={validation} />

      {/* Minimal units/sections overview */}
      <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Units & Sections</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Minimal overview: availability + blueprint presence per section
          </p>
        </div>

        <div className="p-4">
          {!curriculum ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No curriculum data available.</div>
          ) : curriculum.units.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No units found.</div>
          ) : (
            <div className="space-y-4">
              {curriculum.units.map((unit) => (
                <div key={unit.id} className="border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {unit.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">{unit.unit_key}</div>
                    </div>
                    <StatusBadge
                      status={
                        unit.availability === 'available'
                          ? 'success'
                          : unit.availability === 'coming_soon'
                          ? 'pending'
                          : 'inactive'
                      }
                      label={unit.availability}
                    />
                  </div>

                  <div className="p-3">
                    {unit.sections.length === 0 ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">No sections.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 dark:text-gray-400">
                              <th className="py-2">Section</th>
                              <th className="py-2">Availability</th>
                              <th className="py-2">Blueprint</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {unit.sections.map((section) => (
                              <tr key={section.id} className="text-gray-900 dark:text-white">
                                <td className="py-2">
                                  <div className="font-medium">{section.title}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                    {section.section_key}
                                  </div>
                                </td>
                                <td className="py-2">
                                  <StatusBadge
                                    status={
                                      section.availability === 'available'
                                        ? 'success'
                                        : section.availability === 'coming_soon'
                                        ? 'pending'
                                        : 'inactive'
                                    }
                                    label={section.availability}
                                  />
                                </td>
                                <td className="py-2">
                                  {section.lesson_blueprint_id ? (
                                    <div className="space-y-1">
                                      <StatusBadge status="success" label="Present" />
                                      {section.blueprint_key && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                                          {section.blueprint_key}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <StatusBadge status="warning" label="Missing" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        onConfirm={async () => {
          await handlePublish();
          setConfirmPublishOpen(false);
        }}
        title="Publish course"
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
        title="Unpublish course"
        message="Unpublishing archives the course and disables it. Continue?"
        confirmText="Unpublish"
        cancelText="Cancel"
        variant="danger"
        isLoading={isUnpublishing}
      />
    </div>
  );
}
