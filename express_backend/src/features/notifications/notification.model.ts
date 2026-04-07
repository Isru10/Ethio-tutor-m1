// notification.model.ts — Types for the notifications feature
export interface NotificationRow {
  notification_id: number;
  title:           string;
  message:         string;
  is_read:         boolean;
  created_at:      Date;
}
