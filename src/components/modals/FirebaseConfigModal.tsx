import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Shield,
  Server,
  Cloud,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../firebase/config';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const isConfigured = isFirebaseConfigured();

  if (!isOpen) return null;

  const envTemplate = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_VAPID_KEY=BM... (Optional FCM Web Push Key)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Firebase Integration Status
              </h3>
              <p className="text-xs text-slate-400">Database, Auth & Cloud Storage Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {/* Status Badge Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
            }`}
          >
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {isConfigured
                  ? 'Connected to Live Firebase Project'
                  : 'Running in Interactive Demo Mode'}
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {isConfigured
                  ? 'Your web app is actively reading and writing to your live Firebase Authentication, Firestore, and Cloud Storage instances.'
                  : 'Firebase credentials are currently set to default. You can test all features right now with demo accounts, and connect your live Firebase project by filling in the .env file.'}
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-xs uppercase tracking-wider">
              How to connect your Firebase Project:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                Go to the{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 underline font-medium inline-flex items-center gap-0.5"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and create a project.
              </li>
              <li>
                Enable <strong>Authentication</strong> &gt; Sign-in method &gt;{' '}
                <strong>Email/Password</strong> and <strong>Google</strong>.
              </li>
              <li>
                Create a <strong>Cloud Firestore</strong> database in test or production mode.
              </li>
              <li>
                Enable <strong>Cloud Storage</strong> for image and document uploads.
              </li>
              <li>
                In Project Settings &gt; General &gt; Your apps, add a <strong>Web App</strong> and copy the configuration keys.
              </li>
              <li>
                Paste your keys into the project's <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> file.
              </li>
            </ol>
          </div>

          {/* Environment Variables Code Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Required .env Variables
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy Template'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed border border-slate-800">
              {envTemplate}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-800 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
