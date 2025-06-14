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
import { ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { getTransactionsByMonth, updateTransaction, deleteTransaction, subscribeToTransactions } from "../utils/firestore";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

export default function Transactions() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
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
      const monthTransactions = await getTransactionsByMonth(currentUser.uid, selectedMonth);
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

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, currentUser]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <p className="text-red-600">Erro ao carregar transações: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate future transactions based on recurring ones
  const generateFutureTransactions = (): TransactionType[] => {
    const futureTransactions: TransactionType[] = [];
    const currentDate = new Date();
    const months = 6; // Show 6 months ahead
    
    const recurringTransactions = transactions.filter(t => t.recurring);
    
    for (let monthOffset = 1; monthOffset <= months; monthOffset++) {
      recurringTransactions.forEach(transaction => {
        const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, new Date(transaction.date).getDate());
        
        futureTransactions.push({
          ...transaction,
          id: `${transaction.id}-future-${monthOffset}`,
          date: futureDate,
          status: 'pending' as const,
          isGenerated: true,
          originalId: transaction.id,
          amount: transaction.recurringType === 'variable' ? 
            (transaction.amount ? transaction.amount * (0.9 + Math.random() * 0.2) : null) : 
            transaction.amount,
          monthRef: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`
        });
      });
    }
    
    return futureTransactions;
  };

  const futureTransactions = generateFutureTransactions();
  const allTransactions = viewMode === "future" ? [...transactions, ...futureTransactions] : transactions;

  // Enhanced filtering logic
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    // Enhanced date filtering
    const transactionDate = new Date(transaction.date);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let matchesDate = true;
    if (dateFilter === "current") {
      matchesDate = transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
    } else if (dateFilter === "previous") {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      matchesDate = transactionDate.getMonth() === prevMonth && 
                   transactionDate.getFullYear() === prevYear;
    } else if (dateFilter === "future") {
      matchesDate = transactionDate > currentDate;
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDate;
  });

  // Enhanced status toggle function
  const handleStatusToggle = async (transactionId: string, currentStatus: string, isFuture = false) => {
    if (!currentUser || isFuture) return; // Can't change status of future transactions
    
    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    
    try {
      await updateTransaction(currentUser.uid, transactionId, { status: newStatus });
      await refetchTransactions();
      
      toast({
        title: "Status atualizado",
        description: `Transação marcada como ${newStatus === "paid" ? "paga" : "pendente"}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da transação.",
        variant: "destructive",
      });
    }
  };

  // Handle variable recurring transaction update
  const handleVariableUpdate = async (originalId: string, newAmount: number, monthOffset: number) => {
    if (!currentUser) return;

    const result = await Swal.fire({
      title: "Atualizar valor variável",
      text: `Deseja atualizar o valor para R$ ${newAmount.toFixed(2)} neste mês?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sim, atualizar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      // Here you would implement logic to save the variable amount for this specific month
      toast({
        title: "Valor atualizado",
        description: "O valor variável foi atualizado para este mês.",
      });
    }
  };

  // Delete function with SweetAlert2
  const handleDelete = async (transactionId: string, description: string) => {
    if (!currentUser) return;

    const result = await Swal.fire({
      title: "Excluir transação?",
      text: `Tem certeza que deseja excluir "${description}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteTransaction(currentUser.uid, transactionId);
        await refetchTransactions();
        
        Swal.fire({
          title: "Excluída!",
          text: "Transação foi removida com sucesso.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Erro!",
          text: "Não foi possível excluir a transação.",
          icon: "error",
        });
      }
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    const categoryIcons: { [key: string]: string } = {
      "Alimentação": "fas fa-utensils",
      "Transporte": "fas fa-car",
      "Moradia": "fas fa-home",
      "Lazer": "fas fa-gamepad",
      "Saúde": "fas fa-heart",
      "Educação": "fas fa-graduation-cap",
      "Compras": "fas fa-shopping-bag",
      "Outros": "fas fa-ellipsis-h",
      "Salário": "fas fa-briefcase",
      "Freelance": "fas fa-laptop",
      "Investimentos": "fas fa-chart-line",
      "Renda Extra": "fas fa-plus-circle",
    };
    
    return categoryIcons[category] || "fas fa-circle";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        {/* Enhanced Header with filters */}
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 mb-3 text-lg">
            <i className="fas fa-exchange-alt text-blue-600 text-sm"></i>
            Gerenciar Transações
          </CardTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("current")}
                className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "current" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Atual
              </button>
              <button
                onClick={() => setViewMode("future")}
                className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "future" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Projeção
              </button>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês atual</SelectItem>
                <SelectItem value="previous">Mês anterior</SelectItem>
                <SelectItem value="future">Futuro</SelectItem>
                <SelectItem value="all">Todos os períodos</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="col-span-2">
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {filteredTransactions.length} de {transactions.length} transações
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setCategoryFilter("all");
                setStatusFilter("all");
                setDateFilter("current");
              }}
            >
              <i className="fas fa-times mr-2"></i>
              Limpar filtros
            </Button>
          </div>
        </CardHeader>

        {/* Enhanced Transactions Table */}
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou adicionar novas transações.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction, index) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <i className={`${getCategoryIcon(transaction.category)} text-sm ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}></i>
                          </div>
                          <span className="font-medium capitalize">
                            {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          {transaction.source && (
                            <p className="text-sm text-gray-500">{transaction.source}</p>
                          )}
                          {transaction.recurring && (
                            <div className="flex items-center gap-1 mt-1">
                              <i className="fas fa-repeat text-xs text-blue-600"></i>
                              <span className="text-xs text-blue-600">Recorrente</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold text-sm ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount !== null ? 
                            `${transaction.type === 'income' ? '+' : '-'}R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                            'Valor não definido'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.isGenerated ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Agendado
                              </Badge>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(transaction.id, transaction.status, transaction.isGenerated)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                transaction.status === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              disabled={transaction.isGenerated}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  transaction.status === 'paid' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                          <span className={`text-xs font-medium ${
                            transaction.isGenerated 
                              ? 'text-blue-600'
                              : transaction.status === 'paid' 
                                ? 'text-green-600' 
                                : 'text-orange-600'
                          }`}>
                            {transaction.isGenerated 
                              ? 'Agendado' 
                              : transaction.status === 'paid' 
                                ? 'Pago' 
                                : 'Pendente'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(transaction.id, transaction.description)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Enhanced Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/30">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Mostrando {filteredTransactions.length} de {transactions.length} transações</span>
                <div className="flex items-center gap-2">
                  <span>Total:</span>
                  <span className="font-bold text-blue-600">
                    R$ {filteredTransactions.reduce((sum, t) => sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <i className="fas fa-chevron-left mr-1"></i>
                  Anterior
                </Button>
                <Button variant="default" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                  <i className="fas fa-chevron-right ml-1"></i>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}