import React, { useState } from 'react';
import { MessageSquareDashed, Lock, Shield, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { RoomInfoDrawer } from './RoomInfoDrawer';
import { MediaViewerModal } from './MediaViewerModal';
import type { Message } from '../../types';

interface ChatAreaProps {
  onBackToSidebar: () => void;
  onOpenNewChat: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  onBackToSidebar,
  onOpenNewChat,
}) => {
  const { activeRoom, messages, loadingMessages } = useChat();

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  // Lightbox state
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  const handleOpenImage = (url: string, title: string) => {
    setViewerState({
      isOpen: true,
      url,
      title,
    });
  };

  const handleCloseImage = () => {
    setViewerState({
      isOpen: false,
      url: '',
      title: '',
    });
  };

  if (!activeRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center bg-slate-50 dark:bg-[#111B21] select-none transition-colors border-l border-slate-200 dark:border-[#222D34]">
        <div className="max-w-md flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 ring-8 ring-emerald-500/5">
            <MessageSquareDashed className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            CloudChat for Web
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Send and receive real-time messages, share documents and photos, and create group chats across all your devices simultaneously.
          </p>

          <button
            onClick={onOpenNewChat}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start a New Conversation</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-12">
            <Lock className="w-3.5 h-3.5" />
            <span>Protected by Firebase Authentication & Firestore Security Rules</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-[#EFEAE2] dark:bg-[#0B141A] relative overflow-hidden transition-colors">
      {/* Active Chat Header */}
      <ChatHeader
        room={activeRoom}
        onBack={onBackToSidebar}
        onToggleInfo={() => setShowInfoDrawer(!showInfoDrawer)}
      />

      {/* Messages Thread List */}
      <MessageList
        room={activeRoom}
        messages={messages}
        loading={loadingMessages}
        onImageClick={handleOpenImage}
        onReply={(msg) => setReplyMessage(msg)}
      />

      {/* Input Composer */}
      <MessageInput
        replyMessage={replyMessage}
        onClearReply={() => setReplyMessage(null)}
      />

      {/* Right Slide-out Drawer */}
      <RoomInfoDrawer
        room={activeRoom}
        messages={messages}
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        onImageClick={handleOpenImage}
      />

      {/* Image Lightbox Viewer */}
      <MediaViewerModal
        isOpen={viewerState.isOpen}
        imageUrl={viewerState.url}
        title={viewerState.title}
        onClose={handleCloseImage}
      />
    </main>
  );
};
