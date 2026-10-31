import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle as authLoginWithGoogle,
  logoutUser,
  updateUserPresence,
  updateUserProfileData,
} from '../firebase/authService';
import { DEMO_USERS } from '../utils/demoData';
import type { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, photo?: string, bio?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string; bio?: string }) => Promise<void>;
  switchDemoUser: (user: UserProfile) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isFirebaseConfigured();

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cloudchat_demo_uid');
    return Boolean(saved) || !isConfigured;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedDemoUid = localStorage.getItem('cloudchat_demo_uid');
    if (savedDemoUid) {
      return DEMO_USERS.find((u) => u.uid === savedDemoUid) || DEMO_USERS[0];
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Handle Firebase Auth state changes
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (fbUser) {
        // Authenticated with real Firebase
        localStorage.removeItem('cloudchat_demo_uid');
        setIsDemoMode(false);

        // Subscribe to live profile document in Firestore
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          unsubscribeUserDoc = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                setCurrentUser(data);
              } else {
                setCurrentUser({
                  uid: fbUser.uid,
                  email: fbUser.email || '',
                  displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                  photoURL: fbUser.photoURL || null,
                  status: 'online',
                  bio: 'Hey there! I am using CloudChat.',
                });
              }
              setLoading(false);
            },
            (error) => {
              console.warn('Firestore user profile snapshot notice:', error);
              setCurrentUser({
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                photoURL: fbUser.photoURL || null,
                status: 'online',
                bio: 'Hey there! I am using CloudChat.',
              });
              setLoading(false);
            }
          );
        } catch {
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            photoURL: fbUser.photoURL || null,
            status: 'online',
            bio: 'Hey there! I am using CloudChat.',
          });
          setLoading(false);
        }

        updateUserPresence(fbUser.uid, 'online');
      } else {
        // No Firebase user session
        const savedDemoUid = localStorage.getItem('cloudchat_demo_uid');
        if (savedDemoUid) {
          const demoUser = DEMO_USERS.find((u) => u.uid === savedDemoUid) || DEMO_USERS[0];
          setCurrentUser(demoUser);
          setIsDemoMode(true);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, [isConfigured]);

  // Online / Offline Presence Tracking for active user
  useEffect(() => {
    if (!currentUser || isDemoMode || !isConfigured) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresence(currentUser.uid, 'online');
      } else {
        updateUserPresence(currentUser.uid, 'offline');
      }
    };

    const handleBeforeUnload = () => {
      updateUserPresence(currentUser.uid, 'offline');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, isDemoMode, isConfigured]);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await loginWithEmail(email, pass);
      localStorage.removeItem('cloudchat_demo_uid');
      setCurrentUser(profile);
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, pass: string, name: string, photo?: string, bio?: string) => {
      setLoading(true);
      try {
        const profile = await registerWithEmail(email, pass, name, photo, bio);
        localStorage.removeItem('cloudchat_demo_uid');
        setCurrentUser(profile);
        setIsDemoMode(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await authLoginWithGoogle();
      localStorage.removeItem('cloudchat_demo_uid');
      setCurrentUser(profile);
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('cloudchat_demo_uid');
    setIsDemoMode(false);
    if (!isDemoMode && currentUser?.uid) {
      await logoutUser(currentUser.uid);
    }
    setCurrentUser(null);
  }, [currentUser, isDemoMode]);

  const updateProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string; bio?: string }) => {
      if (!currentUser) return;
      if (isDemoMode) {
        setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
        return;
      }
      await updateUserProfileData(currentUser.uid, data);
    },
    [currentUser, isDemoMode]
  );

  const switchDemoUser = useCallback((user: UserProfile) => {
    localStorage.setItem('cloudchat_demo_uid', user.uid);
    setCurrentUser(user);
    setIsDemoMode(true);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isConfigured,
        isDemoMode,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
