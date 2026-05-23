import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if config keys are provided and not default placeholders
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.apiKey !== "undefined" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "" &&
  firebaseConfig.projectId !== "undefined";

let app;
let auth = null;
let db = null;
let storage = null;
let isMockMode = true;

if (isConfigValid) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isMockMode = false;
    console.log("Studier: Firebase initialized successfully in live database mode.");
  } catch (error) {
    console.error("Studier: Firebase initialization error, falling back to local Mock Mode:", error);
    isMockMode = true;
  }
} else {
  console.log("Studier: No Firebase environment variables found. Running in offline-friendly Mock Mode (Local Storage).");
}

export { auth, db, storage, isMockMode };
export default app;
