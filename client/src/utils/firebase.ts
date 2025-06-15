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
import { TransactionType, CategoryType, SourceType } from "../types";

// Transaction utilities
export const addTransaction = async (userId: string, transaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

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

// Função para gerar transações recorrentes - APENAS para transações fixas
export const generateRecurringTransactions = async (userId: string, originalId: string, originalTransaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  // Para transações infinitas, não gerar nada - será feito dinamicamente
  if (originalTransaction.recurringType === "infinite") {
    console.log('Transação infinita - não gerando cópias, será criada dinamicamente');
    return;
  }
  
  // Para transações fixas, gerar apenas o número especificado
  const monthsToGenerate = originalTransaction.recurringMonths || 0;
  
  if (monthsToGenerate === 0) {
    console.log('Nenhuma transação recorrente para gerar');
    return;
  }
  
  for (let i = 1; i <= monthsToGenerate; i++) {
    const futureDate = new Date(originalTransaction.date);
    futureDate.setMonth(futureDate.getMonth() + i);
    
    const futureTransaction = {
      type: originalTransaction.type,
      amount: originalTransaction.amount,
      category: originalTransaction.category,
      description: originalTransaction.description,
      source: originalTransaction.source,
      date: Timestamp.fromDate(futureDate),
      status: 'pending' as const,
      recurring: originalTransaction.recurring,
      recurringType: originalTransaction.recurringType,
      userId,
      createdAt: Timestamp.fromDate(new Date()),
    };
    
    await addDoc(collection(db, "users", userId, "transactions"), futureTransaction);
  }
  
  console.log(`Geradas ${monthsToGenerate} transações recorrentes fixas`);
};

export const getTransactions = async (userId: string): Promise<TransactionType[]> => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const q = query(
    collection(db, "users", userId, "transactions"),
    orderBy("date", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      source: data.source,
      status: data.status,
      recurring: data.recurring,
      isVariableAmount: data.isVariableAmount,
      recurringType: data.recurringType,
      recurringMonths: data.recurringMonths,
      recurringEndDate: data.recurringEndDate,
      recurrenceGroupId: data.recurrenceGroupId,
      userId: data.userId,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as TransactionType;
  });
};

// Nova função para buscar transações por mês (sem orderBy para evitar erro de índice)
export const getTransactionsByMonth = async (userId: string, monthRef: string): Promise<TransactionType[]> => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const q = query(
    collection(db, "users", userId, "transactions"),
    where("monthRef", "==", monthRef)
  );
  
  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      source: data.source,
      status: data.status,
      recurring: data.recurring,
      isVariableAmount: data.isVariableAmount,
      recurringType: data.recurringType,
      recurringMonths: data.recurringMonths,
      recurringEndDate: data.recurringEndDate,
      recurrenceGroupId: data.recurrenceGroupId,
      userId: data.userId,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as TransactionType;
  });
  
  // Ordenar no cliente para evitar erro de índice
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const updateTransaction = async (userId: string, transactionId: string, updates: Partial<TransactionType>) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const transactionRef = doc(db, "users", userId, "transactions", transactionId);
  
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date);
    // Atualizar monthRef quando a data for alterada
    updateData.monthRef = `${updates.date.getFullYear()}-${String(updates.date.getMonth() + 1).padStart(2, '0')}`;
  }

  
  await updateDoc(transactionRef, updateData);
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const transactionRef = doc(db, "users", userId, "transactions", transactionId);
  await deleteDoc(transactionRef);
};

// Category utilities
export const addCategory = async (userId: string, category: Omit<CategoryType, "id" | "userId" | "createdAt">) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const categoryData = {
    ...category,
    userId,
    createdAt: Timestamp.fromDate(new Date()),
  };

  const docRef = await addDoc(collection(db, "users", userId, "categories"), categoryData);
  return docRef.id;
};

export const getCategories = async (userId: string): Promise<CategoryType[]> => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

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

export const updateCategory = async (userId: string, categoryId: string, updates: Partial<CategoryType>) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const categoryRef = doc(db, "users", userId, "categories", categoryId);
  await updateDoc(categoryRef, updates);
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

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

// Source utilities
export const addSource = async (userId: string, source: Omit<SourceType, "id" | "userId" | "createdAt">) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const sourceData = {
    ...source,
    userId,
    createdAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, "users", userId, "sources"), sourceData);
  return docRef.id;
};

export const getSources = async (userId: string): Promise<SourceType[]> => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const q = query(
    collection(db, "users", userId, "sources"),
    orderBy("name", "asc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as SourceType[];
};

export const updateSource = async (userId: string, sourceId: string, updates: Partial<SourceType>) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const sourceRef = doc(db, "users", userId, "sources", sourceId);
  await updateDoc(sourceRef, updates);
};

export const deleteSource = async (userId: string, sourceId: string) => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase environment variables.');
  }

  const sourceRef = doc(db, "users", userId, "sources", sourceId);
  await deleteDoc(sourceRef);
};

// Default sources for new users
export const createDefaultSources = async (userId: string) => {
  const defaultSources = [
    { name: "Maicon" },
    { name: "Gabi" },
    { name: "Conjunto" },
  ];

  for (const source of defaultSources) {
    await addSource(userId, source);
  }
};
