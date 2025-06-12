import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function Transactions() {
  const { transactions, isLoading, error } = useTransactions();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 flex-1" />
            </div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar transações</h3>
            <p className="text-gray-600">Não foi possível carregar as transações. Tente novamente.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const getTransactionIcon = (type: string, category: string) => {
    if (type === "income") {
      return "fas fa-arrow-up";
    }
    
    // Expense icons based on category
    const categoryIcons: Record<string, string> = {
      "Moradia": "fas fa-home",
      "Alimentação": "fas fa-utensils",
      "Transporte": "fas fa-car",
      "Lazer": "fas fa-gamepad",
      "Saúde": "fas fa-heartbeat",
      "Educação": "fas fa-graduation-cap",
    };
    
    return categoryIcons[category] || "fas fa-arrow-down";
  };

  return (
    <Card>
      {/* Header with filters */}
      <CardHeader className="border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
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
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="icon">
              <i className="fas fa-search"></i>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Transactions Table */}
      <CardContent className="p-0">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || typeFilter !== "all" || categoryFilter !== "all" 
                ? "Nenhuma transação encontrada" 
                : "Nenhuma transação cadastrada"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== "all" || categoryFilter !== "all"
                ? "Tente ajustar os filtros de busca."
                : "Comece adicionando sua primeira transação."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          transaction.type === 'income' ? 'bg-success-100' : 'bg-red-100'
                        }`}>
                          <i className={`${getTransactionIcon(transaction.type, transaction.category)} text-sm ${
                            transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                          }`}></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          {transaction.source && (
                            <div className="text-sm text-gray-500">
                              {transaction.source}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-success-500' : 'text-danger-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'paid' ? 'default' : 'outline'}>
                        {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-edit mr-1"></i>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <i className="fas fa-trash mr-1"></i>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {filteredTransactions.length} de {transactions.length} transações
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="default" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
