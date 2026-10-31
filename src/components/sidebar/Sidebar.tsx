import React, { useMemo } from 'react';
import { MessageSquarePlus, MessageSquareDashed } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { SidebarHeader } from './SidebarHeader';
import { SearchBar } from './SearchBar';
import { ConversationItem } from './ConversationItem';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenProfile: () => void;
  onOpenConfig: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  onOpenConfig,
}) => {
  const { rooms, activeRoom, selectRoom, loadingRooms, searchQuery, activeFilter } = useChat();
  const { currentUser } = useAuth();

  // Filter conversations
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Tab filter
      if (activeFilter === 'direct' && room.type !== 'direct') return false;
      if (activeFilter === 'groups' && room.type !== 'group') return false;
      if (activeFilter === 'unread') {
        const unread = currentUser ? room.unreadCount?.[currentUser.uid] || 0 : 0;
        if (unread === 0) return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      // Check room name
      if (room.name && room.name.toLowerCase().includes(q)) return true;

      // Check member names
      if (room.memberDetails) {
        const matchesMember = Object.values(room.memberDetails).some((m) =>
          m.displayName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
        );
        if (matchesMember) return true;
      }

      // Check last message text
      if (room.lastMessage?.text?.toLowerCase().includes(q)) return true;

      return false;
    });
  }, [rooms, activeFilter, searchQuery, currentUser]);

  return (
    <aside className="w-full md:w-96 lg:w-[410px] h-full flex flex-col bg-white dark:bg-[#111B21] border-r border-slate-200 dark:border-[#222D34] flex-shrink-0 transition-colors">
      {/* Header */}
      <SidebarHeader
        onOpenNewChat={onOpenNewChat}
        onOpenNewGroup={onOpenNewGroup}
        onOpenProfile={onOpenProfile}
        onOpenConfig={onOpenConfig}
      />

      {/* Search & Tabs */}
      <SearchBar />

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50 dark:divide-[#222D34]/20">
        {loadingRooms ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <LoadingSpinner size="md" color="text-emerald-500" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <ConversationItem
              key={room.id}
              room={room}
              isActive={activeRoom?.id === room.id}
              onSelect={() => selectRoom(room)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-slate-400 dark:text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#202C33] flex items-center justify-center mb-3 text-slate-400">
              <MessageSquareDashed className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </h4>
            <p className="text-xs max-w-xs mb-4">
              {searchQuery
                ? `No results for "${searchQuery}". Try searching another name or email.`
                : 'Start a direct message with friends or create a team group to chat.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenNewChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Start New Chat</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
