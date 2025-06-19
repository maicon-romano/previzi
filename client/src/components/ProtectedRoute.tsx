import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Layout from "./Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) {
      setLocation("/auth");
    }
  }, [currentUser, loading, setLocation]);

  if (loading) {
    return <div>Carregando...</div>; // Ou um loader melhor, se quiser
  }

  if (!currentUser) {
    return null;
  }

  return <Layout>{children}</Layout>;
}
