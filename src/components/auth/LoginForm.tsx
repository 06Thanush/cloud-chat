import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { DEMO_USERS } from '../../utils/demoData';
import { getFriendlyAuthErrorMessage } from '../../firebase/authService';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onOpenConfig: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onOpenConfig,
}) => {
  const { login, register, loginWithGoogle, switchDemoUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [canAutoRegister, setCanAutoRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setCanAutoRegister(false);
      await login(email.trim(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setError(friendlyMsg);

      // If user doesn't exist yet, enable 1-click auto-create
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/user-not-found'
      ) {
        setCanAutoRegister(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!email || !password) return;
    try {
      setLoading(true);
      setError('');
      const defaultName = email.split('@')[0].replace(/[._]/g, ' ') || 'User';
      await register(email.trim(), password, defaultName);
    } catch (err: any) {
      console.error('Auto register error:', err);
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoSignIn = (userIndex: number = 0) => {
    switchDemoUser(DEMO_USERS[userIndex]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Error alert with optional 1-click auto register */}
      {error && (
        <div className="p-3.5 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-slide-up">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>

          {canAutoRegister && (
            <button
              type="button"
              onClick={handleQuickRegister}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-semibold text-xs transition-all shadow-sm shadow-emerald-600/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create this account & Sign In</span>
            </button>
          )}
        </div>
      )}

      {/* Demo Quick Start Banner */}
      <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Quick Demo Accounts
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
            1-Click Login
          </span>
        </div>
        <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80 mb-2.5 leading-relaxed">
          Skip registration and test multi-user real-time chatting immediately:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn(0)}
            className="px-3 py-2 bg-white dark:bg-[#1E293B] hover:bg-emerald-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all text-left flex items-center gap-2 group active:scale-98"
          >
            <span className="text-base">👨‍💻</span>
            <div className="truncate">
              <div className="leading-tight font-bold group-hover:text-emerald-600 transition-colors">Alex Morgan</div>
              <div className="text-[10px] text-slate-400">Engineer</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleDemoSignIn(1)}
            className="px-3 py-2 bg-white dark:bg-[#1E293B] hover:bg-emerald-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all text-left flex items-center gap-2 group active:scale-98"
          >
            <span className="text-base">👩‍🎨</span>
            <div className="truncate">
              <div className="leading-tight font-bold group-hover:text-emerald-600 transition-colors">Sarah Connor</div>
              <div className="text-[10px] text-slate-400">Designer</div>
            </div>
          </button>
        </div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        <span className="flex-shrink mx-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
          Or sign in with email
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full py-2.5 shadow-md font-semibold text-sm"
        >
          Sign In
        </Button>
      </form>

      {/* Google Sign-in */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Switch to Register */}
      <div className="text-center text-xs text-slate-500 pt-1">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Create an Account
        </button>
      </div>
    </div>
  );
};
