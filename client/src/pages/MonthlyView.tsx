import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactionsByMonth, updateTransaction, parseMonthString, deleteRecurringTransactionWithOptions, subscribeToMonthlyTransactions } from "../utils/firestore";
import type { TransactionType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Calendar, DollarSign, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EditTransactionModal from "../components/EditTransactionModal";
import EditVariableTransactionModal from "../components/EditVariableTransactionModal";
import Swal from "sweetalert2";

export default function MonthlyView() {
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVariableEditModalOpen, setIsVariableEditModalOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

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
      toast.error("Erro ao carregar transações", {
        description: "Não foi possível carregar as transações do mês.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    
    // Configurar listener em tempo real para transações do mês
    const { year, month } = parseMonthString(selectedMonth);
    const unsubscribe = subscribeToMonthlyTransactions(
      currentUser.uid,
      year,
      month,
      (monthTransactions) => {
        setTransactions(monthTransactions);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar transações:', error);
        toast.error("Erro ao carregar transações", {
          description: "Não foi possível carregar as transações do mês.",
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
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

      toast.success("Status atualizado", {
        description: `Transação marcada como ${newStatus === 'paid' ? 'paga' : 'pendente'}.`,
      });
    } catch (error) {
      toast.error("Não foi possível atualizar o status da transação.");
    }
  };

  const handleEditTransaction = (transaction: TransactionType) => {
    setEditingTransaction(transaction);
    
    // Se for transação recorrente com valor variável, usar modal específico
    if (transaction.recurring && transaction.isVariableAmount) {
      setIsVariableEditModalOpen(true);
    } else {
      setIsEditModalOpen(true);
    }
  };

  const handleTransactionUpdated = () => {
    loadTransactions();
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (transaction: TransactionType) => {
    if (!currentUser) return;

    // Se não for transação recorrente, excluir normalmente
    if (!transaction.recurring) {
      const result = await Swal.fire({
        title: 'Excluir Transação',
        text: 'Tem certeza que deseja excluir esta transação?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          await deleteRecurringTransactionWithOptions(currentUser.uid, transaction, "current");
          toast.success("Transação excluída", {
            description: "A transação foi excluída com sucesso."
          });
        } catch (error) {
          console.error('Erro ao excluir transação:', error);
          toast.error("Erro ao excluir", {
            description: "Não foi possível excluir a transação."
          });
        }
      }
      return;
    }

    // Para transações recorrentes, mostrar opções com design melhorado
    const result = await Swal.fire({
      title: '<strong>Excluir Transação Recorrente</strong>',
      html: `
        <div style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">
          <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <svg width="48" height="48" fill="#EF4444" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <p><strong>Deseja excluir apenas esta ocorrência ou todas as próximas a partir deste mês?</strong></p>
          <div style="margin-top: 12px; padding: 12px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <small style="color: #92400E;">💡 Esta ação não pode ser desfeita</small>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '📅 Excluir apenas esta',
      denyButtonText: '🗑️ Excluir todas as próximas',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#3B82F6',
      denyButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      background: '#FFFFFF',
      backdrop: 'rgba(0,0,0,0.4)',
      showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
      },
      customClass: {
        popup: 'rounded-xl shadow-2xl border-0',
        title: 'text-xl font-bold text-gray-800 mb-4',
        htmlContainer: 'text-gray-600',
        confirmButton: 'mx-2 px-6 py-3 rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105',
        denyButton: 'mx-2 px-6 py-3 rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105',
        cancelButton: 'mx-2 px-6 py-3 rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105',
        actions: 'flex-wrap gap-3 justify-center mt-6'
      }
    });

    if (result.isConfirmed) {
      // Excluir apenas esta ocorrência
      try {
        setDeletingTransactionId(transaction.id);
        
        // Aguardar um pouco para mostrar a animação
        setTimeout(async () => {
          await deleteRecurringTransactionWithOptions(currentUser.uid, transaction, "current");
          
          // Atualizar estado local removendo a transação
          setTransactions(prev => prev.filter(t => t.id !== transaction.id));
          setDeletingTransactionId(null);
          
          toast.success("Transação excluída deste mês", {
            description: "Apenas esta ocorrência foi excluída."
          });
        }, 300);
        
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        setDeletingTransactionId(null);
        toast.error("Erro ao excluir", {
          description: "Não foi possível excluir a transação."
        });
      }
    } else if (result.isDenied) {
      // Excluir todas as futuras ocorrências
      try {
        setDeletingTransactionId(transaction.id);
        
        setTimeout(async () => {
          const deletedCount = await deleteRecurringTransactionWithOptions(currentUser.uid, transaction, "all_future");
          
          // O listener em tempo real irá atualizar automaticamente a tabela
          setDeletingTransactionId(null);
          
          toast.success("Todas as futuras ocorrências foram excluídas", {
            description: `${deletedCount} transação(ões) excluída(s) com sucesso.`
          });
        }, 300);
        
      } catch (error) {
        console.error('Erro ao excluir transações:', error);
        setDeletingTransactionId(null);
        toast.error("Erro ao excluir", {
          description: "Não foi possível excluir as transações."
        });
      }
    }
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
                  animate={{ 
                    opacity: deletingTransactionId === transaction.id ? 0 : 1, 
                    y: 0,
                    scale: deletingTransactionId === transaction.id ? 0.95 : 1
                  }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    delay: deletingTransactionId === transaction.id ? 0 : index * 0.1,
                    duration: deletingTransactionId === transaction.id ? 0.3 : 0.2
                  }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                    deletingTransactionId === transaction.id 
                      ? 'bg-red-50 border-2 border-red-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
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
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                      <Switch
                        checked={transaction.status === 'paid'}
                        onCheckedChange={() => handleStatusToggle(transaction)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      
                      {/* Botão de edição */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Botão de exclusão */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição de transações variáveis */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
      />

      <EditVariableTransactionModal
        isOpen={isVariableEditModalOpen}
        onClose={() => {
          setIsVariableEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onTransactionUpdated={() => {
          setIsVariableEditModalOpen(false);
          setEditingTransaction(null);
        }}
      />
    </div>
  );
}