import { useState } from 'react';

import {
  publishAdminBlueprint,
  publishAdminCourse,
  unpublishAdminBlueprint,
  unpublishAdminCourse,
  validateAdminBlueprint,
  validateAdminCourse,
} from '@/lib/adminCurriculumApi';

export function useCurriculumManagement() {
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const validateBlueprint = async (blueprintId: string) => {
    setIsValidating(true);
    try {
      return await validateAdminBlueprint(blueprintId);
    } finally {
      setIsValidating(false);
    }
  };

  const publishBlueprint = async (blueprintId: string) => {
    setIsPublishing(true);
    try {
      return await publishAdminBlueprint(blueprintId);
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishBlueprint = async (blueprintId: string) => {
    setIsUnpublishing(true);
    try {
      return await unpublishAdminBlueprint(blueprintId);
    } finally {
      setIsUnpublishing(false);
    }
  };

  const validateCourse = async (courseId: string) => {
    setIsValidating(true);
    try {
      return await validateAdminCourse(courseId);
    } finally {
      setIsValidating(false);
    }
  };

  const publishCourse = async (courseId: string) => {
    setIsPublishing(true);
    try {
      return await publishAdminCourse(courseId);
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishCourse = async (courseId: string) => {
    setIsUnpublishing(true);
    try {
      return await unpublishAdminCourse(courseId);
    } finally {
      setIsUnpublishing(false);
    }
  };

  return {
    validateBlueprint,
    publishBlueprint,
    unpublishBlueprint,
    validateCourse,
    publishCourse,
    unpublishCourse,
    isValidating,
    isPublishing,
    isUnpublishing,
  };
}
