import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from "../firebase";
import { TransactionType, CategoryType } from "../types";

// Transaction utilities
export const addTransaction = async (userId: string, transaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  const transactionData = {
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    source: transaction.source,
    date: Timestamp.fromDate(transaction.date),
    status: transaction.status,
    recurring: transaction.recurring,
    userId,
    createdAt: Timestamp.fromDate(new Date()),
  };

  console.log('Salvando transação no Firestore:', transactionData);

  const docRef = await addDoc(collection(db, "users", userId, "transactions"), transactionData);
  
  // Se a transação é recorrente, pode gerar transações futuras (implementação simplificada)
  if (transaction.recurring) {
    // Para transações recorrentes, apenas salvar uma transação por vez
    console.log('Transação recorrente criada. Futuras transações podem ser geradas conforme necessário.');
  }
  
  return docRef.id;
};

// Função para gerar transações recorrentes (simplificada conforme estrutura real)
export const generateRecurringTransactions = async (userId: string, originalId: string, originalTransaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  // Para transações recorrentes, gerar apenas as próximas 3 mensalidades
  const monthsToGenerate = 3;
  
  for (let i = 1; i <= monthsToGenerate; i++) {
    const futureDate = new Date(originalTransaction.date);
    futureDate.setMonth(futureDate.getMonth() + i);
    
    const futureTransaction = {
      type: originalTransaction.type,
      amount: originalTransaction.amount, // Sempre usar o valor original para recorrentes
      category: originalTransaction.category,
      description: originalTransaction.description,
      source: originalTransaction.source,
      date: Timestamp.fromDate(futureDate),
      status: 'pending' as const,
      recurring: originalTransaction.recurring,
      userId,
      createdAt: Timestamp.fromDate(new Date()),
    };
    
    await addDoc(collection(db, "users", userId, "transactions"), futureTransaction);
  }
};

export const getTransactions = async (userId: string): Promise<TransactionType[]> => {
  const q = query(
    collection(db, "users", userId, "transactions"),
    orderBy("date", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      originalDate: data.originalDate ? data.originalDate.toDate() : undefined,
    };
  }) as TransactionType[];
};

// Nova função para buscar transações por mês (sem orderBy para evitar erro de índice)
export const getTransactionsByMonth = async (userId: string, monthRef: string): Promise<TransactionType[]> => {
  const q = query(
    collection(db, "users", userId, "transactions"),
    where("monthRef", "==", monthRef)
  );
  
  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      originalDate: data.originalDate ? data.originalDate.toDate() : undefined,
    };
  }) as TransactionType[];
  
  // Ordenar no cliente para evitar erro de índice
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const updateTransaction = async (userId: string, transactionId: string, updates: Partial<TransactionType>) => {
  const transactionRef = doc(db, "users", userId, "transactions", transactionId);
  
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date);
    // Atualizar monthRef quando a data for alterada
    updateData.monthRef = `${updates.date.getFullYear()}-${String(updates.date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (updates.originalDate) {
    updateData.originalDate = Timestamp.fromDate(updates.originalDate);
  }
  
  await updateDoc(transactionRef, updateData);
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const transactionRef = doc(db, "users", userId, "transactions", transactionId);
  await deleteDoc(transactionRef);
};

// Category utilities
export const addCategory = async (userId: string, category: Omit<CategoryType, "id" | "userId" | "createdAt">) => {
  const categoryData = {
    ...category,
    userId,
    createdAt: Timestamp.fromDate(new Date()),
  };

  const docRef = await addDoc(collection(db, "users", userId, "categories"), categoryData);
  return docRef.id;
};

export const getCategories = async (userId: string): Promise<CategoryType[]> => {
  const q = query(
    collection(db, "users", userId, "categories"),
    orderBy("name", "asc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as CategoryType[];
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  const categoryRef = doc(db, "users", userId, "categories", categoryId);
  await deleteDoc(categoryRef);
};

// Default categories for new users
export const createDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    // Income categories
    { name: "Salário", type: "income" as const, icon: "fas fa-briefcase" },
    { name: "Freelance", type: "income" as const, icon: "fas fa-handshake" },
    { name: "Investimentos", type: "income" as const, icon: "fas fa-chart-line" },
    { name: "Outros", type: "income" as const, icon: "fas fa-plus" },
    
    // Expense categories
    { name: "Moradia", type: "expense" as const, icon: "fas fa-home" },
    { name: "Alimentação", type: "expense" as const, icon: "fas fa-utensils" },
    { name: "Transporte", type: "expense" as const, icon: "fas fa-car" },
    { name: "Lazer", type: "expense" as const, icon: "fas fa-gamepad" },
    { name: "Saúde", type: "expense" as const, icon: "fas fa-heartbeat" },
    { name: "Educação", type: "expense" as const, icon: "fas fa-graduation-cap" },
    { name: "Outros", type: "expense" as const, icon: "fas fa-minus" },
  ];

  for (const category of defaultCategories) {
    await addCategory(userId, category);
  }
};
