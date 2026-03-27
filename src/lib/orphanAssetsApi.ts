import { apiClient } from '@/lib/api';
import type {
  OrphanAssetAction,
  OrphanAssetBulkActionResponse,
  OrphanAssetScanItem,
  OrphanAssetScanMode,
} from '@/types/orphan-assets';

export async function runOrphanAssetScan(payload?: {
  scan_mode?: OrphanAssetScanMode;
  managed_prefixes?: string[];
  grace_period_days?: number;
}) {
  const res = await apiClient.post<OrphanAssetScanItem>('/api/v1/admin/orphan-assets/scans/run', payload ?? {});
  return res.data;
}

export async function applyOrphanAssetBulkAction(payload: {
  action: OrphanAssetAction;
  candidate_ids: string[];
  note?: string;
  scheduled_delete_after?: string;
}) {
  const res = await apiClient.post<OrphanAssetBulkActionResponse>('/api/v1/admin/orphan-assets/candidates/actions', payload);
  return res.data;
}