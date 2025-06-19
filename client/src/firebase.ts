import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyDmTW3ZuYmR4sjV2Mm983epj4yB-L-Mp-s",
  authDomain: `${
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "previzi-54773"
  }.firebaseapp.com`, // IMPORTANTE: Sempre use .firebaseapp.com
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "previzi-54773",
  storageBucket: `${
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "previzi-54773"
  }.appspot.com`,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1054912590243",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:1054912590243:web:a4677f2390fdc4af3b6a16",
};

// ✅ Singleton para evitar múltiplas instâncias
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

// Configurar persistência uma única vez
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Erro ao configurar persistência:", error);
  });
}

// Conectar aos emuladores em desenvolvimento (opcional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

export { auth, db };
export default app;
