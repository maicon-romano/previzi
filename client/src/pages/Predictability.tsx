import { useState, useEffect, useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";
import { TransactionType } from "../types";
import ScenarioSimulator, { SimulatedItem } from "../components/ScenarioSimulator";
import { 
  buildProjection, 
  calculateFinancialAnalysis, 
  calculateHealthIndicators, 
  generateRecommendations,
  mapSimulatedItemsToTransactions,
  type ProjectionData,
  type FinancialAnalysis,
  type HealthIndicators,
  type Recommendation
} from "../utils/projection";

const PERIOD_OPTIONS = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "1 ano" },
  { value: "24", label: "2 anos" },
  { value: "36", label: "3 anos" },
  { value: "60", label: "5 anos" },
  { value: "120", label: "10 anos" },
];

interface VariableTransaction {
  transaction: TransactionType;
  missingValue: boolean;
  baseValue: number;
}

export default function Predictability() {
  const { transactions, isLoading } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState("6");
  const [variableTransactions, setVariableTransactions] = useState<VariableTransaction[]>([]);
  const [simulatedItems, setSimulatedItems] = useState<SimulatedItem[]>([]);

  // Get current balance from all paid transactions
  const currentBalance = useMemo(() => {
    return transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0));
      }, 0);
  }, [transactions]);

  // Check for variable recurring transactions that need values defined
  useEffect(() => {
    const variableRecurringTransactions = transactions.filter(
      t => t.recurring && t.isVariableAmount
    );

    const variableTransactionData = variableRecurringTransactions.map(transaction => ({
      transaction,
      missingValue: !transaction.amount || transaction.amount === 0,
      baseValue: transaction.amount || 0
    }));

    setVariableTransactions(variableTransactionData);
  }, [transactions]);

  // Check if we can calculate projections
  const canCalculateProjections = useMemo(() => {
    return true; // Variable transactions now have their original amount value
  }, []);

  // Calculate comprehensive projections with scenario simulation
  const { 
    projectionData, 
    financialAnalysis, 
    healthIndicators, 
    recommendations,
    incomeEvolutionData, 
    expenseEvolutionData,
    hasActiveScenarios 
  } = useMemo(() => {
    if (!canCalculateProjections) {
      return {
        projectionData: [],
        financialAnalysis: null,
        healthIndicators: null,
        recommendations: [],
        incomeEvolutionData: [],
        expenseEvolutionData: [],
        hasActiveScenarios: false
      };
    }

    const periodMonths = parseInt(selectedPeriod);
    const activeScenarios = simulatedItems.filter(s => s.enabled);
    const hasActiveScenarios = activeScenarios.length > 0;

    // Map simulated items to transactions
    const simulatedTransactions = mapSimulatedItemsToTransactions(
      simulatedItems, 
      periodMonths, 
      currentBalance
    );

    // Build projection using new utility functions
    const projections = buildProjection(
      periodMonths,
      transactions,
      simulatedTransactions,
      currentBalance
    );

    // Calculate comprehensive financial analysis
    const allTransactions = [...transactions, ...simulatedTransactions];
    const analysis = calculateFinancialAnalysis(projections, allTransactions);
    
    // Calculate health indicators
    const health = calculateHealthIndicators(analysis, periodMonths);
    
    // Generate recommendations
    const recs = generateRecommendations(projections, health, analysis);

    // Prepare evolution data for charts
    const incomeEvolution = projections.map(month => {
      const monthData: any = { month: month.month };
      
      // Add income by source for this month
      analysis.incomeBySource.slice(0, 5).forEach(([source]) => {
        const sourceTransactions = allTransactions.filter(t => 
          t.type === 'income' && 
          t.source === source &&
          new Date(t.date).getMonth() === new Date().getMonth() + projections.indexOf(month)
        );
        monthData[source] = sourceTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      });
      
      return monthData;
    });

    const expenseEvolution = projections.map(month => {
      const monthData: any = { month: month.month };
      
      // Add expenses by category for this month
      analysis.expensesByCategory.slice(0, 5).forEach(([category]) => {
        const categoryTransactions = allTransactions.filter(t => 
          t.type === 'expense' && 
          t.category === category &&
          new Date(t.date).getMonth() === new Date().getMonth() + projections.indexOf(month)
        );
        monthData[category] = categoryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      });
      
      return monthData;
    });

    return {
      projectionData: projections,
      financialAnalysis: analysis,
      healthIndicators: health,
      recommendations: recs,
      incomeEvolutionData: incomeEvolution,
      expenseEvolutionData: expenseEvolution,
      hasActiveScenarios
    };
  }, [canCalculateProjections, selectedPeriod, transactions, simulatedItems, currentBalance]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando dados</h3>
            <p className="text-gray-600">Aguarde enquanto calculamos suas projeções financeiras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selection and Scenario Simulator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-line text-blue-600"></i>
                  Previsibilidade Financeira
                  {hasActiveScenarios && (
                    <Badge variant="secondary" className="ml-2">
                      Simulado
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Projeções e cenários para sua estabilidade financeira
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ScenarioSimulator 
                  scenarios={simulatedItems}
                  onScenariosChange={setSimulatedItems}
                />
              </div>
            </div>
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

      {/* Variable Transaction Warning */}
      {variableTransactions.some(vt => vt.missingValue) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Alert>
            <i className="fas fa-exclamation-triangle text-orange-500"></i>
            <AlertDescription>
              Algumas transações recorrentes variáveis não possuem valores definidos. 
              As projeções usarão os valores base disponíveis ou zero quando não especificado.
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
                    {hasActiveScenarios && <Badge variant="outline" className="text-xs mt-1">Simulado</Badge>}
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
                    {hasActiveScenarios && <Badge variant="outline" className="text-xs mt-1">Simulado</Badge>}
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
                    {hasActiveScenarios && <Badge variant="outline" className="text-xs mt-1">Simulado</Badge>}
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
                    {hasActiveScenarios && <Badge variant="outline" className="text-xs mt-1">Simulado</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Health Indicators */}
          {healthIndicators && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className={`border-2 ${
                healthIndicators.savingsRateColor === 'green' ? 'border-green-200 bg-green-50' :
                healthIndicators.savingsRateColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-sm mb-1">Taxa de Poupança</h4>
                    <p className={`text-2xl font-bold ${
                      healthIndicators.savingsRateColor === 'green' ? 'text-green-600' :
                      healthIndicators.savingsRateColor === 'yellow' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {healthIndicators.savingsRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {healthIndicators.savingsRate >= 20 ? 'Excelente' : 
                       healthIndicators.savingsRate >= 0 ? 'Atenção' : 'Crítico'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${
                healthIndicators.commitmentColor === 'green' ? 'border-green-200 bg-green-50' :
                healthIndicators.commitmentColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-sm mb-1">Comprometimento</h4>
                    <p className={`text-2xl font-bold ${
                      healthIndicators.commitmentColor === 'green' ? 'text-green-600' :
                      healthIndicators.commitmentColor === 'yellow' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {healthIndicators.commitment.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {healthIndicators.commitment <= 30 ? 'Saudável' : 
                       healthIndicators.commitment <= 40 ? 'Atenção' : 'Alto'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${
                healthIndicators.cushionColor === 'green' ? 'border-green-200 bg-green-50' :
                healthIndicators.cushionColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-sm mb-1">Meses de Fôlego</h4>
                    <p className={`text-2xl font-bold ${
                      healthIndicators.cushionColor === 'green' ? 'text-green-600' :
                      healthIndicators.cushionColor === 'yellow' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {healthIndicators.cushionMonths.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {healthIndicators.cushionMonths >= 6 ? 'Seguro' : 
                       healthIndicators.cushionMonths >= 3 ? 'Moderado' : 'Insuficiente'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-lightbulb text-yellow-500"></i>
                    Recomendações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <Alert key={index} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{rec.icon}</span>
                          <AlertDescription>{rec.text}</AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Accumulated Balance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-area text-blue-600"></i>
                  Evolução do Saldo Acumulado ({selectedPeriod} meses)
                  {hasActiveScenarios && <Badge variant="secondary" className="ml-2">Simulado</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo Acumulado']}
                        labelFormatter={(label) => `Mês: ${label}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                      />
                      <ReferenceLine y={0} stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                      <Area
                        type="monotone"
                        dataKey="accumulatedBalance"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fill="url(#balanceGradient)"
                      />
                      {projectionData.map((month, index) => 
                        month.isNegative ? (
                          <Area
                            key={index}
                            type="monotone"
                            dataKey="accumulatedBalance"
                            stroke="#EF4444"
                            strokeWidth={3}
                            fill="url(#negativeGradient)"
                          />
                        ) : null
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Investment Scenarios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Accordion type="single" collapsible>
              <AccordionItem value="investment-scenarios">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-chart-pie text-purple-600"></i>
                    Cenários de Investimento do Saldo Final
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>

          {/* Detailed Projection Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-table text-gray-600"></i>
                  Projeção Detalhada por Mês
                  {hasActiveScenarios && <Badge variant="secondary" className="ml-2">Simulado</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Mês</th>
                        <th className="text-right p-3 font-semibold text-green-600">Receitas</th>
                        <th className="text-right p-3 font-semibold text-red-600">Despesas</th>
                        <th className="text-right p-3 font-semibold text-blue-600">Saldo Mensal</th>
                        <th className="text-right p-3 font-semibold text-purple-600">Saldo Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectionData.map((row, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 ${row.isNegative ? 'bg-red-50' : ''}`}>
                          <td className="p-3 font-medium">
                            {row.month}
                            {row.isNegative && <span className="ml-2 text-red-500">⚠️</span>}
                          </td>
                          <td className="p-3 text-right text-green-600">
                            R$ {row.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-red-600">
                            R$ {row.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-medium ${row.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {row.monthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-bold ${row.accumulatedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
    </div>
  );
}