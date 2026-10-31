import React from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  CornerUpLeft,
} from 'lucide-react';
import type { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatMessageTime, formatFileSize } from '../../utils/dateUtils';
import { Avatar } from '../ui/Avatar';

interface MessageItemProps {
  message: Message;
  isGroup: boolean;
  showSenderHeader: boolean;
  onImageClick: (url: string, name: string) => void;
  onReply: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isGroup,
  showSenderHeader,
  onImageClick,
  onReply,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const isMe = message.senderId === currentUser.uid;
  const isImage = message.type === 'image' && message.fileUrl;
  const isFile = message.type === 'file' && message.fileUrl;

  const formattedTime = formatMessageTime(message.createdAt);

  // Status check for outgoing
  const isRead =
    message.readBy &&
    message.readBy.some((uid) => uid !== currentUser.uid);

  // Pick file icon based on extension
  const getFileIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext || '')) {
      return <FileArchive className="w-8 h-8 text-amber-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    }
    if (['js', 'ts', 'tsx', 'html', 'css', 'py', 'json'].includes(ext || '')) {
      return <FileCode className="w-8 h-8 text-indigo-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div
      className={`group flex items-end gap-2 px-3 py-0.5 select-text ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Sender Avatar for groups (only on incoming and when header is shown) */}
      {!isMe && isGroup && (
        <div className="w-8 flex-shrink-0">
          {showSenderHeader ? (
            <Avatar
              src={message.senderPhoto}
              name={message.senderName || 'Member'}
              size="sm"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-2.5 shadow-sm text-sm transition-all duration-150 ${
          isMe
            ? 'bg-[#D9FDD3] dark:bg-[#005C4B] text-slate-900 dark:text-slate-100 rounded-br-sm shadow-emerald-900/5'
            : 'bg-white dark:bg-[#202C33] text-slate-900 dark:text-slate-100 rounded-bl-sm shadow-slate-900/5'
        }`}
      >
        {/* Quick Hover Action: Reply */}
        <button
          onClick={() => onReply(message)}
          className={`absolute -top-3 ${
            isMe ? '-left-8' : '-right-8'
          } p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-emerald-600 shadow-md border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10`}
          title="Reply"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
        </button>

        {/* Sender Name in Group Chat */}
        {!isMe && isGroup && showSenderHeader && (
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 select-none">
            {message.senderName || 'Member'}
          </div>
        )}

        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-lg text-xs border-l-4 select-none ${
              isMe
                ? 'bg-emerald-600/10 dark:bg-black/20 border-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800/80 border-emerald-500'
            }`}
          >
            <div className="font-semibold text-emerald-700 dark:text-emerald-400">
              {message.replyTo.senderName}
            </div>
            <div className="truncate text-slate-600 dark:text-slate-300">
              {message.replyTo.text}
            </div>
          </div>
        )}

        {/* Image Attachment */}
        {isImage && (
          <div className="mb-1.5 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/40">
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Shared image'}
              onClick={() => onImageClick(message.fileUrl!, message.fileName || 'Image')}
              className="max-h-80 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {/* File Attachment */}
        {isFile && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={message.fileName}
            className={`flex items-center gap-3 p-3 rounded-xl mb-1.5 transition-colors border ${
              isMe
                ? 'bg-emerald-600/10 dark:bg-black/20 border-emerald-600/30 hover:bg-emerald-600/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {getFileIcon(message.fileName)}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs truncate">
                {message.fileName || 'Document'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatFileSize(message.fileSize)}
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 hover:text-emerald-600 shrink-0" />
          </a>
        )}

        {/* Text Message Content */}
        {message.text && (
          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
            {message.text}
          </p>
        )}

        {/* Timestamp and Status Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 select-none text-[10px] ${
            isMe ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span>{formattedTime}</span>

          {isMe && (
            <span className="shrink-0">
              {message.status === 'sending' ? (
                <Clock className="w-3 h-3 text-slate-400 animate-spin" />
              ) : isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
