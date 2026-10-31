# CloudChat — Real-Time Cloud Messaging Application

A modern, production-ready real-time messaging application inspired by WhatsApp and Telegram, built with **React**, **TypeScript**, **Tailwind CSS**, and **Firebase**.

![CloudChat](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Features

### 1. Authentication & User Profile
- **Email & Password**: Registration and login with password validation.
- **Google Sign-In**: One-click Google OAuth authentication with popup.
- **User Profiles**: Custom display name, bio/status ("Hey there! I am using CloudChat."), and custom profile picture uploads.
- **Real-Time Presence**: Online/offline status indicator synchronized with Firestore presence tracking.
- **Quick Demo Mode**: Multi-user instant test mode allowing 1-click switching between demo users (Alex, Sarah, David, Emma) to test real-time communication without creating accounts manually.

### 2. One-to-One Direct Chat
- **User Discovery**: Instant search for registered users by name or email.
- **Real-time Messaging**: Sub-second message delivery powered by Firestore `onSnapshot` real-time listeners.
- **Message Status Receipts**:
  - 🕒 Sending
  - ✓ Sent
  - ✓✓ Delivered
  - <span style="color:#38bdf8">✓✓ Read</span> (Blue double checks)
- **Live Typing Indicators**: Animated `...typing` indicator synchronized across clients.
- **Interactive Audio Feedback**: Native Web Audio API sound chimes for incoming messages and sent messages (no broken external audio links).

### 3. Group Conversations
- **Group Creation**: Create team and community channels with custom group names, descriptions, and avatars.
- **Member Management**: Add new contacts, view member roles (Admin / Member), and remove members.
- **Group Info Drawer**: Slide-over details panel showing member directory, creation date, and shared media gallery.
- **Leave Group**: Seamless group departure with member synchronization.

### 4. Media & Document Sharing
- **Photo Sharing**: Image upload to Firebase Cloud Storage with progress bar and instant chat bubble rendering.
- **Document Sharing**: Share PDF, Word, Excel, CSV, code, and zip archives with file icon badges, file sizes, and download buttons.
- **Fullscreen Lightbox Viewer**: Click any photo to open a high-res image modal with zoom, download, and external link options.

### 5. Notifications & FCM
- **Firebase Cloud Messaging**: Background push notifications with service worker (`firebase-messaging-sw.js`).
- **Browser Desktop Notifications**: Web notification API alerts for new incoming messages.
- **Audio Chimes**: Toggleable audio sound alerts for incoming chats.

### 6. WhatsApp & Telegram Inspired UI / UX
- **Theme Support**: Seamless Dark Mode and Light Mode with persistence in `localStorage`.
- **Chat Wallpaper**: Custom subtle geometric chat background pattern.
- **Date Dividers**: Clean chat timeline grouping ("Today", "Yesterday", "October 30, 2026").
- **Responsive Design**: Flawless experience across mobile smartphones, tablets, and desktop displays.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript |
| **Styling** | Tailwind CSS 3.4 |
| **Icons** | Lucide React |
| **Authentication** | Firebase Authentication (Email/Password & Google) |
| **Database** | Firebase Cloud Firestore (Real-time `onSnapshot`) |
| **Storage** | Firebase Cloud Storage |
| **Push Notifications**| Firebase Cloud Messaging (FCM) & Web Notifications |
| **Build Tool** | Vite 8 |

---

## 📂 Firebase Database Schema

### `users` collection:
```typescript
{
  uid: string;              // User ID
  email: string;            // User email
  displayName: string;      // Full Name
  photoURL: string | null;  // Avatar image URL
  bio: string;              // Status / About info
  status: 'online' | 'offline'; // Real-time presence
  lastSeen: Timestamp;      // Last active timestamp
  createdAt: Timestamp;     // Account creation date
  fcmTokens: string[];      // Registered device push tokens
}
```

### `rooms` collection:
```typescript
{
  id: string;               // Room document ID (direct rooms use sorted uids: uidA_uidB)
  type: 'direct' | 'group'; // Conversation type
  name?: string;            // Group title (for groups)
  photoURL?: string;        // Group avatar
  description?: string;     // Group description
  members: string[];        // Array of user IDs
  memberDetails: {          // Map of member metadata
    [uid: string]: {
      displayName: string;
      photoURL: string;
      email: string;
      role?: 'admin' | 'member';
    }
  };
  adminIds?: string[];      // Group administrators
  createdBy: string;        // Creator UID
  createdAt: Timestamp;     // Creation timestamp
  updatedAt: Timestamp;     // Last activity timestamp
  lastMessage?: {           // Message preview
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'file';
  };
  unreadCount: { [uid: string]: number }; // Unread counters per user
  typing: { [uid: string]: boolean };      // Real-time typing status
}
```

### `rooms/{roomId}/messages` subcollection:
```typescript
{
  id: string;               // Message document ID
  roomId: string;           // Parent room ID
  senderId: string;         // Sender UID
  senderName: string;       // Sender display name
  senderPhoto?: string;     // Sender avatar
  text: string;             // Message body or caption
  type: 'text' | 'image' | 'file'; // Message type
  fileUrl?: string;         // Cloud Storage download URL
  fileName?: string;        // Attachment file name
  fileSize?: number;        // File size in bytes
  createdAt: Timestamp;     // Message sent timestamp
  readBy: string[];         // List of user IDs who have seen the message
  status: 'sent' | 'delivered' | 'read';
  replyTo?: {               // Optional quoted message
    id: string;
    senderName: string;
    text: string;
  };
}
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or later (Node v20+ recommended)
- **npm** or **yarn**
- **A Firebase account**: [https://console.firebase.google.com](https://console.firebase.google.com)

---

### 2. Installation & Setup

1. **Clone or Open Project Directory in VS Code**:
   ```bash
   cd "Cloud Chat Application"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase project credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_FIREBASE_VAPID_KEY=your_fcm_vapid_key # Optional
   ```

---

### 3. Firebase Console Configuration

1. **Create a Firebase Project**:
   - Visit [Firebase Console](https://console.firebase.google.com) and click **Add Project**.

2. **Enable Authentication**:
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password**.
   - Enable **Google** (select your project support email).

3. **Create Cloud Firestore**:
   - Go to **Build > Firestore Database > Create Database**.
   - Choose a location and start in **Test mode** (or production mode with our `firestore.rules`).

4. **Enable Cloud Storage**:
   - Go to **Build > Storage > Get Started**.
   - Create the default storage bucket for media uploads.

5. **Deploy Security Rules**:
   - Paste the contents of `firestore.rules` into your Firestore Rules tab.
   - Paste the contents of `storage.rules` into your Storage Rules tab.

---

### 4. Running the Application in VS Code

Start the local development server:
```bash
npm run dev
```

Open your browser at:
```
http://localhost:5173
```

> **Testing Multi-User Real-Time Chat locally:**
> Open two different browser windows (e.g. Chrome and Chrome Incognito, or Firefox).
> - In Window 1: Sign in with user A (or Demo User Alex)
> - In Window 2: Sign in with user B (or Demo User Sarah)
> - Search for the user in Window 1, send a message, and observe the instant real-time message delivery, typing indicators, and double blue check read receipts in Window 2!

---

### 5. Building for Production

Compile TypeScript and build the optimized production bundle:
```bash
npm run build
```
The output will be generated inside the `dist/` directory.

You can preview the production build locally with:
```bash
npm run preview
```

---

### 6. Deploying to Firebase Hosting

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy Everything (Hosting + Firestore Rules + Storage Rules)**:
   ```bash
   firebase deploy
   ```

Your app will be live on `https://<your-project-id>.web.app`! 🎉

---

## 🔒 Security Best Practices

- Authenticated users can only read messages in rooms they are members of.
- Message senders are validated against `request.auth.uid`.
- File uploads are constrained by file size (< 25MB for attachments, < 5MB for profile avatars) and content type.
- User presence is automatically managed and disconnected on window unload.
