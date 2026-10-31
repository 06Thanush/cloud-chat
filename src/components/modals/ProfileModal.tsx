import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  User,
  Mail,
  Volume2,
  VolumeX,
  Bell,
  Check,
  Shield,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { uploadAvatar } from '../../firebase/storageService';
import { sounds } from '../../utils/soundUtils';
import { requestNotificationPermission } from '../../firebase/fcmService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenConfig,
}) => {
  const { currentUser, updateProfile, isDemoMode } = useAuth();
  if (!isOpen || !currentUser) return null;

  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [bio, setBio] = useState(currentUser.bio || 'Hey there! I am using CloudChat.');
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.photoURL);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const newUrl = await uploadAvatar(currentUser.uid, file);
      setAvatarPreview(newUrl);
      await updateProfile({ photoURL: newUrl });
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: avatarPreview || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.setEnabled(next);
    setSoundEnabled(next);
    if (next) sounds.playNotification();
  };

  const handleEnablePush = async () => {
    const token = await requestNotificationPermission(currentUser.uid);
    if (token) {
      alert('Push notifications enabled successfully!');
    } else {
      alert('Notification permission was denied or not supported.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                User Profile & Settings
              </h3>
              <p className="text-xs text-slate-400">Manage account information and sound preferences</p>
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar
                src={avatarPreview}
                name={displayName}
                size="2xl"
                showOnlineStatus={true}
                isOnline={true}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-transform active:scale-90"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              Click the camera icon to upload a profile photo
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Status / About
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Hey there! I am using CloudChat."
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Preferences & Notifications
            </span>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Audio Sound Effects
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Play pleasant audio chime on incoming and sent messages
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  soundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Push Notifications
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Receive desktop browser alerts via FCM
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                className="px-3 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 border border-blue-200 dark:border-blue-800"
              >
                Enable
              </button>
            </div>

            {/* Firebase Diagnostics */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Firebase Configuration
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isDemoMode ? 'Running in Demo mode' : 'Connected to live Firebase'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfig();
                }}
                className="px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
              >
                Setup
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              leftIcon={saveSuccess ? <Check className="w-4 h-4" /> : undefined}
              className="flex-1"
            >
              {saveSuccess ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
