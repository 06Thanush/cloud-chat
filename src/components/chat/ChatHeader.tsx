import React from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  MoreVertical,
} from 'lucide-react';
import type { Room } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

interface ChatHeaderProps {
  room: Room;
  onBack: () => void;
  onToggleInfo: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  onBack,
  onToggleInfo,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const isGroup = room.type === 'group';

  // For direct room, determine the other member
  const otherUserId = !isGroup
    ? room.members.find((uid) => uid !== currentUser.uid) || ''
    : '';
  const otherUser = otherUserId && room.memberDetails ? room.memberDetails[otherUserId] : null;

  const roomName = isGroup ? room.name || 'Group Chat' : otherUser?.displayName || 'Direct Chat';
  const roomPhoto = isGroup ? room.photoURL : otherUser?.photoURL;

  // Typing status check
  const typingUsers = Object.entries(room.typing || {})
    .filter(([uid, isTyping]) => uid !== currentUser.uid && isTyping)
    .map(([uid]) => room.memberDetails?.[uid]?.displayName || 'Someone');

  const isTyping = typingUsers.length > 0;

  return (
    <header className="px-4 py-2.5 bg-white dark:bg-[#111B21] border-b border-slate-200 dark:border-[#222D34] flex items-center justify-between select-none transition-colors z-10 shadow-sm">
      {/* Left: Back button (mobile) + Contact info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="Back to conversations"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={onToggleInfo}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <Avatar
            src={roomPhoto}
            name={roomName}
            size="md"
            isGroup={isGroup}
            showOnlineStatus={!isGroup}
            isOnline={true}
          />

          <div className="flex flex-col min-w-0 text-left">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {roomName}
            </h3>

            {/* Subtitle: Typing / Online / Member count */}
            <div className="text-xs truncate">
              {isTyping ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse flex items-center gap-1">
                  <span>{typingUsers.join(', ')} typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </span>
              ) : isGroup ? (
                <span className="text-slate-500 dark:text-slate-400">
                  {room.members.length} members
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Online
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        <button
          onClick={() => alert('Voice call feature simulation. Connected via WebRTC.')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="Voice Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          onClick={() => alert('Video call feature simulation. Connected via WebRTC.')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleInfo}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="Room details & media"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
