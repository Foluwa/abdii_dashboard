/**
 * Status Badge Component
 * Displays status with appropriate color coding
 */

import React from 'react';
import Badge from '@/components/ui/badge/Badge';

export type StatusType = 
  | 'online' 
  | 'offline' 
  | 'warning' 
  | 'success' 
  | 'error' 
  | 'info'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'draft'
  | 'published'
  | 'archived';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { color: 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark'; label: string }> = {
  online: { color: 'success', label: 'Online' },
  offline: { color: 'error', label: 'Offline' },
  warning: { color: 'warning', label: 'Warning' },
  success: { color: 'success', label: 'Success' },
  error: { color: 'error', label: 'Error' },
  info: { color: 'info', label: 'Info' },
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'dark', label: 'Inactive' },
  pending: { color: 'warning', label: 'Pending' },
  draft: { color: 'light', label: 'Draft' },
  published: { color: 'success', label: 'Published' },
  archived: { color: 'dark', label: 'Archived' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge color={config.color} variant="solid" size="sm">
      {label || config.label}
    </Badge>
  );
}
