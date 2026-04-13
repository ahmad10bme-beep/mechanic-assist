import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

/**
 * NOTE
 * - Firebase client config isn't a "secret" like server keys, but it should still be managed cleanly.
 * - Put your values in `EXPO_PUBLIC_FIREBASE_*` env vars (recommended) instead of hardcoding.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // If config is missing, keep the app running without Firebase.
  app = null;
}

const database = app ? getDatabase(app) : null;
const storage = app ? getStorage(app) : null;

export { database, storage };