import type { Timestamp } from 'firebase/firestore';

export type UserStatus = 'online' | 'offline';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio?: string;
  status: UserStatus;
  lastSeen?: Timestamp | number | any;
  createdAt?: Timestamp | number | any;
  fcmTokens?: string[];
}

export type RoomType = 'direct' | 'group';

export interface MemberDetail {
  displayName: string;
  photoURL: string | null;
  email: string;
  role?: 'admin' | 'member';
}

export interface LastMessage {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp | any;
  type: 'text' | 'image' | 'file';
}

export interface Room {
  id: string;
  type: RoomType;
  name?: string;
  photoURL?: string | null;
  description?: string;
  members: string[]; // array of UIDs
  memberDetails: Record<string, MemberDetail>;
  adminIds?: string[];
  createdAt: Timestamp | any;
  createdBy: string;
  lastMessage?: LastMessage;
  unreadCount?: Record<string, number>;
  typing?: Record<string, boolean>;
  updatedAt?: Timestamp | any;
}

export type MessageType = 'text' | 'image' | 'file';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string | null;
  text: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: Timestamp | any;
  readBy: string[]; // list of user IDs who have seen the message
  status?: MessageDeliveryStatus;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface AttachmentPreview {
  file: File;
  previewUrl: string;
  type: MessageType;
  name: string;
  size: number;
}
