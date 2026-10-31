# ☁️ CloudChat – Real-Time Cloud Messaging Application

A modern, responsive, real-time messaging platform inspired by WhatsApp and Telegram. Built using **React 19, TypeScript, Tailwind CSS, and Firebase**, CloudChat provides secure authentication, instant messaging, group conversations, media sharing, and real-time notifications.

![CloudChat](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

### 1. Authentication & User Profiles
- Email and password registration and login.
- Google OAuth sign-in.
- Customizable user profiles with display names, bios, and profile pictures.
- Real-time online/offline presence using Firestore.
- Demo mode with multiple test users: Alex, Sarah, David, and Emma.

### 2. One-to-One Real-Time Messaging
- Search and discover registered users by name or email.
- Instant message delivery using Firestore `onSnapshot` listeners.
- Message status indicators:
  - 🕒 Sending
  - ✓ Sent
  - ✓✓ Delivered
  - 🔵 ✓✓ Read
- Real-time typing indicators.
- Audio feedback for incoming and outgoing messages using the Web Audio API.

### 3. Group Conversations
- Create groups with custom names, descriptions, and profile pictures.
- Add and remove group members.
- Admin and member role management.
- Group information drawer with member details and shared media.
- Leave group functionality.

### 4. Media & Document Sharing
- Upload and share images through Firebase Cloud Storage.
- Upload and share PDF, Word, Excel, CSV, code, and ZIP files.
- Display file names, sizes, and download options.
- Image lightbox with zoom, download, and external-link options.
- Upload progress indicators.

### 5. Notifications & Messaging Alerts
- Firebase Cloud Messaging (FCM) integration.
- Background push notifications using a service worker.
- Browser desktop notifications.
- Customizable audio notification settings.

### 6. Modern User Interface
- WhatsApp and Telegram-inspired design.
- Dark mode and light mode.
- Theme preferences saved using local storage.
- Custom chat wallpaper.
- Date separators in conversations.
- Responsive layouts for desktop, tablets, and smartphones.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Authentication | Firebase Authentication |
| Database | Firebase Cloud Firestore |
| File Storage | Firebase Cloud Storage |
| Notifications | Firebase Cloud Messaging |
| Real-Time Updates | Firestore `onSnapshot` |
| Build Tool | Vite 8 |
| Language | TypeScript, JavaScript |

---

## 🗂️ Firebase Database Structure

CloudChat uses Firebase Firestore with the following collections and subcollections.

### Users Collection

`users/{uid}`

| Field | Description |
|---|---|
| uid | Unique user ID |
| email | User email address |
| displayName | User's full name |
| photoURL | Profile picture URL |
| bio | User status or about information |
| status | Online or offline status |
| lastSeen | Last active timestamp |
| createdAt | Account creation timestamp |
| fcmTokens | Registered notification tokens |

### Rooms Collection

`rooms/{roomId}`

Stores direct conversations and group conversation details.

Important fields include:
- `type`: Direct or group conversation.
- `name`: Group name.
- `
