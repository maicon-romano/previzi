import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactions } from "../utils/firebase";
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

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userTransactions = await getTransactions(currentUser.uid);
        setTransactions(userTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser]);

  const refetchTransactions = async () => {
    if (!currentUser) return;

    try {
      setError(null);
      const userTransactions = await getTransactions(currentUser.uid);
      setTransactions(userTransactions);
    } catch (err) {
      console.error("Error refetching transactions:", err);
      setError(err as Error);
    }
  };

  return {
    transactions,
    isLoading,
    error,
    refetchTransactions,
  };
}
