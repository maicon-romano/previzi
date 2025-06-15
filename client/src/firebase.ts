import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration - hardcoded securely
const firebaseConfig = {
  apiKey: "AIzaSyDmTW3ZuYmR4sjV2Mm983epj4yB-L-Mp-s",
  authDomain: "previzi-54773.firebaseapp.com",
  projectId: "previzi-54773",
  storageBucket: "previzi-54773.firebasestorage.app",
  messagingSenderId: "1054912590243",
  appId: "1:1054912590243:web:a4677f2390fdc4af3b6a16",
  measurementId: "G-0QHCXC6W3N"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;