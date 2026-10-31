import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { ArrowDown, MessageCircle } from 'lucide-react';
import type { Message, Room } from '../../types';
import { MessageItem } from './MessageItem';
import { formatMessageDateDivider, parseFirebaseTimestamp } from '../../utils/dateUtils';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface MessageListProps {
  room: Room;
  messages: Message[];
  loading: boolean;
  onImageClick: (url: string, name: string) => void;
  onReply: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  room,
  messages,
  loading,
  onImageClick,
  onReply,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useLayoutEffect(() => {
    scrollToBottom('auto');
  }, [room.id]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 200);
  };

  // Group messages by date
  const renderMessageNodes = () => {
    const nodes: React.ReactNode[] = [];
    let lastDateKey = '';

    messages.forEach((msg, idx) => {
      const date = parseFirebaseTimestamp(msg.createdAt);
      const dateKey = date ? formatMessageDateDivider(date) : '';

      // Date Divider
      if (dateKey && dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        nodes.push(
          <div key={`date_${dateKey}_${idx}`} className="flex justify-center my-3 select-none">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-[#182229]/90 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-800">
              {dateKey}
            </span>
          </div>
        );
      }

      // Determine if sender header should be shown (group chat)
      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const showSenderHeader =
        !prevMsg || prevMsg.senderId !== msg.senderId || Boolean(dateKey && dateKey !== lastDateKey);

      nodes.push(
        <MessageItem
          key={msg.id}
          message={msg}
          isGroup={room.type === 'group'}
          showSenderHeader={showSenderHeader}
          onImageClick={onImageClick}
          onReply={onReply}
        />
      );
    });

    return nodes;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 relative chat-pattern-light dark:chat-pattern-dark select-none"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
          <LoadingSpinner size="md" color="text-emerald-500" />
          <span className="text-xs">Loading messages...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 select-none">
          <div className="w-14 h-14 rounded-full bg-white/70 dark:bg-[#1E293B]/70 shadow-sm flex items-center justify-center mb-3">
            <MessageCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            No messages here yet
          </h4>
          <p className="text-xs max-w-xs text-slate-500 dark:text-slate-400">
            Say hello to start the conversation! All messages are end-to-end encrypted in your Firebase project.
          </p>
        </div>
      ) : (
        <div className="space-y-1">{renderMessageNodes()}</div>
      )}

      <div ref={bottomRef} />

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-20 right-6 sm:right-10 p-2.5 rounded-full bg-white dark:bg-[#202C33] text-slate-600 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2A3942] transition-all animate-bounce"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
