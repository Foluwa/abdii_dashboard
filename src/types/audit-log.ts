export type AdminAuditLogDetails = Record<string, unknown> | null;

export interface AdminAuditLogItem {
  id: string;
  created_at: string;
  admin_user_id: string;
  actor_email?: string | null;
  actor_display_name?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  details?: AdminAuditLogDetails;

  // Phase 11 (additive): backend normalized aliases
  entity_type?: string | null;
  entity_id?: string | null;
  entity_key?: string | null;
}

export interface AdminAuditLogListResponse {
  items: AdminAuditLogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  offset?: number;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    page?: number;
    pages?: number;
  };
  filters_applied: Record<string, unknown>;
}
