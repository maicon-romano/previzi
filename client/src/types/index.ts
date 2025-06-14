export interface TransactionType {
  id: string;
  type: "income" | "expense";
  amount: number | null;
  category: string;
  description: string;
  source: string;
  date: Date;
  status: "paid" | "pending";
  recurring: boolean;
  isVariableAmount?: boolean; // Para transações recorrentes com valor variável
  recurringType?: "infinite" | "fixed"; // Tipo de recorrência
  recurringMonths?: number; // Quantidade de meses para recorrência fixa
  recurringEndDate?: string; // Data de término para recorrência fixa
  userId: string;
  createdAt: Date;
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
