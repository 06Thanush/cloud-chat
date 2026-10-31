import React, { useState } from 'react';
import { X, Search, MessageSquare, UserCheck, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import type { UserProfile } from '../../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, startDirectChat } = useChat();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [startingUid, setStartingUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => {
    if (u.uid === currentUser?.uid) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.bio?.toLowerCase().includes(term)
    );
  });

  const handleStartChat = async (user: UserProfile) => {
    try {
      setStartingUid(user.uid);
      await startDirectChat(user);
      onClose();
    } catch (err) {
      console.error('Error starting direct chat:', err);
    } finally {
      setStartingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                New Conversation
              </h3>
              <p className="text-xs text-slate-400">Search registered users to message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500/40"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.uid}
                onClick={() => handleStartChat(user)}
                className="pt-2 pb-2 px-3 flex items-center justify-between rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={user.photoURL}
                    name={user.displayName}
                    size="md"
                    showOnlineStatus={true}
                    isOnline={user.status === 'online'}
                  />
                  <div className="truncate">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate transition-colors">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {user.bio || user.email}
                    </div>
                  </div>
                </div>

                <button
                  disabled={startingUid === user.uid}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0 ml-2"
                >
                  {startingUid === user.uid ? 'Opening...' : 'Chat'}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {searchTerm ? 'No users matching search.' : 'No other registered users found.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
