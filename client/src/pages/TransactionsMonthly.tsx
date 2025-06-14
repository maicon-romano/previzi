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
import { ChevronLeft, ChevronRight, Calendar, Filter, Search, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { getTransactionsByMonth, updateTransaction, deleteTransaction, parseMonthString, subscribeToMonthlyTransactions, deleteRecurringTransactionWithOptions } from "../utils/firestore";
import { toast } from "sonner";
import AddTransactionModal from "../components/AddTransactionModal";
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

  const handleStatusToggle = async (transactionId: string, currentStatus: string) => {
    if (!currentUser) return;

    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      await updateTransaction(currentUser.uid, transactionId, { status: newStatus });
      
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId ? { ...t, status: newStatus } : t
        )
      );

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

    // Para transações recorrentes, mostrar opções
    const result = await Swal.fire({
      title: 'Excluir Transação Recorrente',
      text: 'Esta é uma transação recorrente. Como deseja proceder?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Excluir apenas esta ocorrência',
      denyButtonText: 'Excluir todas as futuras',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      denyButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      customClass: {
        actions: 'flex-col gap-2 w-full',
        confirmButton: 'w-full',
        denyButton: 'w-full',
        cancelButton: 'w-full'
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
      // Excluir todas as futuras ocorrências
      try {
        const deletedCount = await deleteRecurringTransactionWithOptions(currentUser.uid, transaction, "all_future");
        toast.success("Todas as futuras ocorrências foram excluídas", {
          description: `${deletedCount} transação(ões) excluída(s) com sucesso.`
        });
      } catch (error) {
        console.error('Erro ao excluir transações:', error);
        toast.error("Erro ao excluir", {
          description: "Não foi possível excluir as transações."
        });
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTransactions();
    }
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
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.amount !== null)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

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

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Despesas</p>
                <p className="text-xl font-bold text-red-600">
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.source && (
                            <div className="text-sm text-gray-500">Origem: {transaction.source}</div>
                          )}
                          {transaction.recurring && (
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Recorrente
                              </Badge>
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
                          <span className="text-gray-400 italic">Valor não definido</span>
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
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Excluir
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
    </div>
  );
}