import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  senderName?: string;
  timestamp?: string;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Image',
  senderName,
  timestamp,
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = title || 'chat-image.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none">
      {/* Top action bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white/90 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div>
          <h4 className="text-sm font-semibold truncate max-w-sm">{title}</h4>
          {(senderName || timestamp) && (
            <p className="text-xs text-white/60">
              {senderName} {timestamp ? `• ${timestamp}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="max-w-4xl max-h-[85vh] p-4 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform"
        />
      </div>
    </div>
  );
};
