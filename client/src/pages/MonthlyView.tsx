import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactionsByMonth, updateTransaction, parseMonthString } from "../utils/firestore";
import type { TransactionType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Calendar, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import EditVariableTransactionModal from "../components/EditVariableTransactionModal";

export default function MonthlyView() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const getMonthName = (monthRef: string) => {
    const [year, month] = monthRef.split('-');
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonthRef = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthRef);
  };

  const loadTransactions = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const { year, month } = parseMonthString(selectedMonth);
      const monthTransactions = await getTransactionsByMonth(currentUser.uid, year, month);
      setTransactions(monthTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações do mês.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, currentUser]);

  const handleStatusToggle = async (transaction: TransactionType) => {
    if (!currentUser) return;

    try {
      const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
      await updateTransaction(currentUser.uid, transaction.id, { status: newStatus });
      
      setTransactions(prev => 
        prev.map(t => 
          t.id === transaction.id ? { ...t, status: newStatus } : t
        )
      );

      toast({
        title: "Status atualizado",
        description: `Transação marcada como ${newStatus === 'paid' ? 'paga' : 'pendente'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da transação.",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: TransactionType) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleTransactionUpdated = () => {
    loadTransactions();
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  if (!currentUser) {
    return <div>Faça login para visualizar suas transações.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Navegação por mês */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visualização Mensal
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-32 text-center">
                {getMonthName(selectedMonth)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo financeiro do mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações de {getMonthName(selectedMonth)}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma transação encontrada para este mês.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{transaction.description}</h3>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                      {transaction.recurring && (
                        <Badge variant="outline">
                          Recorrente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{transaction.category}</span>
                      <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                      {transaction.source && <span>• {transaction.source}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${
                      transaction.amount !== null 
                        ? (transaction.type === 'income' ? 'text-green-600' : 'text-red-600')
                        : 'text-yellow-600'
                    }`}>
                      {transaction.amount !== null ? (
                        `${transaction.type === 'income' ? '+' : '-'}R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      ) : (
                        "Valor a definir"
                      )}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                      <Switch
                        checked={transaction.status === 'paid'}
                        onCheckedChange={() => handleStatusToggle(transaction)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição de transações variáveis */}
      <EditVariableTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </div>
  );
}