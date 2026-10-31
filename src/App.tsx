import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { AuthModal } from './components/auth/AuthModal';
import { NewChatModal } from './components/modals/NewChatModal';
import { NewGroupModal } from './components/modals/NewGroupModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { FirebaseConfigModal } from './components/modals/FirebaseConfigModal';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Sparkles, Database, ShieldAlert, MessageSquare } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { currentUser, loading, isDemoMode, isConfigured } = useAuth();
  const { activeRoom, selectRoom } = useChat();

  // Modals state
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Splash Screen on initial authentication load
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B141A] text-slate-800 dark:text-slate-100 select-none">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight">CloudChat</h2>
            <p className="text-xs text-slate-400 mt-1">Connecting real-time channels...</p>
          </div>
          <LoadingSpinner size="md" color="text-emerald-500" className="mt-2" />
        </div>
      </div>
    );
  }

  // Not logged in -> Show Authentication modal
  if (!currentUser) {
    return (
      <>
        <AuthModal onOpenConfig={() => setShowConfig(true)} />
        <FirebaseConfigModal
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#0B141A] overflow-hidden">
      {/* Interactive Demo Mode Information Bar */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs px-4 py-1.5 flex items-center justify-between shadow-sm select-none z-30 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="font-semibold truncate">
              Interactive Test Mode Active: Multi-user real-time simulation ready.
            </span>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ml-2"
          >
            <Database className="w-3 h-3" />
            <span>Connect Live Firebase</span>
          </button>
        </div>
      )}

      {/* Main Responsive Chat Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <div
          className={`h-full ${
            activeRoom ? 'hidden md:flex' : 'flex w-full'
          } md:w-96 lg:w-[410px] shrink-0`}
        >
          <Sidebar
            onOpenNewChat={() => setShowNewChat(true)}
            onOpenNewGroup={() => setShowNewGroup(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenConfig={() => setShowConfig(true)}
          />
        </div>

        {/* Right Chat Area */}
        <div
          className={`h-full flex-1 ${
            activeRoom ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          <ChatArea
            onBackToSidebar={() => selectRoom(null)}
            onOpenNewChat={() => setShowNewChat(true)}
          />
        </div>
      </div>

      {/* Global Modals */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
      />

      <NewGroupModal
        isOpen={showNewGroup}
        onClose={() => setShowNewGroup(false)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onOpenConfig={() => setShowConfig(true)}
      />

      <FirebaseConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
