import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
const normalizedStorageBucket = rawStorageBucket
  ? rawStorageBucket.replace(/^gs:\/\//, "").replace(/\/+$/, "")
  : "";
const fallbackStorageBucket = normalizedStorageBucket.endsWith(".firebasestorage.app")
  ? normalizedStorageBucket.replace(".firebasestorage.app", ".appspot.com")
  : "";
const storageBucketCandidates = [
  fallbackStorageBucket,
  normalizedStorageBucket,
].filter(Boolean);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: storageBucketCandidates[0],
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app, `gs://${storageBucketCandidates[0]}`);
const isMockMode = false;

export { app, auth, db, storage, storageBucketCandidates, isMockMode };
export default app;
