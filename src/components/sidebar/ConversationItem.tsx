import React from 'react';
import { Check, CheckCheck, Image, FileText } from 'lucide-react';
import type { Room } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatConversationTime } from '../../utils/dateUtils';

interface ConversationItemProps {
  room: Room;
  isActive: boolean;
  onSelect: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  room,
  isActive,
  onSelect,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const isGroup = room.type === 'group';

  // For direct room, find target user
  const otherUserId = !isGroup
    ? room.members.find((uid) => uid !== currentUser.uid) || ''
    : '';
  const otherUser = otherUserId && room.memberDetails ? room.memberDetails[otherUserId] : null;

  const roomName = isGroup ? room.name || 'Group Chat' : otherUser?.displayName || 'Direct Chat';
  const roomPhoto = isGroup ? room.photoURL : otherUser?.photoURL;

  // Unread count for current user
  const unreadCount = room.unreadCount?.[currentUser.uid] || 0;

  // Check if other user is typing
  const isTyping = Object.entries(room.typing || {}).some(
    ([uid, typing]) => uid !== currentUser.uid && typing
  );

  const lastMessage = room.lastMessage;
  const isSentByMe = lastMessage?.senderId === currentUser.uid;

  // Timestamp formatting
  const formattedTime = formatConversationTime(
    lastMessage?.timestamp || room.updatedAt || room.createdAt
  );

  return (
    <div
      onClick={onSelect}
      className={`px-3.5 py-3 flex items-center gap-3 cursor-pointer select-none transition-all duration-150 relative border-b border-slate-100/70 dark:border-[#222D34]/40 ${
        isActive
          ? 'bg-slate-100/90 dark:bg-[#2A3942]'
          : 'hover:bg-slate-50 dark:hover:bg-[#202C33]/70'
      }`}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
      )}

      {/* Avatar */}
      <Avatar
        src={roomPhoto}
        name={roomName}
        size="lg"
        isGroup={isGroup}
        showOnlineStatus={!isGroup}
        isOnline={true}
      />

      {/* Conversation Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4
            className={`text-sm font-semibold truncate ${
              isActive
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {roomName}
          </h4>
          {formattedTime && (
            <span
              className={`text-[11px] whitespace-nowrap ml-2 ${
                unreadCount > 0
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          {/* Last message or typing indicator */}
          <div className="flex items-center gap-1.5 min-w-0 text-xs truncate">
            {isTyping ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium italic flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                <span>typing...</span>
              </span>
            ) : lastMessage ? (
              <>
                {/* Sent check marks */}
                {isSentByMe && (
                  <span className="shrink-0 text-slate-400">
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                  </span>
                )}

                {/* Media Icon */}
                {lastMessage.type === 'image' && (
                  <Image className="w-3.5 h-3.5 text-slate-500 shrink-0 inline" />
                )}
                {lastMessage.type === 'file' && (
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 inline" />
                )}

                <span
                  className={`truncate ${
                    unreadCount > 0
                      ? 'font-medium text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isGroup && !isSentByMe && (
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {lastMessage.senderName?.split(' ')[0]}:{' '}
                    </span>
                  )}
                  {lastMessage.text}
                </span>
              </>
            ) : (
              <span className="text-slate-400 italic">No messages yet</span>
            )}
          </div>

          {/* Unread Badge Counter */}
          {unreadCount > 0 && <Badge count={unreadCount} className="shrink-0 ml-1" />}
        </div>
      </div>
    </div>
  );
};
