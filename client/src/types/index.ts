export interface TransactionType {
  id: string;
  type: "income" | "expense";
  amount: number | null; // null para transações variáveis sem valor definido
  category: string;
  description: string;
  source?: string;
  date: Date;
  status: "paid" | "pending";
  recurring: boolean;
  recurringType?: "fixed" | "variable";
  userId: string;
  createdAt: Date;
  // Campos específicos para recorrência
  originalDate?: Date; // data original da primeira transação
  monthRef: string; // formato YYYY-MM para filtros por mês
  isGenerated?: boolean; // true se foi gerada automaticamente
  originalId?: string; // ID da transação original que gerou esta
}

export interface CategoryType {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  userId: string;
  createdAt: Date;
}

export interface ProjectionType {
  id: string;
  month: string; // Format: YYYY-MM
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  userId: string;
  createdAt: Date;
}

export interface UserSettingsType {
  id: string;
  userId: string;
  reminderTime: string;
  billReminders: boolean;
  monthlyReport: boolean;
  theme: "light" | "dark";
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
