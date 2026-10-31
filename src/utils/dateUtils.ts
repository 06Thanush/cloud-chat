import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

export const parseFirebaseTimestamp = (ts: Timestamp | number | string | Date | null | undefined): Date | null => {
  if (!ts) return null;
  if (typeof ts === 'object' && 'toDate' in ts && typeof (ts as any).toDate === 'function') {
    return (ts as Timestamp).toDate();
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'string') {
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatMessageTime = (timestamp: Timestamp | number | string | Date | null | undefined): string => {
  const date = parseFirebaseTimestamp(timestamp);
  if (!date) return '';
  return format(date, 'h:mm a');
};

export const formatConversationTime = (timestamp: Timestamp | number | string | Date | null | undefined): string => {
  const date = parseFirebaseTimestamp(timestamp);
  if (!date) return '';

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
};

export const formatMessageDateDivider = (timestamp: Timestamp | number | string | Date | null | undefined): string => {
  const date = parseFirebaseTimestamp(timestamp);
  if (!date) return '';

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const formatLastSeen = (timestamp: Timestamp | number | string | Date | null | undefined): string => {
  const date = parseFirebaseTimestamp(timestamp);
  if (!date) return 'offline';

  const diffMinutes = (Date.now() - date.getTime()) / 60000;
  if (diffMinutes < 2) return 'Active just now';
  return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
