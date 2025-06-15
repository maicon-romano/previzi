import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyDmTW3ZuYmR4sjV2Mm983epj4yB-L-Mp-s",
  authDomain: `${
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "previzi-54773"
  }.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "previzi-54773",
  storageBucket: `${
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "previzi-54773"
  }.firebasestorage.app`,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "default_sender_id",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:1054912590243:web:a4677f2390fdc4af3b6a16",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
