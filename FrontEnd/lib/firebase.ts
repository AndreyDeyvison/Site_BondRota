import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Database, getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

/**
 * Inicializa (uma única vez) o app do Firebase e o Realtime Database.
 * Retorna `null` no servidor — o SDK client do Firebase só roda no navegador.
 */
export function getFirebaseDatabase(): Database | null {
  if (typeof window === 'undefined') return null;

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  if (!database) {
    database = getDatabase(app);
  }
  return database;
}
