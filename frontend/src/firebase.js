import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// -----------------------------
// Firebase configuration
// -----------------------------
// The values come from frontend/.env (see .env.example).
// Vite only exposes variables that start with "VITE_".

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when the three essential values are present.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// If the keys are missing we do NOT initialise Firebase (it would throw and
// leave a blank page). The login / signup pages show a setup message instead.
export const auth = isFirebaseConfigured
  ? getAuth(initializeApp(firebaseConfig))
  : null;
