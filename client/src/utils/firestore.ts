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

// Transaction utilities using the real Firestore structure
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
  
  // Se a transação é recorrente, gerar transações futuras simples
  if (transaction.recurring) {
    await generateRecurringTransactions(userId, transaction);
  }
  
  return docRef.id;
};

// Função simplificada para gerar transações recorrentes
const generateRecurringTransactions = async (userId: string, originalTransaction: Omit<TransactionType, "id" | "userId" | "createdAt">) => {
  // Gerar apenas 3 meses futuros para recorrentes
  const monthsToGenerate = 3;
  
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
      userId,
      createdAt: Timestamp.fromDate(new Date()),
    };
    
    await addDoc(collection(db, "users", userId, "transactions"), futureTransaction);
  }
};

// Função para buscar todas as transações do usuário
export const getTransactions = async (userId: string): Promise<TransactionType[]> => {
  const q = query(
    collection(db, "users", userId, "transactions"),
    where("userId", "==", userId),
    orderBy("date", "desc")
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
      date: data.date.toDate(),
      status: data.status,
      recurring: data.recurring,
      userId: data.userId,
      createdAt: data.createdAt.toDate(),
    };
  }) as TransactionType[];
  
  return transactions;
};

// Função para buscar transações por mês usando filtros de data conforme especificado
export const getTransactionsByMonth = async (userId: string, year: number, month: number): Promise<TransactionType[]> => {
  const start = startOfMonth(new Date(year, month - 1)); // month é 1-based, Date é 0-based
  const end = endOfMonth(new Date(year, month - 1));
  
  const q = query(
    collection(db, "users", userId, "transactions"),
    where("userId", "==", userId),
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<=", Timestamp.fromDate(end)),
    orderBy("date", "desc")
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
      date: data.date.toDate(),
      status: data.status,
      recurring: data.recurring,
      userId: data.userId,
      createdAt: data.createdAt.toDate(),
    };
  }) as TransactionType[];
  
  return transactions;
};

// Função com listener em tempo real para transações do mês
export const subscribeToMonthlyTransactions = (
  userId: string, 
  year: number, 
  month: number, 
  callback: (transactions: TransactionType[]) => void
) => {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  
  const q = query(
    collection(db, "users", userId, "transactions"),
    where("userId", "==", userId),
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<=", Timestamp.fromDate(end)),
    orderBy("date", "desc")
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        source: data.source,
        date: data.date.toDate(),
        status: data.status,
        recurring: data.recurring,
        userId: data.userId,
        createdAt: data.createdAt.toDate(),
      };
    }) as TransactionType[];
    
    callback(transactions);
  });
};

// Atualizar transação
export const updateTransaction = async (userId: string, transactionId: string, updates: Partial<TransactionType>) => {
  const docRef = doc(db, "users", userId, "transactions", transactionId);
  
  const updateData: any = {};
  if (updates.type) updateData.type = updates.type;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.category) updateData.category = updates.category;
  if (updates.description) updateData.description = updates.description;
  if (updates.source) updateData.source = updates.source;
  if (updates.date) updateData.date = Timestamp.fromDate(updates.date);
  if (updates.status) updateData.status = updates.status;
  if (updates.recurring !== undefined) updateData.recurring = updates.recurring;
  
  await updateDoc(docRef, updateData);
};

// Deletar transação
export const deleteTransaction = async (userId: string, transactionId: string) => {
  const docRef = doc(db, "users", userId, "transactions", transactionId);
  await deleteDoc(docRef);
};

// Função auxiliar para converter string de mês (YYYY-MM) para year/month
export const parseMonthString = (monthString: string): { year: number; month: number } => {
  const [yearStr, monthStr] = monthString.split('-');
  return {
    year: parseInt(yearStr),
    month: parseInt(monthStr)
  };
};

// Função auxiliar para criar string de mês (YYYY-MM)
export const createMonthString = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

// Category utilities (usando estrutura simplificada)
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
  const q = query(collection(db, "users", userId, "categories"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    };
  }) as CategoryType[];
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  const docRef = doc(db, "users", userId, "categories", categoryId);
  await deleteDoc(docRef);
};

// Criar categorias padrão
export const createDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    { name: "Salário", type: "income" as const, icon: "💰" },
    { name: "Freelance", type: "income" as const, icon: "💻" },
    { name: "Investimentos", type: "income" as const, icon: "📈" },
    { name: "Moradia", type: "expense" as const, icon: "🏠" },
    { name: "Alimentação", type: "expense" as const, icon: "🍽️" },
    { name: "Transporte", type: "expense" as const, icon: "🚗" },
    { name: "Lazer", type: "expense" as const, icon: "🎬" },
    { name: "Saúde", type: "expense" as const, icon: "🏥" },
    { name: "Educação", type: "expense" as const, icon: "📚" },
  ];

  for (const category of defaultCategories) {
    await addCategory(userId, category);
  }
};