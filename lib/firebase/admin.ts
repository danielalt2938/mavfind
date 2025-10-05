import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let db: Firestore;
let storage: Storage;
let auth: Auth;

export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);

  return { app, db, storage, auth };
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const { db: database } = initializeFirebaseAdmin();
    return database;
  }
  return db;
}

export function getFirebaseStorage(): Storage {
  if (!storage) {
    const { storage: storageInstance } = initializeFirebaseAdmin();
    return storageInstance;
  }
  return storage;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const { auth: authInstance } = initializeFirebaseAdmin();
    return authInstance;
  }
  return auth;
}

// Convenience exports - initialize lazily to avoid build-time issues
export const adminDb = (() => {
  try {
    return getFirestoreDb();
  } catch (error) {
    console.warn('Firebase admin not initialized during build');
    return null as any;
  }
})();

export const adminAuth = (() => {
  try {
    return getFirebaseAuth();
  } catch (error) {
    console.warn('Firebase admin auth not initialized during build');
    return null as any;
  }
})();

export const adminStorage = (() => {
  try {
    return getFirebaseStorage();
  } catch (error) {
    console.warn('Firebase admin storage not initialized during build');
    return null as any;
  }
})();
