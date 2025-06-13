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

// Função para verificar se já existem transações recorrentes similares
const checkExistingRecurringTransactions = async (userId: string, transaction: Omit<TransactionType, "id" | "userId" | "createdAt">): Promise<boolean> => {
  const futureDate = new Date(transaction.date);
  futureDate.setMonth(futureDate.getMonth() + 1);
  
  const q = query(
    collection(db, "users", userId, "transactions"),
    where("description", "==", transaction.description),
    where("category", "==", transaction.category),
    where("amount", "==", transaction.amount),
    where("recurring", "==", true),
    where("date", ">=", Timestamp.fromDate(futureDate))
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

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
  
  // Se a transação é recorrente, verificar se já existem similares e gerar transações futuras
  if (transaction.recurring) {
    console.log('Transação marcada como recorrente, verificando duplicatas...');
    
    const hasExisting = await checkExistingRecurringTransactions(userId, transaction);
    if (!hasExisting) {
      await generateRecurringTransactions(userId, transaction);
      console.log('✅ Transações recorrentes criadas para os próximos 12 meses');
    } else {
      console.log('⚠️ Transações recorrentes similares já existem, pulando criação automática');
    }
  }
  
  return docRef.id;
};

// Função para gerar transações recorrentes automaticamente
const generateRecurringTransactions = async (userId: string, originalTransaction: Omit<TransactionType, "id" | "userId" | "createdAt">, monthsToGenerate: number = 12) => {
  // Gerar transações para os próximos N meses (padrão: 12)
  const originalDate = new Date(originalTransaction.date);
  
  console.log(`Gerando ${monthsToGenerate} transações recorrentes para a transação: ${originalTransaction.description}`);
  
  const batch = [];
  
  for (let i = 1; i <= monthsToGenerate; i++) {
    // Criar nova data mantendo o mesmo dia do mês
    const futureDate = new Date(originalDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    
    // Se o dia não existir no novo mês (ex: 31 de janeiro -> 28/29 de fevereiro)
    // o JavaScript automaticamente ajusta para o último dia válido
    if (futureDate.getDate() !== originalDate.getDate()) {
      // Se o dia mudou, definir para o último dia do mês
      futureDate.setDate(0); // Volta para o último dia do mês anterior
      futureDate.setMonth(futureDate.getMonth() + 1);
      futureDate.setDate(0); // Último dia do mês desejado
    }
    
    const futureTransaction = {
      type: originalTransaction.type,
      amount: originalTransaction.amount, // Sempre usar o valor original
      category: originalTransaction.category,
      description: originalTransaction.description,
      source: originalTransaction.source,
      date: Timestamp.fromDate(futureDate),
      status: 'pending' as const, // Todas as futuras começam como pendentes
      recurring: originalTransaction.recurring,
      userId,
      createdAt: Timestamp.fromDate(new Date()),
    };
    
    batch.push(futureTransaction);
  }
  
  // Criar todas as transações em lote para melhor performance
  try {
    for (const transaction of batch) {
      await addDoc(collection(db, "users", userId, "transactions"), transaction);
    }
    console.log(`✅ ${batch.length} transações recorrentes criadas com sucesso`);
  } catch (error) {
    console.error('Erro ao criar transações recorrentes:', error);
    throw error;
  }
};

// Função para buscar todas as transações do usuário (otimizada)
export const getTransactions = async (userId: string): Promise<TransactionType[]> => {
  // Query simplificada - remove filtro userId redundante já que estamos na subcoleção do usuário
  const q = query(
    collection(db, "users", userId, "transactions"),
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

// Função para buscar transações por mês usando filtros de data otimizada (sem índice composto)
export const getTransactionsByMonth = async (userId: string, year: number, month: number): Promise<TransactionType[]> => {
  const start = startOfMonth(new Date(year, month - 1)); // month é 1-based, Date é 0-based
  const end = endOfMonth(new Date(year, month - 1));
  
  // Query simplificada para evitar erro de índice - remove o filtro userId redundante
  const q = query(
    collection(db, "users", userId, "transactions"),
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

// Função com listener em tempo real para transações do mês (otimizada)
export const subscribeToMonthlyTransactions = (
  userId: string, 
  year: number, 
  month: number, 
  callback: (transactions: TransactionType[]) => void
) => {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  
  // Query simplificada para evitar erro de índice
  const q = query(
    collection(db, "users", userId, "transactions"),
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

// Função para deletar todas as instâncias futuras de uma transação recorrente
export const deleteRecurringTransactionSeries = async (userId: string, originalTransaction: TransactionType) => {
  if (!originalTransaction.recurring) {
    throw new Error("Esta não é uma transação recorrente");
  }

  const originalDate = new Date(originalTransaction.date);
  const futureStartDate = new Date(originalDate);
  futureStartDate.setMonth(futureStartDate.getMonth() + 1);

  // Buscar todas as transações futuras similares
  const q = query(
    collection(db, "users", userId, "transactions"),
    where("description", "==", originalTransaction.description),
    where("category", "==", originalTransaction.category),
    where("amount", "==", originalTransaction.amount),
    where("recurring", "==", true),
    where("date", ">=", Timestamp.fromDate(futureStartDate))
  );

  const querySnapshot = await getDocs(q);
  
  // Deletar todas as instâncias futuras
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  console.log(`🗑️ ${querySnapshot.docs.length} transações recorrentes futuras deletadas`);
  return querySnapshot.docs.length;
};

// Função para buscar todas as instâncias de uma série de transações recorrentes
export const getRecurringTransactionSeries = async (userId: string, originalTransaction: TransactionType): Promise<TransactionType[]> => {
  if (!originalTransaction.recurring) {
    return [originalTransaction];
  }

  const q = query(
    collection(db, "users", userId, "transactions"),
    where("description", "==", originalTransaction.description),
    where("category", "==", originalTransaction.category),
    where("amount", "==", originalTransaction.amount),
    where("recurring", "==", true),
    orderBy("date", "asc")
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
      date: data.date.toDate(),
      status: data.status,
      recurring: data.recurring,
      userId: data.userId,
      createdAt: data.createdAt.toDate(),
    };
  }) as TransactionType[];
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