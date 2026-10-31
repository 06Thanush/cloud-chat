import React, { useState } from 'react';
import { MessageSquare, Sun, Moon, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useTheme } from '../../context/ThemeContext';
import { isFirebaseConfigured } from '../../firebase/config';

interface AuthModalProps {
  onOpenConfig: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenConfig }) => {
  const [isRegister, setIsRegister] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isConfigured = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-[#111B21] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#222D34] overflow-hidden my-auto animate-slide-up">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-6 text-white text-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Corner controls */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
            <button
              onClick={onOpenConfig}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors"
              title="Firebase Configuration status"
            >
              <Database className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 mb-3 shadow-inner">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">CloudChat</h1>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto">
            Modern real-time messaging powered by React, TypeScript & Firebase
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-[#202C33] border-b border-slate-200 dark:border-[#222D34]">
          <button
            onClick={() => setIsRegister(false)}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister
                ? 'bg-white dark:bg-[#111B21] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister
                ? 'bg-white dark:bg-[#111B21] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Body */}
        <div className="p-6">
          {isRegister ? (
            <RegisterForm onSwitchToLogin={() => setIsRegister(false)} />
          ) : (
            <LoginForm
              onSwitchToRegister={() => setIsRegister(true)}
              onOpenConfig={onOpenConfig}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0B141A] border-t border-slate-100 dark:border-[#222D34] flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            End-to-End Firebase Architecture
          </span>
          <button
            onClick={onOpenConfig}
            className="hover:text-emerald-500 transition-colors font-medium underline"
          >
            {isConfigured ? 'Firebase Active' : 'Setup Firebase'}
          </button>
        </div>
      </div>
    </div>
  );
};
