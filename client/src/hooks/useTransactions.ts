import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToTransactions } from "../utils/firestore";
import { TransactionType } from "../types";

export function useTransactions() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscrever para atualizações em tempo real
    const unsubscribe = subscribeToTransactions(
      currentUser.uid,
      (userTransactions) => {
        setTransactions(userTransactions);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error in transactions subscription:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  return {
    transactions,
    isLoading,
    error,
  };
}
