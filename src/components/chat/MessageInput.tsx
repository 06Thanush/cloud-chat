import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { Message, AttachmentPreview } from '../../types';
import { formatFileSize } from '../../utils/dateUtils';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const COMMON_EMOJIS = ['😊', '😂', '🔥', '👍', '❤️', '🎉', '🚀', '🙌', '👏', '💯', '✨', '☕', '😎', '🙏'];

interface MessageInputProps {
  replyMessage: Message | null;
  onClearReply: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  replyMessage,
  onClearReply,
}) => {
  const { sendTextMessage, sendFileMessage, updateTyping, uploading, uploadProgress } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentPreview | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    updateTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit.');
      return;
    }

    const previewUrl = isImage ? URL.createObjectURL(file) : '';
    setSelectedAttachment({
      file,
      previewUrl,
      type: isImage ? 'image' : 'file',
      name: file.name,
      size: file.size,
    });

    setShowAttachMenu(false);
    // Reset file inputs
    e.target.value = '';
    textareaRef.current?.focus();
  };

  const clearAttachment = () => {
    if (selectedAttachment?.previewUrl) {
      URL.revokeObjectURL(selectedAttachment.previewUrl);
    }
    setSelectedAttachment(null);
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    const replyPayload = replyMessage
      ? {
          id: replyMessage.id,
          senderName: replyMessage.senderName,
          text: replyMessage.text || (replyMessage.type === 'image' ? 'Photo' : 'File'),
        }
      : undefined;

    if (selectedAttachment) {
      const fileToSend = selectedAttachment.file;
      const caption = text.trim();
      clearAttachment();
      setText('');
      if (onClearReply) onClearReply();
      updateTyping(false);
      await sendFileMessage(fileToSend, caption, replyPayload);
      return;
    }

    if (!text.trim()) return;

    const messageText = text;
    setText('');
    if (onClearReply) onClearReply();
    updateTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendTextMessage(messageText, replyPayload);
  };

  return (
    <div className="bg-white dark:bg-[#111B21] border-t border-slate-200 dark:border-[#222D34] p-3 transition-colors relative z-20">
      {/* Uploading Progress Bar */}
      {uploading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleSelectFile(e, true)}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.csv,.xlsx,.json"
        className="hidden"
        onChange={(e) => handleSelectFile(e, false)}
      />

      {/* Reply Banner */}
      {replyMessage && (
        <div className="mb-2 p-2 bg-slate-100 dark:bg-[#202C33] rounded-xl flex items-center justify-between border-l-4 border-emerald-500 text-xs">
          <div className="min-w-0 pr-2">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
              Replying to {replyMessage.senderName}
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate block">
              {replyMessage.text || (replyMessage.type === 'image' ? '📷 Photo' : '📎 Document')}
            </span>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Card */}
      {selectedAttachment && (
        <div className="mb-2 p-2.5 bg-slate-100 dark:bg-[#202C33] rounded-2xl flex items-center gap-3 border border-slate-200 dark:border-[#2A3942] animate-slide-up">
          {selectedAttachment.type === 'image' ? (
            <img
              src={selectedAttachment.previewUrl}
              alt="Preview"
              className="w-14 h-14 object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <FileText className="w-7 h-7" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-100">
              {selectedAttachment.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {formatFileSize(selectedAttachment.size)} • Ready to send
            </div>
          </div>

          <button
            onClick={clearAttachment}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-500 transition-colors"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="mb-2 p-2 bg-slate-50 dark:bg-[#202C33] rounded-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200 dark:border-[#2A3942] animate-slide-up">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-lg transition-transform active:scale-125 select-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Controls Bar */}
      <div className="flex items-end gap-2">
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-xl transition-colors ${
            showEmojiPicker
              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202C33]'
          }`}
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Attachment Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-xl transition-colors ${
              showAttachMenu
                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202C33]'
            }`}
            title="Attach file or photo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {showAttachMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowAttachMenu(false)}
              />
              <div className="absolute bottom-12 left-0 w-44 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-40 animate-slide-up">
                <button
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span>Photos & Images</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Documents & Files</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 bg-slate-100 dark:bg-[#202C33] rounded-2xl px-3.5 py-2 flex items-center border border-transparent focus-within:border-emerald-500/50 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedAttachment
                ? 'Add an optional caption...'
                : 'Type a message... (Press Enter to send)'
            }
            className="w-full bg-transparent resize-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none max-h-32"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={uploading || (!text.trim() && !selectedAttachment)}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm shadow-emerald-600/30 transition-all"
          title="Send message"
        >
          {uploading ? (
            <LoadingSpinner size="sm" color="text-white" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
