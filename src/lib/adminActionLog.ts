export type AdminActionOutcome = 'success' | 'blocked' | 'failed';

export interface AdminCurriculumBulkActionLog {
  feature: 'curriculum';
  entity: 'course' | 'lesson_blueprint';
  action: 'validate' | 'publish' | 'unpublish';
  scope: 'single' | 'bulk';
  requested_count: number;
  outcomes: {
    success: number;
    blocked: number;
    failed: number;
  };
  details?: Record<string, unknown>;
  timestamp: string;
}

export function logAdminCurriculumAction(event: Omit<AdminCurriculumBulkActionLog, 'timestamp' | 'feature'> & { details?: Record<string, unknown> }) {
  const payload: AdminCurriculumBulkActionLog = {
    feature: 'curriculum',
    timestamp: new Date().toISOString(),
    ...event,
  };

  // Console logging is the lowest-friction structured log sink.
  // It can be picked up by browser log forwarders if configured.
  // Keep payload JSON-safe.
  console.info('ADMIN_ACTION', payload);
}
