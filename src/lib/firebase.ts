// src/lib/firebase.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import admin from 'firebase-admin';

// Client-seitige Firebase-Konfiguration (für den Browser)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Client-App initialisieren
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app); // Verbindung zur Firestore-Datenbank
const storage = getStorage(app); // Verbindung zum Cloud Storage

// Server-seitige Admin-SDK-Initialisierung (für sichere Aktionen)
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!privateKey || !clientEmail) {
      console.warn("Firebase Admin credentials (private key or client email) are not set. Server-side actions may fail.");
    } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: clientEmail,
            privateKey: privateKey,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    }
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export { app, db, storage, admin };
