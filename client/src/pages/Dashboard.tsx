import { useState } from "react";
import { Link } from "wouter";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import MonthYearPicker from "../components/MonthYearPicker";

export default function Dashboard() {
  const { transactions, isLoading, error } = useTransactions();
  const [chartPeriod, setChartPeriod] = useState("6");
  
  // Add month filter state - defaults to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Helper function to get month name in Portuguese
  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Helper function to navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const currentDate = new Date(year, month - 1, 1);
    
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600">Não foi possível carregar as informações financeiras.</p>
        </div>
      </div>
    );
  }

  // Calculate summary data for selected month
  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === (selectedMonthNum - 1) && transactionDate.getFullYear() === selectedYear;
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === "income" && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === "expense" && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const currentBalance = totalIncome - totalExpenses;

  // Enhanced chart data preparation
  const categoryData = currentMonthTransactions
    .filter(t => t.type === "expense" && t.amount !== null)
    .reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + (transaction.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryData)
    .map(([category, amount]) => {
      const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
      return {
        name: category,
        value: amount,
        percentage: percentage.toFixed(1),
      };
    })
    .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage)); // Sort by percentage (highest to lowest)

  const COLORS = ['#3B82F6', '#EF4444', '#F97316', '#EAB308', '#10B981', '#8B5CF6', '#EC4899'];

  // Enhanced evolution chart data with income sources
  const getEvolutionData = () => {
    const months = parseInt(chartPeriod);
    const monthlyData = new Map();
    const currentDate = new Date();
    
    // Initialize months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      monthlyData.set(monthKey, {
        month: monthName,
        income: 0,
        expenses: 0,
        balance: 0,
        sources: new Map(),
      });
    }

    // Populate with actual data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey);
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
          
          // Track income sources
          const source = transaction.source || 'Não informado';
          if (!monthData.sources.has(source)) {
            monthData.sources.set(source, 0);
          }
          monthData.sources.set(source, monthData.sources.get(source) + transaction.amount);
        } else {
          monthData.expenses += transaction.amount;
        }
        monthData.balance = monthData.income - monthData.expenses;
      }
    });

    return Array.from(monthlyData.values()).map(month => ({
      ...month,
      sources: Object.fromEntries(month.sources),
    }));
  };

  // Get income sources breakdown for current month
  const getIncomeSourcesBreakdown = () => {
    const currentMonthIncome = currentMonthTransactions.filter(t => t.type === 'income');
    const sourcesMap = new Map();
    
    currentMonthIncome.forEach(transaction => {
      const source = transaction.source || 'Não informado';
      if (!sourcesMap.has(source)) {
        sourcesMap.set(source, 0);
      }
      sourcesMap.set(source, sourcesMap.get(source) + transaction.amount);
    });

    return Array.from(sourcesMap.entries())
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const evolutionData = getEvolutionData();
  const incomeSourcesBreakdown = getIncomeSourcesBreakdown();

  // Recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Upcoming payments - only unpaid expenses (despesas)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingPayments = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return t.type === "expense" && t.status === "pending" && transactionDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map(t => {
      const daysUntil = Math.ceil((new Date(t.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...t,
        daysUntil,
        dueDate: daysUntil === 0 ? "Hoje" : daysUntil === 1 ? "Amanhã" : `${daysUntil} dias`,
      };
    });

  return (
    <div className="space-y-8">
      {/* Month Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="flex items-center space-x-2 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-blue-600" />
                <MonthYearPicker 
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="flex items-center space-x-2 hover:bg-blue-50"
              >
                <span>Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Saldo Atual</p>
                  <p className={`text-xl font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-blue-600 text-sm"></i>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  currentBalance >= 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {currentBalance >= 0 ? 'Positivo' : 'Negativo'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Receitas do Mês</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-up text-green-600 text-sm"></i>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs text-gray-500">
                  {currentMonthTransactions.filter(t => t.type === 'income').length} transações
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Despesas do Mês</p>
                  <p className="text-xl font-bold text-red-600">
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-down text-red-600 text-sm"></i>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs text-gray-500">
                  {currentMonthTransactions.filter(t => t.type === 'expense').length} transações
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Category Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <i className="fas fa-chart-pie text-blue-600 text-sm"></i>
                Distribuição por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="space-y-6">
                  {/* Larger chart container */}
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ percentage }) => `${percentage}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700">
                                      Valor: R$ {Number(data.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm font-medium text-gray-700">
                                      Percentual: {data.percentage}%
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Enhanced legend with values and percentages */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm">Detalhamento por Categoria</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {pieChartData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="text-gray-700 font-medium text-sm">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-800 text-sm">
                              R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500">{item.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-pie text-4xl mb-2"></i>
                    <p>Nenhuma despesa encontrada para o mês atual</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Evolution Chart with Income Sources */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <i className="fas fa-chart-line text-green-600 text-sm"></i>
                  Evolução das Receitas por Fonte
                </CardTitle>
                <Select value={chartPeriod} onValueChange={setChartPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="18">18 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {evolutionData.length > 0 ? (
                <div className="space-y-6">
                  {/* Larger Chart */}
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 14 }}
                          stroke="#6B7280"
                        />
                        <YAxis 
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 14 }}
                          stroke="#6B7280"
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const sources = data.sources || {};
                              return (
                                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-semibold text-gray-900 mb-3">{label}</p>
                                  <div className="space-y-2">
                                    <p className="text-green-600 font-bold text-base">
                                      Total: R$ {Number(data.income).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    {Object.entries(sources).length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Fontes:</p>
                                        {Object.entries(sources).map(([source, amount]) => (
                                          <div key={source} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{source}:</span>
                                            <span className="font-medium">R$ {Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="#10B981" 
                          strokeWidth={4}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                          name="Receitas"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                          name="Saldo"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Income Sources Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <i className="fas fa-users text-sm"></i>
                      Fontes do Mês Atual
                    </h4>
                    {incomeSourcesBreakdown.length > 0 ? (
                      <div className="space-y-2">
                        {incomeSourcesBreakdown.map((item, index) => (
                          <div key={item.source} className="bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{item.source}</span>
                              <span className="text-xs text-gray-500">{item.percentage}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-green-600">
                                R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <i className="fas fa-info-circle text-lg mb-2"></i>
                        <p className="text-xs">Nenhuma fonte de receita registrada</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="chart-container flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-line text-4xl mb-2"></i>
                    <p>Dados históricos não disponíveis</p>
                    <p className="text-sm">Adicione mais transações para ver a evolução</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions and Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <i className="fas fa-receipt text-purple-600 text-sm"></i>
                  Transações Recentes
                </CardTitle>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    <i className="fas fa-arrow-right mr-1"></i>
                    Ver todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <motion.div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <i className={`fas ${
                            transaction.type === 'income' ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'
                          }`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              transaction.status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-receipt text-4xl mb-4 text-gray-300"></i>
                  <p className="font-medium">Nenhuma transação encontrada</p>
                  <p className="text-sm">Adicione sua primeira transação</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Payments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <i className="fas fa-clock text-orange-600 text-sm"></i>
                Próximos Vencimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingPayments.map((payment) => (
                    <motion.div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                          payment.daysUntil === 0 
                            ? 'bg-red-100' 
                            : payment.daysUntil <= 3 
                              ? 'bg-orange-100' 
                              : 'bg-blue-100'
                        }`}>
                          <i className={`fas fa-clock ${
                            payment.daysUntil === 0 
                              ? 'text-red-600' 
                              : payment.daysUntil <= 3 
                                ? 'text-orange-600' 
                                : 'text-blue-600'
                          }`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Vence em</span>
                            <span className={`font-medium ${
                              payment.daysUntil === 0 
                                ? 'text-red-600' 
                                : payment.daysUntil <= 3 
                                  ? 'text-orange-600' 
                                  : 'text-blue-600'
                            }`}>
                              {payment.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-red-600">
                          R$ {(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-xs text-gray-500">{payment.category}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-check-circle text-4xl mb-4 text-green-300"></i>
                  <p className="font-medium">Nenhum vencimento próximo</p>
                  <p className="text-sm">Suas contas estão em dia!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
