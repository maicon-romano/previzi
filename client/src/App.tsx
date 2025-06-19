import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import TransactionsMonthly from "./pages/TransactionsMonthly";
import Predictability from "./pages/Predictability";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { currentUser, loading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {currentUser ? <Redirect to="/dashboard" /> : <AuthPage />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <TransactionsMonthly />
        </ProtectedRoute>
      </Route>
      <Route path="/predictability">
        <ProtectedRoute>
          <Predictability />
        </ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      </Route>
      <Route path="/categories">
        <ProtectedRoute>
          <Categories />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        {currentUser ? <Redirect to="/dashboard" /> : <Redirect to="/auth" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster
            position="bottom-right"
            expand={false}
            richColors={false}
            closeButton
            duration={4000}
            visibleToasts={3}
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#1f2937",
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                fontSize: "14px",
                fontWeight: "500",
              },
              className: "rounded-lg",
            }}
            theme="light"
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
