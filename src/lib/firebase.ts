// src/lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import admin from 'firebase-admin';

// Client-seitige Firebase-Konfiguration (für den Browser)
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Client-App initialisieren
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Server-seitige Admin-SDK-Initialisierung (für sichere Aktionen)
// Wir prüfen, ob die Admin-App bereits initialisiert ist
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  // Wir initialisieren nur, wenn die Credentials auch wirklich da sind.
  // Das verhindert Abstürze, wenn die .env-Datei noch nicht vollständig ist.
  if (privateKey && clientEmail && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error('Firebase Admin Initialization Error:', error);
    }
  } else {
    // Dieser Log hilft bei der Fehlersuche, wenn die .env-Variablen fehlen.
    console.warn("Firebase Admin credentials are not set in .env. Server-side actions requiring admin privileges may fail.");
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;
const adminStorage = admin.apps.length ? admin.storage() : null;

export { app, db, storage, admin, adminDb, adminAuth, adminStorage };
