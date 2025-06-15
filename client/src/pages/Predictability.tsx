import { useState, useEffect, useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { TransactionType } from "../types";

const PERIOD_OPTIONS = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "60", label: "60 meses" },
  { value: "120", label: "120 meses (10 anos)" },
];

interface ProjectionData {
  month: string;
  monthKey: string;
  income: number;
  expenses: number;
  monthlyBalance: number;
  accumulatedBalance: number;
}

interface VariableTransaction {
  transaction: TransactionType;
  missingValue: boolean;
  baseValue: number;
}

export default function Predictability() {
  const { transactions, isLoading } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState("6");
  const [variableTransactions, setVariableTransactions] = useState<VariableTransaction[]>([]);

  // Get current balance from all paid transactions
  const currentBalance = useMemo(() => {
    return transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0));
      }, 0);
  }, [transactions]);

  // Identify variable recurring transactions that need values
  useEffect(() => {
    const variableRecurring = transactions.filter(t => 
      t.recurring && t.isVariableAmount
    );

    const variableData = variableRecurring.map(transaction => ({
      transaction,
      missingValue: !transaction.amount || transaction.amount === 0,
      baseValue: transaction.amount || 0
    }));

    setVariableTransactions(variableData);
  }, [transactions]);

  // Check if we can calculate projections
  const canCalculateProjections = useMemo(() => {
    // Now that we fixed the generation logic, we can always calculate projections
    // as variable transactions will always have their original amount value
    return true;
  }, []);

  // Generate projection data
  const projectionData = useMemo(() => {
    if (!canCalculateProjections) return [];

    const months = parseInt(selectedPeriod);
    const projections: ProjectionData[] = [];
    const currentDate = new Date();
    let accumulatedBalance = currentBalance;

    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
      const monthKey = `${projectionDate.getFullYear()}-${projectionDate.getMonth()}`;
      const monthLabel = projectionDate.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: i < 12 ? undefined : '2-digit' 
      });

      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      // Calculate projections based on recurring transactions
      transactions.forEach(transaction => {
        if (!transaction.recurring) return;

        // Check if this recurring transaction applies to this month
        const transactionDate = new Date(transaction.date);
        const isInRange = projectionDate >= transactionDate;

        if (!isInRange) return;

        // For fixed recurring transactions, check if it's still active
        if (transaction.recurringType === 'fixed' && transaction.recurringEndDate) {
          const endDate = new Date(transaction.recurringEndDate);
          if (projectionDate > endDate) return;
        }

        const amount = transaction.amount || 0;
        if (transaction.type === 'income') {
          monthlyIncome += amount;
        } else {
          monthlyExpenses += amount;
        }
      });

      const monthlyBalance = monthlyIncome - monthlyExpenses;
      // Only accumulate the net balance (what's left over), not the total income/expenses
      accumulatedBalance += monthlyBalance;

      projections.push({
        month: monthLabel,
        monthKey,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        monthlyBalance,
        accumulatedBalance
      });
    }

    return projections;
  }, [transactions, selectedPeriod, currentBalance, canCalculateProjections]);

  // Calculate comprehensive financial analysis
  const financialAnalysis = useMemo(() => {
    if (projectionData.length === 0) return null;

    const totalIncome = projectionData.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projectionData.reduce((sum, p) => sum + p.expenses, 0);
    const finalBalance = projectionData[projectionData.length - 1]?.accumulatedBalance || 0;
    const avgMonthlyBalance = projectionData.reduce((sum, p) => sum + p.monthlyBalance, 0) / projectionData.length;

    // Analyze income sources
    const incomeBySource = new Map<string, number>();
    const expensesByCategory = new Map<string, number>();
    const recurringIncome: number[] = [];
    const recurringExpenses: number[] = [];
    const fixedExpenses: number[] = [];

    transactions.forEach(t => {
      if (t.recurring && t.amount) {
        if (t.type === 'income') {
          const source = t.source || 'Não informado';
          incomeBySource.set(source, (incomeBySource.get(source) || 0) + (t.amount * parseInt(selectedPeriod)));
          recurringIncome.push(t.amount);
        } else {
          expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + (t.amount * parseInt(selectedPeriod)));
          if (t.isVariableAmount) {
            recurringExpenses.push(t.amount);
          } else {
            fixedExpenses.push(t.amount);
          }
        }
      }
    });

    // Calculate investment scenarios
    const investmentScenarios = [10, 20, 30, 50].map(percentage => {
      const investmentAmount = (finalBalance * percentage) / 100;
      const remainingBalance = finalBalance - investmentAmount;
      return {
        percentage,
        investmentAmount,
        remainingBalance,
        potentialReturn6Months: investmentAmount * 1.06, // 6% return assumption
        potentialReturn12Months: investmentAmount * 1.12, // 12% return assumption
      };
    });

    return {
      totalIncome,
      totalExpenses,
      finalBalance,
      avgMonthlyBalance,
      projectedMonths: projectionData.length,
      incomeBySource: Array.from(incomeBySource.entries()).sort((a, b) => b[1] - a[1]),
      expensesByCategory: Array.from(expensesByCategory.entries()).sort((a, b) => b[1] - a[1]),
      recurringIncomeTotal: recurringIncome.reduce((sum, amount) => sum + amount, 0) * parseInt(selectedPeriod),
      recurringExpensesTotal: recurringExpenses.reduce((sum, amount) => sum + amount, 0) * parseInt(selectedPeriod),
      fixedExpensesTotal: fixedExpenses.reduce((sum, amount) => sum + amount, 0) * parseInt(selectedPeriod),
      investmentScenarios,
      topIncomeSource: incomeBySource.size > 0 ? Array.from(incomeBySource.entries())[0] : null,
      topExpenseCategory: expensesByCategory.size > 0 ? Array.from(expensesByCategory.entries())[0] : null,
    };
  }, [projectionData, transactions, selectedPeriod]);

  // Generate evolution data for income sources
  const incomeEvolutionData = useMemo(() => {
    const months = parseInt(selectedPeriod);
    const currentDate = new Date();
    const data = [];

    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
      const monthLabel = projectionDate.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: i < 12 ? undefined : '2-digit' 
      });

      const monthData: any = { month: monthLabel };
      const sources = new Set(transactions.filter(t => t.recurring && t.type === 'income').map(t => t.source || 'Não informado'));

      sources.forEach(source => {
        const sourceIncome = transactions
          .filter(t => t.recurring && t.type === 'income' && (t.source || 'Não informado') === source)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        monthData[source] = sourceIncome;
      });

      data.push(monthData);
    }

    return data;
  }, [transactions, selectedPeriod]);

  // Generate evolution data for expense categories
  const expenseEvolutionData = useMemo(() => {
    const months = parseInt(selectedPeriod);
    const currentDate = new Date();
    const data = [];

    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
      const monthLabel = projectionDate.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: i < 12 ? undefined : '2-digit' 
      });

      const monthData: any = { month: monthLabel };
      const categories = new Set(transactions.filter(t => t.recurring && t.type === 'expense').map(t => t.category));

      categories.forEach(category => {
        const categoryExpense = transactions
          .filter(t => t.recurring && t.type === 'expense' && t.category === category)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        monthData[category] = categoryExpense;
      });

      data.push(monthData);
    }

    return data;
  }, [transactions, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-calendar-alt text-blue-600"></i>
              Período de Projeção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.value)}
                  className="transition-all duration-200"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Variable Transactions Warning */}
      {variableTransactions.some(vt => vt.missingValue) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Alert className="border-orange-200 bg-orange-50">
            <i className="fas fa-exclamation-triangle text-orange-600"></i>
            <AlertDescription className="ml-2">
              <strong>Atenção:</strong> Algumas transações recorrentes variáveis precisam de valores definidos para calcular as projeções.
              <div className="mt-2 space-y-1">
                {variableTransactions
                  .filter(vt => vt.missingValue)
                  .map(vt => (
                    <div key={vt.transaction.id} className="text-sm text-orange-700">
                      • {vt.transaction.description} - Defina um valor base
                    </div>
                  ))
                }
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Saldo Atual</p>
              <p className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {canCalculateProjections && financialAnalysis && (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-arrow-up text-green-600"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Receita Total Projetada</p>
                    <p className="text-lg font-bold text-green-600">
                      R$ {financialAnalysis.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-arrow-down text-red-600"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Despesa Total Projetada</p>
                    <p className="text-lg font-bold text-red-600">
                      R$ {financialAnalysis.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-chart-line text-blue-600"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Saldo Final Projetado</p>
                    <p className={`text-lg font-bold ${financialAnalysis.finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {financialAnalysis.finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-credit-card text-orange-600"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Média de Despesa Mensal</p>
                    <p className="text-lg font-bold text-orange-600">
                      R$ {(financialAnalysis.totalExpenses / parseInt(selectedPeriod)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-calculator text-purple-600"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Média de Saldo Mensal</p>
                    <p className={`text-lg font-bold ${financialAnalysis.avgMonthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {financialAnalysis.avgMonthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Financial Intelligence Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Top Income Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <i className="fas fa-trophy text-yellow-600"></i>
                  Maiores Receitas por Fonte
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialAnalysis.incomeBySource.length > 0 ? (
                  <div className="space-y-3">
                    {financialAnalysis.incomeBySource.slice(0, 5).map(([source, amount], index) => (
                      <div key={source} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold text-sm">#{index + 1}</span>
                          </div>
                          <span className="font-medium text-green-800">{source}</span>
                        </div>
                        <span className="font-bold text-green-600">
                          R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Nenhuma receita recorrente encontrada</p>
                )}
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <i className="fas fa-exclamation-triangle text-red-600"></i>
                  Maiores Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialAnalysis.expensesByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {financialAnalysis.expensesByCategory.slice(0, 5).map(([category, amount], index) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-red-600 font-bold text-sm">#{index + 1}</span>
                          </div>
                          <span className="font-medium text-red-800">{category}</span>
                        </div>
                        <span className="font-bold text-red-600">
                          R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Nenhuma despesa recorrente encontrada</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Investment Scenarios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-pie text-purple-600"></i>
                  Cenários de Investimento do Saldo Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {financialAnalysis.investmentScenarios.map((scenario) => (
                    <div key={scenario.percentage} className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="text-center mb-3">
                        <div className="text-lg font-bold text-purple-600">{scenario.percentage}%</div>
                        <div className="text-xs text-gray-600">do saldo final</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investir:</span>
                          <span className="font-medium">R$ {scenario.investmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Restante:</span>
                          <span className="font-medium">R$ {scenario.remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">6 meses (6%):</span>
                            <span className="font-bold text-green-600">R$ {scenario.potentialReturn6Months.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">12 meses (12%):</span>
                            <span className="font-bold text-green-600">R$ {scenario.potentialReturn12Months.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Income Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-line text-green-600"></i>
                  Evolução de Receitas por Fonte ({selectedPeriod} meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={incomeEvolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend />
                      {financialAnalysis.incomeBySource.slice(0, 5).map(([source], index) => (
                        <Line
                          key={source}
                          type="monotone"
                          dataKey={source}
                          stroke={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expense Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-line text-red-600"></i>
                  Evolução de Despesas por Categoria ({selectedPeriod} meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expenseEvolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Despesa']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend />
                      {financialAnalysis.expensesByCategory.slice(0, 5).map(([category], index) => (
                        <Line
                          key={category}
                          type="monotone"
                          dataKey={category}
                          stroke={['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'][index]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Accumulated Balance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-area text-blue-600"></i>
                  Evolução do Saldo Acumulado ({selectedPeriod} meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={projectionData.length > 12 ? -45 : 0}
                        textAnchor={projectionData.length > 12 ? "end" : "middle"}
                        height={projectionData.length > 12 ? 60 : 30}
                      />
                      <YAxis 
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as ProjectionData;
                            return (
                              <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-semibold text-gray-900 mb-2">{label}</p>
                                <div className="space-y-1">
                                  <p className="text-sm text-green-600">
                                    Receitas: R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm text-red-600">
                                    Despesas: R$ {data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    Saldo do Mês: R$ {data.monthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm font-semibold text-blue-600">
                                    Saldo Acumulado: R$ {data.accumulatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accumulatedBalance" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        name="Saldo Acumulado"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Projection Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-table text-green-600"></i>
                  Tabela de Projeção Detalhada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Mês</th>
                        <th className="text-right py-3 px-2 font-semibold text-green-600">Receita Total</th>
                        <th className="text-right py-3 px-2 font-semibold text-red-600">Despesa Total</th>
                        <th className="text-right py-3 px-2 font-semibold text-gray-700">Saldo do Mês</th>
                        <th className="text-right py-3 px-2 font-semibold text-blue-600">Saldo Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectionData.map((row, index) => (
                        <tr key={row.monthKey} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="py-3 px-2 font-medium">{row.month}</td>
                          <td className="py-3 px-2 text-right text-green-600">
                            R$ {row.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-red-600">
                            R$ {row.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-2 text-right font-medium ${row.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {row.monthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-2 text-right font-bold ${row.accumulatedBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            R$ {row.accumulatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {!canCalculateProjections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-12 text-center">
              <i className="fas fa-exclamation-triangle text-6xl text-orange-400 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Defina Valores para Calcular Projeções
              </h3>
              <p className="text-gray-600 mb-4">
                Para gerar previsões precisas, todas as transações recorrentes variáveis precisam ter valores definidos.
              </p>
              <p className="text-sm text-gray-500">
                Vá para a página de Transações e defina os valores das transações recorrentes variáveis.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}