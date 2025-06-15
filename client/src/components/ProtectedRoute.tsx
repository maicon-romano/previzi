import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Layout from "./Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setLocation("/auth");
    }
  }, [currentUser, setLocation]);

  if (!currentUser) {
    return null;
  }

  return <Layout>{children}</Layout>;
}
