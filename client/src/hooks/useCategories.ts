import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCategories, addCategory as addCategoryUtil, deleteCategory as deleteCategoryUtil, createDefaultCategories } from "../utils/firebase";
import { CategoryType } from "../types";

export function useCategories() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userCategories = await getCategories(currentUser.uid);
        
        // If user has no categories, create default ones
        if (userCategories.length === 0) {
          await createDefaultCategories(currentUser.uid);
          const newCategories = await getCategories(currentUser.uid);
          setCategories(newCategories);
        } else {
          setCategories(userCategories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [currentUser]);

  const addCategory = async (categoryData: Omit<CategoryType, "id" | "userId" | "createdAt">) => {
    if (!currentUser) throw new Error("User not authenticated");

    const categoryId = await addCategoryUtil(currentUser.uid, categoryData);
    
    // Refetch categories to update the list
    const userCategories = await getCategories(currentUser.uid);
    setCategories(userCategories);
    
    return categoryId;
  };

  const deleteCategory = async (categoryId: string) => {
    if (!currentUser) throw new Error("User not authenticated");

    await deleteCategoryUtil(currentUser.uid, categoryId);
    
    // Refetch categories to update the list
    const userCategories = await getCategories(currentUser.uid);
    setCategories(userCategories);
  };

  return {
    categories,
    isLoading,
    error,
    addCategory,
    deleteCategory,
  };
}
