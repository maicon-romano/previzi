import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
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

  // Configurar persistência no início
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Erro ao configurar persistência:", error);
    });
  }, []);

  async function register(email: string, password: string, name: string) {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(user, { displayName: name });
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    // Detectar se está em produção (Firebase Hosting)
    const isProduction =
      window.location.hostname.includes("web.app") ||
      window.location.hostname.includes("firebaseapp.com");

    if (isProduction) {
      // Em produção, usar sempre redirect para evitar problemas de CORS
      console.log(
        "🔄 Ambiente de produção detectado, usando signInWithRedirect..."
      );
      await signInWithRedirect(auth, provider);
      return;
    }

    // Em desenvolvimento, tentar popup primeiro
    try {
      console.log("🔄 Tentando login com popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Login com popup bem-sucedido!", result.user.email);
      return;
    } catch (error: any) {
      console.error("❌ Erro no popup:", error);

      // Se falhar, usar redirect
      console.log("🔄 Fallback para signInWithRedirect...");
      await signInWithRedirect(auth, provider);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    // Verificar resultado do redirect primeiro
    const checkRedirect = async () => {
      try {
        console.log("🔍 Verificando resultado de redirect...");
        const result = await getRedirectResult(auth);
        if (result?.user && mounted) {
          console.log("✅ Usuário logado via redirect:", result.user.email);
          setCurrentUser(result.user);
          // Forçar navegação após login bem-sucedido
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 100);
        }
      } catch (error) {
        console.error("❌ Erro no getRedirectResult:", error);
      }
    };

    // Sempre verificar redirect ao carregar a página
    checkRedirect().finally(() => {
      // Configurar listener de autenticação
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (mounted) {
          console.log("👤 onAuthStateChanged:", user ? user.email : "null");
          setCurrentUser(user);
          setLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
