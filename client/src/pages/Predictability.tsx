import { useTransactions } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Predictability() {
  const { transactions, isLoading } = useTransactions();

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

  // Calculate monthly averages from existing transactions
  const monthlyData = new Map();
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expenses: 0 });
    }
    
    const monthData = monthlyData.get(monthKey);
    if (transaction.type === 'income') {
      monthData.income += transaction.amount;
    } else {
      monthData.expenses += transaction.amount;
    }
  });

  // Calculate averages
  const avgIncome = Array.from(monthlyData.values()).reduce((sum, data) => sum + data.income, 0) / Math.max(monthlyData.size, 1);
  const avgExpenses = Array.from(monthlyData.values()).reduce((sum, data) => sum + data.expenses, 0) / Math.max(monthlyData.size, 1);

  // Generate future projections (next 6 months)
  const projections = [];
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentDate = new Date();
  
  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = `${monthNames[futureDate.getMonth()]} ${futureDate.getFullYear()}`;
    
    // Add some variation to make projections more realistic
    const incomeVariation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
    const expenseVariation = 1 + (Math.random() - 0.5) * 0.15; // ±7.5% variation
    
    const projectedIncome = avgIncome * incomeVariation;
    const projectedExpenses = avgExpenses * expenseVariation;
    const projectedBalance = projectedIncome - projectedExpenses;
    
    projections.push({
      month: monthName,
      income: projectedIncome,
      expenses: projectedExpenses,
      balance: projectedBalance,
      isNegative: projectedBalance < 0,
    });
  }

  // Chart data for balance projection
  const chartData = projections.map((projection, index) => ({
    month: projection.month.split(' ')[0].substring(0, 3),
    balance: projection.balance,
  }));

  return (
    <div className="space-y-6">
      {/* Monthly Projections */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle>Projeções Mensais</CardTitle>
            <Select defaultValue="6months">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Próximos 6 meses</SelectItem>
                <SelectItem value="12months">Próximos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {projections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projections.map((projection, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    projection.isNegative 
                      ? 'bg-red-50 border-danger-200' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{projection.month}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      projection.isNegative 
                        ? 'bg-red-100 text-red-600' 
                        : 'text-gray-500'
                    }`}>
                      {projection.isNegative ? 'Atenção' : 'Previsto'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Receitas</span>
                      <span className="font-medium text-success-500">
                        +R$ {projection.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Despesas</span>
                      <span className="font-medium text-danger-500">
                        -R$ {projection.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Saldo</span>
                      <span className={`font-bold ${
                        projection.balance >= 0 ? 'text-success-500' : 'text-danger-500'
                      }`}>
                        {projection.balance >= 0 ? '+' : ''}R$ {projection.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-crystal-ball text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dados insuficientes</h3>
              <p>Adicione mais transações para gerar projeções precisas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Saldo Previsto</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Saldo Previsto'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="fas fa-chart-line text-4xl mb-2"></i>
                <p>Gráfico de projeção não disponível</p>
                <p className="text-sm">Adicione transações para visualizar projeções</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Insights */}
      {projections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights Financeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Tendências Identificadas</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                    <span>Receita média mensal: R$ {avgIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                    <span>Despesa média mensal: R$ {avgExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className={`fas fa-info-circle mr-2 ${
                      (avgIncome - avgExpenses) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}></i>
                    <span>Saldo médio mensal: R$ {(avgIncome - avgExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Recomendações</h4>
                <div className="space-y-2">
                  {projections.some(p => p.isNegative) ? (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-exclamation-triangle text-red-500 mr-2 mt-0.5"></i>
                      <span>Atenção: Saldo negativo previsto em alguns meses. Considere reduzir despesas ou aumentar receitas.</span>
                    </div>
                  ) : (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                      <span>Parabéns! Suas projeções indicam saldos positivos nos próximos meses.</span>
                    </div>
                  )}
                  <div className="flex items-start text-sm">
                    <i className="fas fa-lightbulb text-yellow-500 mr-2 mt-0.5"></i>
                    <span>Dica: Mantenha uma reserva de emergência equivalente a 3-6 meses de despesas.</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
