import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

const isE2EMode = import.meta.env.VITE_E2E_MODE === "1";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = (
  isE2EMode
    ? ({
        name: "e2e-app",
        options: firebaseConfig,
        automaticDataCollectionEnabled: false,
      } as FirebaseApp)
    : getApps().length
      ? getApp()
      : initializeApp(firebaseConfig)
) as FirebaseApp;
