import React from 'react';
import { Search, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, activeFilter, setActiveFilter, rooms, currentUser } = useChat() as any;

  // Calculate unread count total
  const unreadCountTotal = rooms.reduce((acc: number, r: any) => {
    if (!currentUser) return acc;
    return acc + (r.unreadCount?.[currentUser.uid] || 0);
  }, 0);

  const filters: Array<{ id: 'all' | 'direct' | 'groups' | 'unread'; label: string; count?: number }> = [
    { id: 'all', label: 'All' },
    { id: 'direct', label: 'Direct' },
    { id: 'groups', label: 'Groups' },
    { id: 'unread', label: 'Unread', count: unreadCountTotal },
  ];

  return (
    <div className="p-3 bg-white dark:bg-[#111B21] border-b border-slate-100 dark:border-[#222D34]/70 space-y-2.5 transition-colors">
      {/* Search Bar Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats or messages..."
          className="w-full pl-10 pr-9 py-2 bg-slate-100 dark:bg-[#202C33] text-slate-800 dark:text-slate-100 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all border border-transparent focus:border-emerald-500/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-[#202C33] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2A3942]'
              }`}
            >
              <span>{filter.label}</span>
              {typeof filter.count === 'number' && filter.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
