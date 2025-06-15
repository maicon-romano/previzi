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
import { ChevronLeft, ChevronRight, Calendar, Filter, Edit, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { getTransactionsByMonth, updateTransaction, deleteTransaction, subscribeToMonthlyTransactions } from "../utils/firestore";
import { useToast } from "@/hooks/use-toast";
import EditTransactionModal from "../components/EditTransactionModal";
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

  const loadTransactionsForMonth = async (monthRef: string) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const [year, month] = monthRef.split('-').map(Number);
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

  const setupRealtimeListener = (monthRef: string) => {
    if (!currentUser) return;

    const [year, month] = monthRef.split('-').map(Number);
    
    setIsLoading(true);
    
    const unsubscribe = subscribeToMonthlyTransactions(
      currentUser.uid,
      year,
      month,
      (updatedTransactions) => {
        setTransactions(updatedTransactions);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar transações:', error);
        toast({
          title: "Erro",
          description: "Erro na sincronização em tempo real.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    );

    return unsubscribe;
  };

  const handleEditTransaction = (transaction: TransactionType) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleStatusToggle = async (transactionId: string, currentStatus: string) => {
    if (!currentUser) return;

    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      await updateTransaction(currentUser.uid, transactionId, { status: newStatus });
      
      // Não precisa recarregar manualmente - o listener em tempo real atualiza automaticamente

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

  const handleDelete = async (transactionId: string, description: string) => {
    if (!currentUser) return;

    const result = await Swal.fire({
      title: 'Confirmar exclusão',
      text: `Deseja excluir a transação "${description}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteTransaction(currentUser.uid, transactionId);
        
        // Não precisa recarregar manualmente - o listener em tempo real atualiza automaticamente
        
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
    if (!currentUser) return;

    // Configurar listener em tempo real para o mês selecionado
    const unsubscribe = setupRealtimeListener(selectedMonth);

    // Cleanup function para cancelar o listener quando o componente for desmontado ou o mês mudar
    return unsubscribe;
  }, [currentUser, selectedMonth]);

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Obter categorias únicas para o filtro
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Transações
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Visualize e gerencie suas transações por mês
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Navegação de mês */}
          <div className="flex items-center justify-between bg-white/50 rounded-lg p-4 border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {getMonthName(selectedMonth)}
              </h3>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="flex items-center space-x-2"
            >
              <span>Próximo</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <Input
                placeholder="Descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de transações */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros para ver mais resultados."
                  : "Não há transações para este mês."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.description}</span>
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
                        <Badge variant="outline" className="font-medium">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.amount !== null ? (
                          <span className={`font-bold ${
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
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={transaction.status === 'paid'}
                            onCheckedChange={() => handleStatusToggle(transaction.id, transaction.status)}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <span className={`text-xs font-medium ${
                            transaction.status === 'paid' 
                              ? 'text-green-600' 
                              : 'text-orange-600'
                          }`}>
                            {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                            onClick={() => handleEditTransaction(transaction)}
                            title="Editar transação"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                            onClick={() => handleDelete(transaction.id, transaction.description)}
                            title="Excluir transação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Resumo */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/30 rounded-lg">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Mostrando {filteredTransactions.length} de {transactions.length} transações</span>
                <div className="flex items-center gap-2">
                  <span>Total:</span>
                  <span className="font-bold text-blue-600">
                    R$ {filteredTransactions.reduce((sum, t) => sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição de transações */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
          // Não precisa recarregar manualmente - o listener em tempo real atualiza automaticamente
        }}
        transaction={editingTransaction}
      />
    </motion.div>
  );
}