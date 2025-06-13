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
import { ChevronLeft, ChevronRight, Calendar, Filter, Search } from "lucide-react";
import { motion } from "framer-motion";
import { getTransactionsByMonth, updateTransaction, deleteTransaction } from "../utils/firebase";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

export default function TransactionsMonthly() {
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
      console.log('Carregando transações para o mês:', selectedMonth, 'Usuário:', currentUser.uid);
      const monthTransactions = await getTransactionsByMonth(currentUser.uid, selectedMonth);
      console.log('Transações carregadas:', monthTransactions.length);
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

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!currentUser) return;

    const result = await Swal.fire({
      title: 'Confirmar exclusão',
      text: 'Tem certeza que deseja excluir esta transação?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteTransaction(currentUser.uid, transactionId);
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        
        toast({
          title: "Transação excluída",
          description: "A transação foi excluída com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a transação.",
          variant: "destructive",
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
                                {transaction.recurringType === 'variable' ? 'Recorrente Variável' : 'Recorrente Fixa'}
                              </Badge>
                              {transaction.isGenerated && (
                                <Badge variant="outline" className="text-xs">Gerada</Badge>
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
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
    </div>
  );
}