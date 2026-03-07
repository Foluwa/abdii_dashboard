'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import StatusBadge from '@/components/admin/StatusBadge';
import { useToast } from '@/contexts/ToastContext';
import { useAdminCoursesList, useCourseCurriculumByKey } from '@/hooks/useApi';
import type { CurriculumSection, CurriculumUnit } from '@/types/curriculum';
import {
  moveCourseSection,
  reorderCourseSections,
  reorderCourseUnits,
} from '@/lib/adminCurriculumApi';

const DND_TYPES = {
  UNIT: 'UNIT',
  SECTION: 'SECTION',
} as const;

type DraftUnit = CurriculumUnit & { sections: CurriculumSection[] };

type UnitDragItem = { type: typeof DND_TYPES.UNIT; index: number };

type SectionDragItem = {
  type: typeof DND_TYPES.SECTION;
  unitKey: string;
  index: number;
};

function reorderList<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function UnitRow({
  unit,
  index,
  moveUnit,
  moveSection,
}: {
  unit: DraftUnit;
  index: number;
  moveUnit: (from: number, to: number) => void;
  moveSection: (fromUnit: string, fromIndex: number, toUnit: string, toIndex: number) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag<UnitDragItem, void, { isDragging: boolean }>({
    type: DND_TYPES.UNIT,
    item: { type: DND_TYPES.UNIT, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, dropRef] = useDrop<UnitDragItem>({
    accept: DND_TYPES.UNIT,
    hover: (item) => {
      if (item.index === index) return;
      moveUnit(item.index, index);
      item.index = index;
    },
  });

  const [, sectionDropRef] = useDrop<SectionDragItem>({
    accept: DND_TYPES.SECTION,
    drop: (item) => {
      if (item.unitKey === unit.unit_key && item.index === unit.sections.length) return;
      moveSection(item.unitKey, item.index, unit.unit_key, unit.sections.length);
      item.unitKey = unit.unit_key;
      item.index = unit.sections.length;
    },
  });

  const attachDropRef = (el: HTMLDivElement | null) => {
    dropRef(el);
  };

  const attachDragRef = (el: HTMLDivElement | null) => {
    dragRef(el);
  };

  const attachSectionDropRef = (el: HTMLDivElement | null) => {
    sectionDropRef(el);
  };

  return (
    <div ref={attachDropRef} className={`rounded-lg border border-gray-200 dark:border-gray-800 ${isDragging ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 dark:bg-gray-900">
        <div className="flex items-center gap-3" ref={attachDragRef}>
          <span className="cursor-grab text-lg text-gray-400">==</span>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{unit.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{unit.unit_key}</div>
          </div>
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

      <div ref={attachSectionDropRef} className="space-y-2 px-4 py-3">
        {unit.sections.map((section, sectionIndex) => (
          <SectionRow
            key={`${section.section_key}-${section.id}`}
            section={section}
            unitKey={unit.unit_key}
            index={sectionIndex}
            moveSection={moveSection}
          />
        ))}
        {unit.sections.length === 0 && (
          <div className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Drag sections here
          </div>
        )}
      </div>
    </div>
  );
}

function SectionRow({
  section,
  unitKey,
  index,
  moveSection,
}: {
  section: CurriculumSection;
  unitKey: string;
  index: number;
  moveSection: (fromUnit: string, fromIndex: number, toUnit: string, toIndex: number) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag<SectionDragItem, void, { isDragging: boolean }>({
    type: DND_TYPES.SECTION,
    item: { type: DND_TYPES.SECTION, unitKey, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, dropRef] = useDrop<SectionDragItem>({
    accept: DND_TYPES.SECTION,
    hover: (item) => {
      if (item.unitKey === unitKey && item.index === index) return;
      moveSection(item.unitKey, item.index, unitKey, index);
      item.unitKey = unitKey;
      item.index = index;
    },
  });

  const attachDropRef = (el: HTMLDivElement | null) => {
    dropRef(el);
  };

  const attachDragRef = (el: HTMLDivElement | null) => {
    dragRef(el);
  };

  return (
    <div
      ref={attachDropRef}
      className={`flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div ref={attachDragRef} className="flex items-center gap-3">
        <span className="cursor-grab text-gray-400">::</span>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{section.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{section.section_key}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {section.blueprint_key ? 'Playable' : 'Coming soon'}
      </div>
    </div>
  );
}

export default function CurriculumEditorPage() {
  const toast = useToast();
  const { data: courses, isLoading: coursesLoading } = useAdminCoursesList({ limit: 200 });

  const courseOptions = courses?.items ?? [];
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>('');

  useEffect(() => {
    if (!selectedCourseKey && courseOptions.length > 0) {
      setSelectedCourseKey(courseOptions[0].course_key);
    }
  }, [courseOptions, selectedCourseKey]);

  const {
    curriculum,
    isLoading: curriculumLoading,
    isError,
    refresh,
  } = useCourseCurriculumByKey(selectedCourseKey || null);

  const [draftUnits, setDraftUnits] = useState<DraftUnit[]>([]);
  const [lastSavedUnits, setLastSavedUnits] = useState<DraftUnit[]>([]);
  const [initialSectionUnits, setInitialSectionUnits] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const buildSectionUnitMap = (units: DraftUnit[]) => {
    const mapping: Record<string, string> = {};
    units.forEach((unit) => {
      unit.sections.forEach((section) => {
        mapping[section.section_key] = unit.unit_key;
      });
    });
    return mapping;
  };

  useEffect(() => {
    if (!curriculum) return;
    const nextUnits = curriculum.units.map((u) => ({ ...u, sections: [...u.sections] }));
    setDraftUnits(nextUnits);
    setLastSavedUnits(nextUnits);
    setInitialSectionUnits(buildSectionUnitMap(nextUnits));
  }, [curriculum]);

  const moveUnit = (from: number, to: number) => {
    setDraftUnits((prev) => reorderList(prev, from, to));
  };

  const moveSection = (fromUnit: string, fromIndex: number, toUnit: string, toIndex: number) => {
    setDraftUnits((prev) => {
      const next = prev.map((u) => ({ ...u, sections: [...u.sections] }));
      const sourceUnit = next.find((u) => u.unit_key === fromUnit);
      const targetUnit = next.find((u) => u.unit_key === toUnit);
      if (!sourceUnit || !targetUnit) return prev;

      const [moved] = sourceUnit.sections.splice(fromIndex, 1);
      targetUnit.sections.splice(toIndex, 0, moved);
      return next;
    });
  };

  const saveChanges = async () => {
    if (!selectedCourseKey) return;
    setIsSaving(true);
    try {
      let updatedCurriculum = null;
      const unitPayload = draftUnits.map((u, index) => ({
        unit_key: u.unit_key,
        order_index: index,
      }));

      const sectionPayload = draftUnits.flatMap((u) =>
        u.sections.map((s, index) => ({
          unit_key: u.unit_key,
          section_key: s.section_key,
          order_index: index,
        }))
      );

      const movedSections = draftUnits.flatMap((u) =>
        u.sections
          .filter((s) => initialSectionUnits[s.section_key] && initialSectionUnits[s.section_key] !== u.unit_key)
          .map((s, index) => ({
            section_key: s.section_key,
            from_unit_key: initialSectionUnits[s.section_key],
            to_unit_key: u.unit_key,
            order_index: index,
          }))
      );

      for (const move of movedSections) {
        const result = await moveCourseSection(selectedCourseKey, move);
        if (result?.curriculum) updatedCurriculum = result.curriculum;
      }

      if (unitPayload.length > 0) {
        const result = await reorderCourseUnits(selectedCourseKey, unitPayload);
        if (result?.curriculum) updatedCurriculum = result.curriculum;
      }

      if (sectionPayload.length > 0) {
        const result = await reorderCourseSections(selectedCourseKey, sectionPayload);
        if (result?.curriculum) updatedCurriculum = result.curriculum;
      }

      toast.success('Saved');
      if (updatedCurriculum) {
        const nextUnits = updatedCurriculum.units.map((u) => ({ ...u, sections: [...u.sections] }));
        setDraftUnits(nextUnits);
        setLastSavedUnits(nextUnits);
        setInitialSectionUnits(buildSectionUnitMap(nextUnits));
      } else {
        setLastSavedUnits(draftUnits);
        await refresh();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save curriculum');
      setDraftUnits(lastSavedUnits.map((u) => ({ ...u, sections: [...u.sections] })));
      setInitialSectionUnits(buildSectionUnitMap(lastSavedUnits));
    } finally {
      setIsSaving(false);
    }
  };

  const copyJson = async () => {
    try {
      const payload = { ...curriculum, units: draftUnits };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Curriculum JSON copied');
    } catch {
      toast.error('Failed to copy JSON');
    }
  };

  const title = useMemo(() => {
    const match = courseOptions.find((c) => c.course_key === selectedCourseKey);
    return match ? `${match.title} (${match.course_key})` : 'Curriculum Editor';
  }, [courseOptions, selectedCourseKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageBreadCrumb pageTitle="Curriculum Editor" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Drag units and sections to set the learning path order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyJson}
            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
          >
            Copy JSON
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="courseKey" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Course
          </label>
          <select
            id="courseKey"
            value={selectedCourseKey}
            onChange={(e) => setSelectedCourseKey(e.target.value)}
            className="min-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {courseOptions.map((course) => (
              <option key={course.id} value={course.course_key}>
                {course.title}
              </option>
            ))}
          </select>
          {coursesLoading && (
            <span className="text-xs text-gray-500">Loading courses…</span>
          )}
          <span className="text-xs text-gray-500">{title}</span>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load curriculum. Check your API connection.
        </div>
      )}

      {curriculumLoading && (
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span>Loading curriculum…</span>
        </div>
      )}

      {!curriculumLoading && !isError && (
        <DndProvider backend={HTML5Backend}>
          <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
            <div className="space-y-4">
              {draftUnits.map((unit, idx) => (
                <UnitRow
                  key={unit.id}
                  unit={unit}
                  index={idx}
                  moveUnit={moveUnit}
                  moveSection={moveSection}
                />
              ))}
              {draftUnits.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800">
                  No units found for this course.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tips</h3>
                <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li>Drag units to reorder the overall learning path.</li>
                  <li>Drag sections within or between units to move them.</li>
                  <li>Press Save to persist the ordering to mobile.</li>
                </ul>
              </div>
            </div>
          </div>
        </DndProvider>
      )}
    </div>
  );
}
