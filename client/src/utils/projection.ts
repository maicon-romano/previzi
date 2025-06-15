import { TransactionType } from "../types";
import { SimulatedItem } from "../components/ScenarioSimulator";

export interface ProjectionData {
  month: string;
  monthKey: string;
  income: number;
  expenses: number;
  monthlyBalance: number;
  accumulatedBalance: number;
  isNegative?: boolean;
}

export interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  finalBalance: number;
  avgMonthlyBalance: number;
  incomeBySource: [string, number][];
  expensesByCategory: [string, number][];
  investmentScenarios: Array<{
    percentage: number;
    investmentAmount: number;
    remainingBalance: number;
    potentialReturn6Months: number;
    potentialReturn12Months: number;
  }>;
}

export interface HealthIndicators {
  savingsRate: number;
  commitment: number;
  cushionMonths: number;
  savingsRateColor: 'green' | 'yellow' | 'red';
  commitmentColor: 'green' | 'yellow' | 'red';
  cushionColor: 'green' | 'yellow' | 'red';
}

export interface Recommendation {
  icon: string;
  text: string;
  type: 'warning' | 'info' | 'success';
}

// Convert simulated items to transaction-like objects for the projection period
export function mapSimulatedItemsToTransactions(
  simulatedItems: SimulatedItem[], 
  periodMonths: number,
  currentBalance: number
): TransactionType[] {
  const transactions: TransactionType[] = [];
  const currentDate = new Date();
  
  simulatedItems.filter(item => item.enabled).forEach(item => {
    for (let monthOffset = 0; monthOffset < periodMonths; monthOffset++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 15);
      
      // Check if this month is within the scenario's active period
      if (projectionDate < item.start) continue;
      if (item.end && projectionDate > item.end) continue;
      
      transactions.push({
        id: `sim-${item.id}-${monthOffset}`,
        type: item.type,
        amount: item.amount,
        category: item.type === 'income' ? 'Simulação - Receita' : 'Simulação - Despesa',
        description: `[Simulado] ${item.description}`,
        source: item.type === 'income' ? 'Cenário Simulado' : '',
        date: projectionDate,
        status: 'pending',
        recurring: false,
        userId: 'simulated',
        createdAt: new Date()
      });
    }
  });
  
  return transactions;
}

// Build comprehensive projection data
export function buildProjection(
  periodMonths: number,
  baseTransactions: TransactionType[],
  simulatedTransactions: TransactionType[] = [],
  currentBalance: number = 0
): ProjectionData[] {
  const allTransactions = [...baseTransactions, ...simulatedTransactions];
  const currentDate = new Date();
  const projectionData: ProjectionData[] = [];
  let accumulatedBalance = currentBalance;

  for (let monthOffset = 0; monthOffset < periodMonths; monthOffset++) {
    const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const monthKey = `${projectionDate.getFullYear()}-${projectionDate.getMonth()}`;
    const monthName = projectionDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    // Filter transactions for this specific month
    const monthTransactions = allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === projectionDate.getFullYear() && 
             transactionDate.getMonth() === projectionDate.getMonth();
    });

    const income = monthTransactions
      .filter(t => t.type === 'income' && t.amount !== null)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense' && t.amount !== null)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyBalance = income - expenses;
    accumulatedBalance += monthlyBalance;

    projectionData.push({
      month: monthName,
      monthKey,
      income,
      expenses,
      monthlyBalance,
      accumulatedBalance,
      isNegative: accumulatedBalance < 0
    });
  }

  return projectionData;
}

// Calculate comprehensive financial analysis
export function calculateFinancialAnalysis(
  projectionData: ProjectionData[],
  allTransactions: TransactionType[]
): FinancialAnalysis {
  const totalIncome = projectionData.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = projectionData.reduce((sum, month) => sum + month.expenses, 0);
  const finalBalance = projectionData[projectionData.length - 1]?.accumulatedBalance || 0;
  const avgMonthlyBalance = projectionData.reduce((sum, month) => sum + month.monthlyBalance, 0) / projectionData.length;

  // Income by source analysis
  const incomeBySource = new Map<string, number>();
  allTransactions
    .filter(t => t.type === 'income' && t.amount !== null)
    .forEach(transaction => {
      const source = transaction.source || 'Não informado';
      incomeBySource.set(source, (incomeBySource.get(source) || 0) + (transaction.amount || 0));
    });

  // Expenses by category analysis
  const expensesByCategory = new Map<string, number>();
  allTransactions
    .filter(t => t.type === 'expense' && t.amount !== null)
    .forEach(transaction => {
      const category = transaction.category;
      expensesByCategory.set(category, (expensesByCategory.get(category) || 0) + (transaction.amount || 0));
    });

  // Investment scenarios
  const investmentScenarios = [10, 20, 30, 50].map(percentage => {
    const investmentAmount = (finalBalance * percentage) / 100;
    const remainingBalance = finalBalance - investmentAmount;
    
    return {
      percentage,
      investmentAmount,
      remainingBalance,
      potentialReturn6Months: investmentAmount * 0.06,
      potentialReturn12Months: investmentAmount * 0.12
    };
  });

  return {
    totalIncome,
    totalExpenses,
    finalBalance,
    avgMonthlyBalance,
    incomeBySource: Array.from(incomeBySource.entries()).sort((a, b) => b[1] - a[1]),
    expensesByCategory: Array.from(expensesByCategory.entries()).sort((a, b) => b[1] - a[1]),
    investmentScenarios
  };
}

// Calculate financial health indicators
export function calculateHealthIndicators(
  analysis: FinancialAnalysis,
  periodMonths: number
): HealthIndicators {
  const avgMonthlyIncome = analysis.totalIncome / periodMonths;
  const avgMonthlyExpenses = analysis.totalExpenses / periodMonths;
  
  // Savings Rate = (Income - Expenses) / Income
  const savingsRate = avgMonthlyIncome > 0 
    ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome) * 100 
    : 0;
  
  // Commitment Rate (assuming 30% of expenses are fixed debts - simplified calculation)
  const commitment = avgMonthlyIncome > 0 
    ? (avgMonthlyExpenses * 0.3 / avgMonthlyIncome) * 100 
    : 0;
  
  // Cushion Months = Final Balance / Average Monthly Expenses
  const cushionMonths = avgMonthlyExpenses > 0 
    ? analysis.finalBalance / avgMonthlyExpenses 
    : 0;

  // Color coding based on financial health thresholds
  const savingsRateColor: 'green' | 'yellow' | 'red' = 
    savingsRate < 0 ? 'red' : savingsRate < 20 ? 'yellow' : 'green';
  
  const commitmentColor: 'green' | 'yellow' | 'red' = 
    commitment > 40 ? 'red' : commitment > 30 ? 'yellow' : 'green';
  
  const cushionColor: 'green' | 'yellow' | 'red' = 
    cushionMonths < 3 ? 'red' : cushionMonths < 6 ? 'yellow' : 'green';

  return {
    savingsRate,
    commitment,
    cushionMonths,
    savingsRateColor,
    commitmentColor,
    cushionColor
  };
}

// Generate financial recommendations
export function generateRecommendations(
  projectionData: ProjectionData[],
  healthIndicators: HealthIndicators,
  analysis: FinancialAnalysis
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Check for negative balance months
  const negativeMonths = projectionData.filter(month => month.accumulatedBalance < 0);
  if (negativeMonths.length > 0) {
    const firstNegativeMonth = negativeMonths[0];
    recommendations.push({
      icon: '⚠️',
      text: `Saldo ficará negativo em ${firstNegativeMonth.month}. Considere reduzir despesas em R$ ${Math.abs(firstNegativeMonth.accumulatedBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ou aumentar receitas.`,
      type: 'warning'
    });
  }
  
  // Savings rate recommendations
  if (healthIndicators.savingsRate < 20) {
    recommendations.push({
      icon: '💰',
      text: `Taxa de poupança baixa (${healthIndicators.savingsRate.toFixed(1)}%). Tente economizar pelo menos 20% da renda.`,
      type: 'warning'
    });
  }
  
  // Emergency fund recommendations
  if (healthIndicators.cushionMonths < 6) {
    const neededAmount = (6 - healthIndicators.cushionMonths) * (analysis.totalExpenses / projectionData.length);
    recommendations.push({
      icon: '🛡️',
      text: `Reserva de emergência insuficiente. Considere economizar mais R$ ${neededAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para 6 meses de despesas.`,
      type: 'info'
    });
  }
  
  // Positive scenarios
  if (analysis.finalBalance > 0 && healthIndicators.savingsRate > 20) {
    recommendations.push({
      icon: '🎯',
      text: `Excelente planejamento financeiro! Considere investir parte do saldo final para maior rentabilidade.`,
      type: 'success'
    });
  }
  
  return recommendations;
}