import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  type Unsubscribe,
  limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Room, Message, UserProfile, MessageType } from '../types';

/**
 * Deterministic Room ID for 1-on-1 direct conversations
 */
export const getDirectRoomId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

/**
 * Get or create a direct 1-to-1 conversation room
 */
export const getOrCreateDirectRoom = async (
  currentUser: UserProfile,
  targetUser: UserProfile
): Promise<Room> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }

  const roomId = getDirectRoomId(currentUser.uid, targetUser.uid);
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);

  if (roomSnap.exists()) {
    return { id: roomSnap.id, ...(roomSnap.data() as Omit<Room, 'id'>) };
  }

  // Create new direct room
  const newRoom: Omit<Room, 'id'> = {
    type: 'direct',
    members: [currentUser.uid, targetUser.uid],
    memberDetails: {
      [currentUser.uid]: {
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        email: currentUser.email,
        role: 'member',
      },
      [targetUser.uid]: {
        displayName: targetUser.displayName,
        photoURL: targetUser.photoURL,
        email: targetUser.email,
        role: 'member',
      },
    },
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: {
      [currentUser.uid]: 0,
      [targetUser.uid]: 0,
    },
    typing: {
      [currentUser.uid]: false,
      [targetUser.uid]: false,
    },
  };

  await setDoc(roomRef, newRoom);
  return { id: roomId, ...newRoom };
};

/**
 * Create a new Group conversation
 */
export const createGroupRoom = async (
  currentUser: UserProfile,
  name: string,
  members: UserProfile[],
  description: string = '',
  photoURL?: string | null
): Promise<string> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }

  const allMembers = [currentUser, ...members.filter((m) => m.uid !== currentUser.uid)];
  const memberUids = allMembers.map((m) => m.uid);

  const memberDetails: Record<string, any> = {};
  const unreadCount: Record<string, number> = {};
  const typing: Record<string, boolean> = {};

  allMembers.forEach((m) => {
    memberDetails[m.uid] = {
      displayName: m.displayName,
      photoURL: m.photoURL,
      email: m.email,
      role: m.uid === currentUser.uid ? 'admin' : 'member',
    };
    unreadCount[m.uid] = 0;
    typing[m.uid] = false;
  });

  const groupData = {
    type: 'group' as const,
    name,
    description,
    photoURL: photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    members: memberUids,
    memberDetails,
    adminIds: [currentUser.uid],
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount,
    typing,
    lastMessage: {
      text: `${currentUser.displayName} created group "${name}"`,
      senderId: 'system',
      senderName: 'System',
      timestamp: serverTimestamp(),
      type: 'text' as const,
    },
  };

  const docRef = await addDoc(collection(db, 'rooms'), groupData);
  return docRef.id;
};

/**
 * Real-time listener for current user's active rooms
 */
export const subscribeToUserRooms = (
  userId: string,
  onRoomsUpdate: (rooms: Room[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  const q = query(
    collection(db, 'rooms'),
    where('members', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rooms: Room[] = [];
      snapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...(doc.data() as Omit<Room, 'id'>) });
      });

      // Sort client-side by updatedAt descending
      rooms.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA;
      });

      onRoomsUpdate(rooms);
    },
    (err) => {
      console.error('Error subscribing to rooms:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Real-time listener for messages in a room
 */
export const subscribeToRoomMessages = (
  roomId: string,
  onMessagesUpdate: (messages: Message[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !roomId) {
    return () => {};
  }

  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...(doc.data() as Omit<Message, 'id'>) });
      });
      onMessagesUpdate(messages);
    },
    (err) => {
      console.error('Error subscribing to messages:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Send a message to a room
 */
export const sendMessage = async (
  roomId: string,
  currentUser: UserProfile,
  messageData: {
    text: string;
    type?: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    replyTo?: { id: string; senderName: string; text: string };
  }
): Promise<string> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }

  const type = messageData.type || 'text';
  const text = messageData.text.trim();

  // 1. Add message document to messages subcollection
  const messagesCol = collection(db, 'rooms', roomId, 'messages');
  const newMsgDoc = await addDoc(messagesCol, {
    roomId,
    senderId: currentUser.uid,
    senderName: currentUser.displayName,
    senderPhoto: currentUser.photoURL,
    text,
    type,
    fileUrl: messageData.fileUrl || null,
    fileName: messageData.fileName || null,
    fileSize: messageData.fileSize || null,
    fileType: messageData.fileType || null,
    replyTo: messageData.replyTo || null,
    createdAt: serverTimestamp(),
    readBy: [currentUser.uid],
    status: 'sent',
  });

  // 2. Update room's last message, updatedAt, and increment unread for other members
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);

  if (roomSnap.exists()) {
    const roomData = roomSnap.data() as Room;
    const members = roomData.members || [];

    const unreadUpdates: Record<string, any> = {};
    members.forEach((mUid) => {
      if (mUid !== currentUser.uid) {
        unreadUpdates[`unreadCount.${mUid}`] = increment(1);
      }
    });

    const displayText =
      type === 'image' ? '📷 Photo' :
      type === 'file' ? `📎 ${messageData.fileName || 'File'}` :
      text;

    await updateDoc(roomRef, {
      lastMessage: {
        text: displayText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: serverTimestamp(),
        type,
      },
      updatedAt: serverTimestamp(),
      ...unreadUpdates,
      [`typing.${currentUser.uid}`]: false,
    });
  }

  return newMsgDoc.id;
};

/**
 * Mark messages in a room as read by current user
 */
export const markRoomMessagesAsRead = async (roomId: string, currentUid: string): Promise<void> => {
  if (!isFirebaseConfigured() || !roomId || !currentUid) return;

  try {
    // Reset room unread count for current user
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      [`unreadCount.${currentUid}`]: 0,
    });

    // Mark recent unread messages
    const msgsRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(
      msgsRef,
      where('readBy', 'not-in', [[currentUid]]),
      limit(25)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.senderId !== currentUid && (!data.readBy || !data.readBy.includes(currentUid))) {
          batch.update(docSnap.ref, {
            readBy: arrayUnion(currentUid),
            status: 'read',
          });
        }
      });
      await batch.commit();
    }
  } catch (err) {
    // Silently continue if composite index not yet generated
    console.debug('Read status update notice:', err);
  }
};

/**
 * Set typing status in room
 */
export const setRoomTyping = async (roomId: string, currentUid: string, isTyping: boolean): Promise<void> => {
  if (!isFirebaseConfigured() || !roomId || !currentUid) return;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      [`typing.${currentUid}`]: isTyping,
    });
  } catch (err) {
    console.debug('Failed to update typing status:', err);
  }
};

/**
 * Add members to group
 */
export const addMembersToGroup = async (
  roomId: string,
  newMembers: UserProfile[]
): Promise<void> => {
  if (!isFirebaseConfigured() || !roomId || !newMembers.length) return;

  const roomRef = doc(db, 'rooms', roomId);
  const newUids = newMembers.map((m) => m.uid);

  const updates: Record<string, any> = {
    members: arrayUnion(...newUids),
    updatedAt: serverTimestamp(),
  };

  newMembers.forEach((m) => {
    updates[`memberDetails.${m.uid}`] = {
      displayName: m.displayName,
      photoURL: m.photoURL,
      email: m.email,
      role: 'member',
    };
    updates[`unreadCount.${m.uid}`] = 0;
  });

  await updateDoc(roomRef, updates);
};

/**
 * Remove a member from group
 */
export const removeMemberFromGroup = async (
  roomId: string,
  memberUid: string
): Promise<void> => {
  if (!isFirebaseConfigured() || !roomId || !memberUid) return;

  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    members: arrayRemove(memberUid),
    adminIds: arrayRemove(memberUid),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Leave group
 */
export const leaveGroup = async (roomId: string, currentUid: string): Promise<void> => {
  return removeMemberFromGroup(roomId, currentUid);
};

/**
 * Update Group Details (Name, Photo, Description)
 */
export const updateGroupDetails = async (
  roomId: string,
  data: { name?: string; photoURL?: string; description?: string }
): Promise<void> => {
  if (!isFirebaseConfigured() || !roomId) return;
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};
