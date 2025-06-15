import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { TransactionType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Calendar, Filter, Search, Plus, Trash2, Edit, Pencil, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import MonthYearPicker from "../components/MonthYearPicker";
import { getTransactionsByMonth, updateTransaction, deleteTransaction, parseMonthString, subscribeToMonthlyTransactions, deleteRecurringTransactionWithOptions } from "../utils/firestore";
import { toast } from "sonner";
import AddTransactionModal from "../components/AddTransactionModal";
import EditTransactionModal from "../components/EditTransactionModal";
import UpdateRecurringBaseValueModal from "../components/UpdateRecurringBaseValueModal";
import Swal from "sweetalert2";

export default function TransactionsMonthly() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdateBaseValueModalOpen, setIsUpdateBaseValueModalOpen] = useState(false);
  const [updatingTransaction, setUpdatingTransaction] = useState<TransactionType | null>(null);

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
      console.log('Carregando transações para o mês:', selectedMonth, 'Usuário:', currentUser.uid);
      const { year, month } = parseMonthString(selectedMonth);
      const monthTransactions = await getTransactionsByMonth(currentUser.uid, year, month);
      console.log('Transações carregadas:', monthTransactions.length);
      setTransactions(monthTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error("Erro ao carregar", {
        description: "Não foi possível carregar as transações do mês."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = (transaction: TransactionType) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleUpdateBaseValue = (transaction: TransactionType) => {
    setUpdatingTransaction(transaction);
    setIsUpdateBaseValueModalOpen(true);
  };

  const handleStatusToggle = async (transactionId: string, currentStatus: string) => {
    if (!currentUser) return;

    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      await updateTransaction(currentUser.uid, transactionId, { status: newStatus });
      
      // O listener em tempo real irá atualizar automaticamente a tabela
      // Removido setTransactions manual pois o onSnapshot detecta mudanças

      toast.success("Status atualizado", {
        description: `Transação marcada como ${newStatus === 'paid' ? 'paga' : 'pendente'}.`
      });
    } catch (error) {
      toast.error("Erro ao atualizar", {
        description: "Não foi possível atualizar o status da transação."
      });
    }
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
          <p><strong>Escolha como deseja excluir esta transação recorrente:</strong></p>
          <div style="margin-top: 12px; padding: 12px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <small style="color: #92400E;">💡 Esta ação não pode ser desfeita</small>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '📅 Apenas esta ocorrência',
      denyButtonText: '🗑️ Todas as instâncias da série',
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
        await deleteRecurringTransactionWithOptions(currentUser.uid, transaction, "current");
        toast.success("Transação excluída deste mês", {
          description: "Apenas esta ocorrência foi excluída."
        });
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        toast.error("Erro ao excluir", {
          description: "Não foi possível excluir a transação."
        });
      }
    } else if (result.isDenied) {
      // Excluir TODAS as instâncias da série (passadas, presentes e futuras)
      try {
        const deletedCount = await deleteRecurringTransactionWithOptions(currentUser.uid, transaction, "all_instances");
        toast.success("Toda a série de transações foi excluída", {
          description: `${deletedCount} transação(ões) da série excluída(s) com sucesso.`
        });
      } catch (error) {
        console.error('Erro ao excluir série de transações:', error);
        toast.error("Erro ao excluir série", {
          description: "Não foi possível excluir todas as instâncias da série."
        });
      }
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
        console.log('Transações atualizadas em tempo real:', monthTransactions.length);
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(transactions.map(t => t.category)));
  
  // Comprehensive KPI calculations for the month
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const paidExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalBalance = totalIncome - totalExpenses;
  const realBalance = totalIncome - paidExpenses; // Only considering paid expenses

  if (!currentUser) {
    return <div>Faça login para visualizar suas transações.</div>;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navegação por mês */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transações por Mês
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <MonthYearPicker 
                value={selectedMonth}
                onChange={setSelectedMonth}
                className="font-medium"
              />
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

      {/* Comprehensive Financial KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Total de Receitas */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Total de Receitas</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Despesas */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">💸</span>
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Total de Despesas</p>
                <p className="text-xl font-bold text-red-600">
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas Pagas */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Despesas Pagas</p>
                <p className="text-xl font-bold text-blue-600">
                  R$ {paidExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas em Aberto */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">Despesas em Aberto</p>
                <p className="text-xl font-bold text-orange-600">
                  R$ {pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Total */}
        <Card className={`border-purple-200 bg-purple-50/50`}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Saldo Total</p>
                <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-600">Receitas - Todas as Despesas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Real (apenas pagas) */}
        <Card className={`border-emerald-200 bg-emerald-50/50`}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium">Saldo Real</p>
                <p className={`text-xl font-bold ${realBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {realBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-600">Receitas - Despesas Pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações de {getMonthName(selectedMonth)}</CardTitle>
          {/* Resumo de quantidade de transações */}
          {filteredTransactions.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-200">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📌</span>
                  <span className="font-semibold text-gray-700">
                    Total de Transações: <span className="text-blue-600">{filteredTransactions.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span className="font-medium text-green-700">
                    Receitas: <span className="font-bold">{filteredTransactions.filter(t => t.type === 'income').length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">❌</span>
                  <span className="font-medium text-red-700">
                    Despesas: <span className="font-bold">{filteredTransactions.filter(t => t.type === 'expense').length}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma transação encontrada para os filtros selecionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-gray-50"
                    >
                      <TableCell className="text-center text-sm font-medium text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.source && (
                            <div className="text-sm text-gray-500">Origem: {transaction.source}</div>
                          )}
                          {transaction.recurring && (
                            <div className="flex gap-1 mt-1">
                              {transaction.isVariableAmount ? (
                                <Badge variant="secondary" className="text-xs">
                                  Recorrente Variável
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Recorrente
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        {transaction.amount !== null ? (
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 italic">Valor não definido</span>
                            {transaction.recurring && transaction.isVariableAmount && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                onClick={() => handleEditTransaction(transaction)}
                                title="Definir valor para este mês"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            transaction.status === 'paid' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.status === 'paid' ? 'Pago' : 'Em Aberto'}
                          </span>
                          <Switch
                            checked={transaction.status === 'paid'}
                            onCheckedChange={() => handleStatusToggle(transaction.id, transaction.status)}
                            className="data-[state=checked]:bg-green-500"
                            disabled={transaction.amount === null}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                            title="Editar transação"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* Botão de ajuste em massa para recorrentes variáveis */}
                          {transaction.recurring && transaction.isVariableAmount && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateBaseValue(transaction)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors duration-200"
                              title="Atualizar valor base da recorrência"
                            >
                              <i className="fas fa-sync-alt text-xs"></i>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                            title="Excluir transação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de nova transação */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={loadTransactions}
      />

      {/* Modal de edição de transação */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
      />

      {/* Modal de atualização de valor base */}
      <UpdateRecurringBaseValueModal
        isOpen={isUpdateBaseValueModalOpen}
        onClose={() => {
          setIsUpdateBaseValueModalOpen(false);
          setUpdatingTransaction(null);
        }}
        transaction={updatingTransaction}
        onUpdated={loadTransactions}
      />
    </div>
  );
}