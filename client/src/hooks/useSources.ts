import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getSources, addSource as addSourceUtil, updateSource as updateSourceUtil, deleteSource as deleteSourceUtil, createDefaultSources } from "../utils/firebase";
import { SourceType } from "../types";

export function useSources() {
  const { currentUser } = useAuth();
  const [sources, setSources] = useState<SourceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadSources() {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);

      try {
        const userSources = await getSources(currentUser.uid);
        
        // Se não houver origens, criar as padrões
        if (userSources.length === 0) {
          await createDefaultSources(currentUser.uid);
          const defaultSources = await getSources(currentUser.uid);
          setSources(defaultSources);
        } else {
          setSources(userSources);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSources();
  }, [currentUser]);

  const addSource = async (sourceData: Omit<SourceType, "id" | "userId" | "createdAt">) => {
    if (!currentUser) throw new Error("User not authenticated");

    const sourceId = await addSourceUtil(currentUser.uid, sourceData);
    
    // Atualizar lista de origens
    const userSources = await getSources(currentUser.uid);
    setSources(userSources);
    
    return sourceId;
  };

  const updateSource = async (sourceId: string, updates: Partial<SourceType>) => {
    if (!currentUser) throw new Error("User not authenticated");

    await updateSourceUtil(currentUser.uid, sourceId, updates);
    
    // Atualizar lista de origens
    const userSources = await getSources(currentUser.uid);
    setSources(userSources);
  };

  const deleteSource = async (sourceId: string) => {
    if (!currentUser) throw new Error("User not authenticated");

    await deleteSourceUtil(currentUser.uid, sourceId);
    
    // Atualizar lista de origens
    const userSources = await getSources(currentUser.uid);
    setSources(userSources);
  };

  return {
    sources,
    isLoading,
    error,
    addSource,
    updateSource,
    deleteSource,
  };
}