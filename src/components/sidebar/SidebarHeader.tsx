import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { DEMO_USERS } from '../../utils/demoData';

interface SidebarHeaderProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenProfile: () => void;
  onOpenConfig: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  onOpenConfig,
}) => {
  const { currentUser, logout, isDemoMode, switchDemoUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <div className="px-4 py-3 bg-white dark:bg-[#111B21] border-b border-slate-200 dark:border-[#222D34] flex items-center justify-between select-none transition-colors">
      {/* Current User Info */}
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] transition-colors"
        title="View profile settings"
      >
        <Avatar
          src={currentUser?.photoURL}
          name={currentUser?.displayName || 'User'}
          size="md"
          isOnline={true}
          showOnlineStatus={true}
        />
        <div className="flex flex-col text-left max-w-[130px] sm:max-w-[150px]">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {currentUser?.displayName || 'User'}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        {/* Demo User Quick Switcher (Visible in Demo/Testing Mode) */}
        {isDemoMode && (
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors"
              title="Switch demo user to test real-time interaction"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDemoMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDemoMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-slide-up">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Test Multi-User Realtime
                  </div>
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => {
                        switchDemoUser(user);
                        setShowDemoMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        currentUser?.uid === user.uid
                          ? 'bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-600 font-semibold'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Avatar src={user.photoURL} name={user.displayName} size="xs" />
                      <div className="truncate">
                        <div className="text-xs font-medium leading-tight">{user.displayName}</div>
                        <div className="text-[10px] text-slate-400">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* New Direct Chat */}
        <button
          onClick={onOpenNewChat}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="New direct chat"
          aria-label="New direct chat"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        {/* New Group */}
        <button
          onClick={onOpenNewGroup}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="New group conversation"
          aria-label="New group conversation"
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Settings / Profile */}
        <button
          onClick={onOpenProfile}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-slate-300 transition-colors"
          title="Settings & Profile"
          aria-label="Settings and Profile"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
