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
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { TransactionType, CategoryType } from "../types";

// Transaction utilities
export const addTransaction = async (userId: string, transaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  // Gerar monthRef baseado na data
  const monthRef = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;
  
  const transactionData = {
    ...transaction,
    userId,
    monthRef,
    createdAt: Timestamp.fromDate(new Date()),
    date: Timestamp.fromDate(transaction.date),
    originalDate: transaction.originalDate ? Timestamp.fromDate(transaction.originalDate) : undefined,
  };

  const docRef = await addDoc(collection(db, "users", userId, "transactions"), transactionData);
  
  // Se a transação é recorrente, gerar transações futuras
  if (transaction.recurring) {
    await generateRecurringTransactions(userId, docRef.id, transaction);
  }
  
  return docRef.id;
};

// Função para gerar transações recorrentes
export const generateRecurringTransactions = async (userId: string, originalId: string, originalTransaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  const monthsToGenerate = 12; // Gerar para os próximos 12 meses
  const transactions = [];
  
  for (let i = 1; i <= monthsToGenerate; i++) {
    const futureDate = new Date(originalTransaction.date);
    futureDate.setMonth(futureDate.getMonth() + i);
    
    const monthRef = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Para transações variáveis, definir amount como null
    const amount = originalTransaction.recurringType === 'variable' ? null : originalTransaction.amount;
    
    const futureTransaction = {
      type: originalTransaction.type,
      amount,
      category: originalTransaction.category,
      description: originalTransaction.description,
      source: originalTransaction.source,
      date: Timestamp.fromDate(futureDate),
      status: 'pending' as const,
      recurring: originalTransaction.recurring,
      recurringType: originalTransaction.recurringType,
      monthRef,
      originalDate: Timestamp.fromDate(originalTransaction.date),
      originalId,
      isGenerated: true,
      createdAt: Timestamp.fromDate(new Date()),
      userId,
    };
    
    transactions.push(futureTransaction);
  }
  
  // Adicionar todas as transações em batch
  for (const transaction of transactions) {
    await addDoc(collection(db, "users", userId, "transactions"), transaction);
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
