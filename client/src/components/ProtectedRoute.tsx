import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Layout from "./Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout>{children}</Layout>;
}
