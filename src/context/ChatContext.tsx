import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Room, Message, UserProfile, MessageType } from '../types';
import { useAuth } from './AuthContext';
import {
  subscribeToUserRooms,
  subscribeToRoomMessages,
  sendMessage,
  markRoomMessagesAsRead,
  setRoomTyping,
  getOrCreateDirectRoom,
  createGroupRoom,
} from '../firebase/chatService';
import { fetchAllUsers } from '../firebase/authService';
import { uploadChatFile } from '../firebase/storageService';
import { requestNotificationPermission } from '../firebase/fcmService';
import { sounds } from '../utils/soundUtils';
import {
  INITIAL_DEMO_ROOMS,
  INITIAL_DEMO_MESSAGES,
  DEMO_USERS,
} from '../utils/demoData';

interface ChatContextType {
  rooms: Room[];
  activeRoom: Room | null;
  messages: Message[];
  allUsers: UserProfile[];
  loadingRooms: boolean;
  loadingMessages: boolean;
  uploading: boolean;
  uploadProgress: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: 'all' | 'direct' | 'groups' | 'unread';
  setActiveFilter: (filter: 'all' | 'direct' | 'groups' | 'unread') => void;
  selectRoom: (room: Room | null) => void;
  startDirectChat: (targetUser: UserProfile) => Promise<Room>;
  createNewGroup: (
    name: string,
    members: UserProfile[],
    description?: string,
    photoURL?: string
  ) => Promise<string>;
  sendTextMessage: (text: string, replyTo?: Message['replyTo']) => Promise<void>;
  sendFileMessage: (file: File, caption?: string, replyTo?: Message['replyTo']) => Promise<void>;
  updateTyping: (isTyping: boolean) => void;
  refreshUsers: () => Promise<void>;
  firestoreLocked: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isConfigured, isDemoMode } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'groups' | 'unread'>('all');
  const [firestoreLocked, setFirestoreLocked] = useState<boolean>(false);

  // Fallback demo state
  const [demoRoomsState, setDemoRoomsState] = useState<Room[]>(INITIAL_DEMO_ROOMS);
  const [demoMessagesState, setDemoMessagesState] = useState<Record<string, Message[]>>(INITIAL_DEMO_MESSAGES);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRoomRef = useRef<Room | null>(null);
  activeRoomRef.current = activeRoom;

  // Notification setup
  useEffect(() => {
    if (currentUser && !isDemoMode) {
      requestNotificationPermission(currentUser.uid);
    }
  }, [currentUser, isDemoMode]);

  // Load registered users
  const refreshUsers = useCallback(async () => {
    if (!currentUser) return;
    if (isDemoMode || !isConfigured || firestoreLocked) {
      setAllUsers(DEMO_USERS.filter((u) => u.uid !== currentUser.uid));
      return;
    }
    try {
      const users = await fetchAllUsers(currentUser.uid);
      if (users.length > 0) {
        setAllUsers(users);
      } else {
        setAllUsers(DEMO_USERS.filter((u) => u.uid !== currentUser.uid));
      }
    } catch {
      setAllUsers(DEMO_USERS.filter((u) => u.uid !== currentUser.uid));
    }
  }, [currentUser, isDemoMode, isConfigured, firestoreLocked]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Subscribe to rooms
  useEffect(() => {
    if (!currentUser) {
      setRooms([]);
      setActiveRoom(null);
      setLoadingRooms(false);
      return;
    }

    if (isDemoMode || !isConfigured || firestoreLocked) {
      const userRooms = demoRoomsState.filter((r) => r.members.includes(currentUser.uid) || true);
      setRooms(userRooms);
      if (!activeRoom && userRooms.length > 0) {
        setActiveRoom(userRooms[0]);
      }
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);
    const unsubscribe = subscribeToUserRooms(
      currentUser.uid,
      (updatedRooms) => {
        setFirestoreLocked(false);
        if (updatedRooms.length > 0) {
          setRooms(updatedRooms);
          if (activeRoomRef.current) {
            const currentInList = updatedRooms.find((r) => r.id === activeRoomRef.current?.id);
            if (currentInList) setActiveRoom(currentInList);
          }
        } else {
          // If no rooms exist yet in real Firestore, show sample conversation starter
          setRooms(demoRoomsState);
          if (!activeRoomRef.current && demoRoomsState.length > 0) {
            setActiveRoom(demoRoomsState[0]);
          }
        }
        setLoadingRooms(false);
      },
      (err: any) => {
        console.warn('Notice: Firestore rooms subscription:', err?.message || err);
        if (err?.message?.includes('permission-denied') || err?.code === 'permission-denied') {
          setFirestoreLocked(true);
        }
        setRooms(demoRoomsState);
        if (!activeRoomRef.current && demoRoomsState.length > 0) {
          setActiveRoom(demoRoomsState[0]);
        }
        setLoadingRooms(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, isDemoMode, isConfigured, firestoreLocked, demoRoomsState]);

  // Subscribe to messages of active room
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    if (isDemoMode || !isConfigured || firestoreLocked) {
      const roomMsgs = demoMessagesState[activeRoom.id] || [];
      setMessages(roomMsgs);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = subscribeToRoomMessages(
      activeRoom.id,
      (msgs) => {
        if (msgs.length > 0) {
          const latest = msgs[msgs.length - 1];
          if (currentUser && latest.senderId !== currentUser.uid) {
            sounds.playMessageReceived();
          }
        }
        setMessages(msgs);
        setLoadingMessages(false);

        if (currentUser) {
          markRoomMessagesAsRead(activeRoom.id, currentUser.uid);
        }
      },
      (err: any) => {
        console.warn('Notice: Firestore messages subscription:', err?.message || err);
        const roomMsgs = demoMessagesState[activeRoom.id] || [];
        setMessages(roomMsgs);
        setLoadingMessages(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeRoom?.id, currentUser, isDemoMode, isConfigured, firestoreLocked, demoMessagesState]);

  // Select a room
  const selectRoom = useCallback(
    (room: Room | null) => {
      setActiveRoom(room);
      if (room && currentUser && !isDemoMode && isConfigured && !firestoreLocked) {
        markRoomMessagesAsRead(room.id, currentUser.uid);
      }
    },
    [currentUser, isDemoMode, isConfigured, firestoreLocked]
  );

  // Direct chat initiation
  const startDirectChat = useCallback(
    async (targetUser: UserProfile): Promise<Room> => {
      if (!currentUser) throw new Error('Not logged in');

      if (isDemoMode || !isConfigured || firestoreLocked) {
        const existing = demoRoomsState.find(
          (r) =>
            r.type === 'direct' &&
            r.members.includes(currentUser.uid) &&
            r.members.includes(targetUser.uid)
        );
        if (existing) {
          setActiveRoom(existing);
          return existing;
        }

        const newRoomId = `demo_room_${currentUser.uid}_${targetUser.uid}`;
        const newRoom: Room = {
          id: newRoomId,
          type: 'direct',
          members: [currentUser.uid, targetUser.uid],
          memberDetails: {
            [currentUser.uid]: {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              email: currentUser.email,
            },
            [targetUser.uid]: {
              displayName: targetUser.displayName,
              photoURL: targetUser.photoURL,
              email: targetUser.email,
            },
          },
          createdBy: currentUser.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          unreadCount: { [currentUser.uid]: 0, [targetUser.uid]: 0 },
          typing: {},
        };

        setDemoRoomsState((prev) => [newRoom, ...prev]);
        setActiveRoom(newRoom);
        return newRoom;
      }

      try {
        const room = await getOrCreateDirectRoom(currentUser, targetUser);
        setActiveRoom(room);
        return room;
      } catch (err: any) {
        console.warn('Falling back to local direct room:', err);
        setFirestoreLocked(true);
        const newRoomId = `room_${currentUser.uid}_${targetUser.uid}`;
        const newRoom: Room = {
          id: newRoomId,
          type: 'direct',
          members: [currentUser.uid, targetUser.uid],
          memberDetails: {
            [currentUser.uid]: {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              email: currentUser.email,
            },
            [targetUser.uid]: {
              displayName: targetUser.displayName,
              photoURL: targetUser.photoURL,
              email: targetUser.email,
            },
          },
          createdBy: currentUser.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          unreadCount: {},
          typing: {},
        };
        setDemoRoomsState((prev) => [newRoom, ...prev]);
        setActiveRoom(newRoom);
        return newRoom;
      }
    },
    [currentUser, isDemoMode, isConfigured, firestoreLocked, demoRoomsState]
  );

  // Group creation
  const createNewGroup = useCallback(
    async (
      name: string,
      members: UserProfile[],
      description?: string,
      photoURL?: string
    ): Promise<string> => {
      if (!currentUser) throw new Error('Not logged in');

      const allMembers = [currentUser, ...members.filter((m) => m.uid !== currentUser.uid)];

      if (isDemoMode || !isConfigured || firestoreLocked) {
        const newGroupId = `group_${Date.now()}`;
        const memberDetails: Record<string, any> = {};
        allMembers.forEach((m) => {
          memberDetails[m.uid] = {
            displayName: m.displayName,
            photoURL: m.photoURL,
            email: m.email,
            role: m.uid === currentUser.uid ? 'admin' : 'member',
          };
        });

        const newGroup: Room = {
          id: newGroupId,
          type: 'group',
          name,
          description: description || '',
          photoURL:
            photoURL ||
            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
          members: allMembers.map((m) => m.uid),
          memberDetails,
          adminIds: [currentUser.uid],
          createdBy: currentUser.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          unreadCount: {},
          typing: {},
          lastMessage: {
            text: `${currentUser.displayName} created group "${name}"`,
            senderId: 'system',
            senderName: 'System',
            timestamp: Date.now(),
            type: 'text',
          },
        };

        setDemoRoomsState((prev) => [newGroup, ...prev]);
        setActiveRoom(newGroup);
        return newGroupId;
      }

      try {
        const groupId = await createGroupRoom(currentUser, name, members, description, photoURL);
        return groupId;
      } catch (err: any) {
        console.warn('Falling back to local group creation:', err);
        setFirestoreLocked(true);
        const newGroupId = `group_${Date.now()}`;
        const memberDetails: Record<string, any> = {};
        allMembers.forEach((m) => {
          memberDetails[m.uid] = {
            displayName: m.displayName,
            photoURL: m.photoURL,
            email: m.email,
            role: m.uid === currentUser.uid ? 'admin' : 'member',
          };
        });
        const newGroup: Room = {
          id: newGroupId,
          type: 'group',
          name,
          description: description || '',
          photoURL: photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
          members: allMembers.map((m) => m.uid),
          memberDetails,
          adminIds: [currentUser.uid],
          createdBy: currentUser.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          unreadCount: {},
          typing: {},
        };
        setDemoRoomsState((prev) => [newGroup, ...prev]);
        setActiveRoom(newGroup);
        return newGroupId;
      }
    },
    [currentUser, isDemoMode, isConfigured, firestoreLocked]
  );

  // Send Text Message
  const sendTextMessage = useCallback(
    async (text: string, replyTo?: Message['replyTo']) => {
      if (!activeRoom || !currentUser || !text.trim()) return;

      sounds.playMessageSent();

      if (isDemoMode || !isConfigured || firestoreLocked) {
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          roomId: activeRoom.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhoto: currentUser.photoURL,
          text: text.trim(),
          type: 'text',
          createdAt: Date.now(),
          readBy: [currentUser.uid],
          status: 'sent',
          replyTo,
        };

        setDemoMessagesState((prev) => ({
          ...prev,
          [activeRoom.id]: [...(prev[activeRoom.id] || []), newMsg],
        }));

        setDemoRoomsState((prev) =>
          prev.map((r) =>
            r.id === activeRoom.id
              ? {
                  ...r,
                  lastMessage: {
                    text: text.trim(),
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName,
                    timestamp: Date.now(),
                    type: 'text',
                  },
                  updatedAt: Date.now(),
                }
              : r
          )
        );
        return;
      }

      try {
        await sendMessage(activeRoom.id, currentUser, {
          text,
          type: 'text',
          replyTo,
        });
      } catch (err: any) {
        console.warn('Falling back to local send due to Firestore rules:', err);
        setFirestoreLocked(true);
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          roomId: activeRoom.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhoto: currentUser.photoURL,
          text: text.trim(),
          type: 'text',
          createdAt: Date.now(),
          readBy: [currentUser.uid],
          status: 'sent',
          replyTo,
        };
        setDemoMessagesState((prev) => ({
          ...prev,
          [activeRoom.id]: [...(prev[activeRoom.id] || []), newMsg],
        }));
      }
    },
    [activeRoom, currentUser, isDemoMode, isConfigured, firestoreLocked]
  );

  // Send File or Image Message
  const sendFileMessage = useCallback(
    async (file: File, caption?: string, replyTo?: Message['replyTo']) => {
      if (!activeRoom || !currentUser) return;

      const isImage = file.type.startsWith('image/');
      const messageType: MessageType = isImage ? 'image' : 'file';

      setUploading(true);
      setUploadProgress(10);

      try {
        const uploadResult = await uploadChatFile(activeRoom.id, file, (progress) => {
          setUploadProgress(progress);
        });

        sounds.playMessageSent();

        if (isDemoMode || !isConfigured || firestoreLocked) {
          const newMsg: Message = {
            id: `msg_${Date.now()}`,
            roomId: activeRoom.id,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            senderPhoto: currentUser.photoURL,
            text: caption?.trim() || '',
            type: messageType,
            fileUrl: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            fileType: uploadResult.fileType,
            createdAt: Date.now(),
            readBy: [currentUser.uid],
            status: 'sent',
            replyTo,
          };

          setDemoMessagesState((prev) => ({
            ...prev,
            [activeRoom.id]: [...(prev[activeRoom.id] || []), newMsg],
          }));
          return;
        }

        try {
          await sendMessage(activeRoom.id, currentUser, {
            text: caption?.trim() || '',
            type: messageType,
            fileUrl: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            fileType: uploadResult.fileType,
            replyTo,
          });
        } catch (err: any) {
          console.warn('Falling back to local message save:', err);
          setFirestoreLocked(true);
          const newMsg: Message = {
            id: `msg_${Date.now()}`,
            roomId: activeRoom.id,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            senderPhoto: currentUser.photoURL,
            text: caption?.trim() || '',
            type: messageType,
            fileUrl: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            fileType: uploadResult.fileType,
            createdAt: Date.now(),
            readBy: [currentUser.uid],
            status: 'sent',
            replyTo,
          };
          setDemoMessagesState((prev) => ({
            ...prev,
            [activeRoom.id]: [...(prev[activeRoom.id] || []), newMsg],
          }));
        }
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [activeRoom, currentUser, isDemoMode, isConfigured, firestoreLocked]
  );

  // Typing indicator
  const updateTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeRoom || !currentUser || isDemoMode || !isConfigured || firestoreLocked) return;

      try {
        setRoomTyping(activeRoom.id, currentUser.uid, isTyping);
      } catch {
        // Ignore typing error
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          try {
            setRoomTyping(activeRoom.id, currentUser.uid, false);
          } catch {
            // Ignore
          }
        }, 2500);
      }
    },
    [activeRoom, currentUser, isDemoMode, isConfigured, firestoreLocked]
  );

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoom,
        messages,
        allUsers,
        loadingRooms,
        loadingMessages,
        uploading,
        uploadProgress,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        selectRoom,
        startDirectChat,
        createNewGroup,
        sendTextMessage,
        sendFileMessage,
        updateTyping,
        refreshUsers,
        firestoreLocked,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
