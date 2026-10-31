import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, getFCM, isFirebaseConfigured } from './config';
import { sounds } from '../utils/soundUtils';

/**
 * Register Service Worker for FCM Background Notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    return reg;
  } catch (err) {
    console.warn('Service Worker registration skipped or failed:', err);
    return null;
  }
};

/**
 * Request Browser Notification permission & register FCM Token
 */
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported by this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Notification permission denied by user.');
      return null;
    }

    if (!isFirebaseConfigured()) {
      return 'local-demo-token';
    }

    const messaging = await getFCM();
    if (!messaging) return null;

    const swReg = await registerServiceWorker();
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: swReg || undefined,
      vapidKey,
    });

    if (token && userId) {
      // Save FCM token to user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
    }

    return token;
  } catch (err) {
    console.warn('Error obtaining FCM token:', err);
    return null;
  }
};

/**
 * Show a browser desktop notification
 */
export const showBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body: options?.body || 'New message received',
      icon: options?.icon || '/favicon.svg',
      tag: options?.tag || 'cloudchat-message',
    });

    if (options?.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    }

    sounds.playNotification();
  } catch (e) {
    console.debug('Failed to show notification:', e);
  }
};

/**
 * Listen for foreground FCM notifications
 */
export const subscribeForegroundMessages = async (
  onPayload: (payload: MessagePayload) => void
) => {
  const messaging = await getFCM();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    onPayload(payload);
    showBrowserNotification(
      payload.notification?.title || 'New Message',
      {
        body: payload.notification?.body,
        icon: payload.notification?.icon,
      }
    );
  });
};
