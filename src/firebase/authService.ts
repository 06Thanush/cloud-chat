import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './config';
import type { UserProfile, UserStatus } from '../types';

// Avatar generator fallback using dicebear
export const getDefaultAvatar = (name: string): string => {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'user')}`;
};

/**
 * Friendly error message translator for Firebase Authentication & Firestore errors
 */
export const getFriendlyAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'No account found with this email or incorrect password. If this is your first time, click "Create Account" or use Auto-Create below.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in your Firebase project. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/unauthorized-domain':
      return 'This domain (localhost) is not in your Firebase authorized domains list. Go to Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      if (message.includes('permission-denied') || code === 'permission-denied') {
        return 'Firestore database permissions error. Please ensure Cloud Firestore is enabled in your Firebase Console in Test Mode.';
      }
      return message || 'Authentication failed. Please check your credentials.';
  }
};

/**
 * Register a new user with Email and Password
 */
export const registerWithEmail = async (
  email: string,
  pass: string,
  displayName: string,
  photoURL?: string,
  bio: string = 'Hey there! I am using CloudChat.'
): Promise<UserProfile> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add your credentials to the .env file.');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  const finalPhoto = photoURL || getDefaultAvatar(displayName || email.split('@')[0]);

  // Update Firebase Auth profile
  try {
    await updateProfile(user, {
      displayName,
      photoURL: finalPhoto,
    });
  } catch (err) {
    console.warn('Could not update Auth profile details:', err);
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || user.email?.split('@')[0] || 'User',
    photoURL: finalPhoto,
    bio,
    status: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
    fcmTokens: [],
  };

  // Save to Firestore 'users' collection (fault-tolerant if Firestore is still being enabled)
  try {
    await setDoc(doc(db, 'users', user.uid), profile);
  } catch (firestoreErr) {
    console.warn('Notice: Firestore user document write skipped or pending setup:', firestoreErr);
  }

  return profile;
};

/**
 * Log in with Email and Password
 */
export const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add your credentials to the .env file.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  let profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: user.displayName || email.split('@')[0] || 'User',
    photoURL: user.photoURL || getDefaultAvatar(user.displayName || email),
    bio: 'Hey there! I am using CloudChat.',
    status: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
    fcmTokens: [],
  };

  // Safely sync with Firestore if database exists
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, profile);
    } else {
      profile = userDoc.data() as UserProfile;
      await updateDoc(userDocRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
      });
    }
  } catch (firestoreErr) {
    console.warn('Notice: Firestore profile sync notice (using Auth profile):', firestoreErr);
  }

  return profile;
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async (): Promise<UserProfile> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add your credentials to the .env file.');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  let profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || getDefaultAvatar(user.displayName || 'Google User'),
    bio: 'Hey there! I am using CloudChat.',
    status: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
    fcmTokens: [],
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, profile);
    } else {
      profile = userDoc.data() as UserProfile;
      await updateDoc(userDocRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
      });
    }
  } catch (firestoreErr) {
    console.warn('Notice: Firestore Google user sync notice:', firestoreErr);
  }

  return profile;
};

/**
 * Logout
 */
export const logoutUser = async (currentUid?: string): Promise<void> => {
  if (currentUid && isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'users', currentUid), {
        status: 'offline',
        lastSeen: serverTimestamp(),
      });
    } catch {
      // Ignore cleanup error on logout
    }
  }
  await signOut(auth);
};

/**
 * Update user status (online / offline)
 */
export const updateUserPresence = async (uid: string, status: UserStatus): Promise<void> => {
  if (!isFirebaseConfigured() || !uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      status,
      lastSeen: serverTimestamp(),
    });
  } catch (err) {
    console.debug('Failed to update presence:', err);
  }
};

/**
 * Update Profile Details
 */
export const updateUserProfileData = async (
  uid: string,
  data: { displayName?: string; photoURL?: string; bio?: string }
): Promise<void> => {
  if (!isFirebaseConfigured() || !uid) return;

  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    } catch (err) {
      console.warn('Could not update Firebase Auth profile:', err);
    }
  }

  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not update Firestore user document:', err);
  }
};

/**
 * Fetch a single user profile
 */
export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!isFirebaseConfigured() || !uid) return null;
  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Could not fetch user profile:', err);
  }
  return null;
};

/**
 * Fetch all registered users excluding current user
 */
export const fetchAllUsers = async (excludeUid?: string): Promise<UserProfile[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.id !== excludeUid) {
        users.push(docSnap.data() as UserProfile);
      }
    });
    return users;
  } catch (err) {
    console.warn('Notice: Could not fetch users list from Firestore (rules or uncreated):', err);
    return [];
  }
};
