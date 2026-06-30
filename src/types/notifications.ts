export interface NotificationSendRequest {
  user_ids: number[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationBroadcastRequest {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  android_sent: number;
  ios_sent: number;
  failed: number;
}

export interface NotificationLogItem {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  target_type: string;
  target_count: number;
  android_sent: number;
  ios_sent: number;
  failed_count: number;
  sent_by: string;
  created_at: string;
}

export interface DailyContentFeedItem {
  content_log_id: string;
  content_date: string;
  content_type: string;
  language_code: string;
  content_text: string;
  target_count: number;
  android_sent: number;
  ios_sent: number;
  failed_count: number;
  sent_count: number;
  open_count: number;
}

export interface AudienceSnapshotItem {
  snapshot_date: string;
  total_eligible: number;
  android_eligible: number;
  ios_eligible: number;
}
