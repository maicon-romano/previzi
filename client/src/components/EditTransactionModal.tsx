import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { useCategories } from "../hooks/useCategories";
import { useSources } from "../hooks/useSources";
import { updateTransaction } from "../utils/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TransactionType } from "../types";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionType | null;
}

const editTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  source: z.string().min(1, "Origem é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  status: z.enum(["paid", "pending"]),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

// Função para formatar número brasileiro
const formatCurrency = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se não há números, retorna vazio
  if (!numbers) return '';
  
  // Converte para número e divide por 100 para ter os centavos
  const amount = parseFloat(numbers) / 100;
  
  // Formata como moeda brasileira
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para converter formato brasileiro para número
const parseCurrency = (value: string): number => {
  // Remove tudo que não é dígito, vírgula ou ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Se o valor contém vírgula, trata como formato brasileiro (123.456,78)
  if (cleanValue.includes(',')) {
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  }
  
  // Se não contém vírgula, trata como formato americano (123456.78)
  return parseFloat(cleanValue) || 0;
};

export default function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction
}: EditTransactionModalProps) {
  const { currentUser } = useAuth();
  const { categories } = useCategories();
  const { sources } = useSources();
  const [isLoading, setIsLoading] = useState(false);
  const [displayAmount, setDisplayAmount] = useState("");

  const form = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      category: "",
      description: "",
      source: "",
      date: "",
      status: "paid",
    },
  });

  const watchType = form.watch("type");

  // Atualizar formulário quando a transação muda
  useEffect(() => {
    if (transaction && isOpen) {
      const formattedAmount = transaction.amount ? transaction.amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) : "";
      
      setDisplayAmount(formattedAmount);
      
      form.reset({
        type: transaction.type,
        amount: formattedAmount,
        category: transaction.category,
        description: transaction.description,
        source: transaction.source,
        date: transaction.date instanceof Date 
          ? transaction.date.toISOString().split("T")[0]
          : new Date(transaction.date).toISOString().split("T")[0],
        status: transaction.status,
      });
    }
  }, [transaction, isOpen, form]);

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setDisplayAmount(formatted);
    form.setValue("amount", formatted);
  };

  const onSubmit = async (data: EditTransactionFormData) => {
    if (!currentUser || !transaction) return;

    setIsLoading(true);
    try {
      const amount = parseCurrency(data.amount);
      
      await updateTransaction(currentUser.uid, transaction.id, {
        type: data.type,
        amount,
        category: data.category,
        description: data.description,
        source: data.source,
        date: new Date(data.date),
        status: data.status,
      });

      toast.success("Transação atualizada", {
        description: "A transação foi atualizada com sucesso.",
      });

      onClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Erro ao atualizar transação", {
        description: "Não foi possível atualizar a transação. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="edit-income" />
                          <Label htmlFor="edit-income">Receita</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expense" id="edit-expense" />
                          <Label htmlFor="edit-expense">Despesa</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        value={displayAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter((cat) => cat.type === watchType)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              <div className="flex items-center">
                                <i className={`${category.icon || 'fas fa-tag'} mr-2`}></i>
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Descrição da transação" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source.id} value={source.name}>
                            <div className="flex items-center">
                              <i className="fas fa-user mr-2"></i>
                              {source.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}