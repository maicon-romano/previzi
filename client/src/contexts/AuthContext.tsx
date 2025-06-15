import { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function register(email: string, password: string, name: string) {
    if (!auth) {
      throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
    }
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });
  }

  async function login(email: string, password: string) {
    if (!auth) {
      throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    if (!auth) {
      throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    await signInWithRedirect(auth, provider);
  }

  async function logout() {
    if (!auth) {
      throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
    }
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    if (!auth) {
      throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
    }
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    let isMounted = true;

    // If Firebase is not initialized, just mark as not loading
    if (!auth) {
      console.warn('Firebase auth not initialized. Running without authentication.');
      setLoading(false);
      return;
    }

    // Handle redirect result when user returns from Google auth
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && isMounted) {
          // User successfully signed in via redirect
          console.log('Google sign-in successful via redirect:', result.user.email);
          // The onAuthStateChanged will handle setting the user
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Handle authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        setCurrentUser(user);
        setLoading(false);
      }
    });

    // Check for redirect result first, then set up auth listener
    handleRedirectResult();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
