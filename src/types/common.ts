/**
 * Common Types
 * Shared types across the admin dashboard
 */

export interface Language {
  id: string;
  name: string;
  native_name: string;
  iso_639_3: string;
  direction: 'ltr' | 'rtl';
  is_tonal: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'admin' | 'manager' | 'user';
  picture_url: string | null;
  avatar_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * API Response wrapper for all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Common form field types
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';

export interface FormField {
  name: string;
  label: string;
  type: InputType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string | number; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  hint?: string;
  disabled?: boolean;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Bulk operation types
 */
export interface BulkImportResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  created_ids: string[];
}

export interface BulkExportOptions {
  format: 'csv' | 'json';
  fields?: string[];
  filters?: FilterConfig;
}
