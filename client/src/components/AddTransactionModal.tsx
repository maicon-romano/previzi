import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { useCategories } from "../hooks/useCategories";
import { useSources } from "../hooks/useSources";
import { addTransaction } from "../utils/firestore";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TransactionType } from "../types";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded?: () => void;
}

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.string(),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  source: z.string().min(1, "Origem é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  status: z.enum(["paid", "pending"]),
  recurring: z.boolean(),
  isVariableAmount: z.boolean().optional(),
  recurringType: z.enum(["infinite", "fixed"]).optional(),
  recurringMonths: z.string().optional(),
  recurringEndDate: z.string().optional(),
}).refine(
  (data) => {
    // Se for recorrente e variável, o valor pode estar vazio
    if (data.recurring && data.isVariableAmount) {
      return true;
    }
    // Caso contrário, o valor é obrigatório
    return data.amount && data.amount.trim().length > 0;
  },
  {
    message: "Valor é obrigatório",
    path: ["amount"],
  }
).refine(
  (data) => {
    // Se for recorrente, o tipo de recorrência é obrigatório
    if (data.recurring) {
      return data.recurringType && data.recurringType.length > 0;
    }
    return true;
  },
  {
    message: "Tipo de recorrência é obrigatório",
    path: ["recurringType"],
  }
).refine(
  (data) => {
    // Se for recorrência fixa, deve ter meses ou data de término
    if (data.recurring && data.recurringType === "fixed") {
      return (data.recurringMonths && data.recurringMonths.trim().length > 0) || 
             (data.recurringEndDate && data.recurringEndDate.trim().length > 0);
    }
    return true;
  },
  {
    message: "Para recorrência fixa, defina a quantidade de meses ou data de término",
    path: ["recurringMonths"],
  }
);

type TransactionFormData = z.infer<typeof transactionSchema>;

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

export default function AddTransactionModal({ isOpen, onClose, onTransactionAdded }: AddTransactionModalProps) {
  const { currentUser } = useAuth();
  const { categories } = useCategories();
  const { sources } = useSources();
  const [isLoading, setIsLoading] = useState(false);
  const [displayAmount, setDisplayAmount] = useState("");

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      category: "",
      description: "",
      source: "",
      date: new Date().toISOString().split("T")[0],
      status: "paid",
      recurring: false,
      isVariableAmount: false,
      recurringType: "infinite",
      recurringMonths: "",
      recurringEndDate: "",
    },
  });

  const watchType = form.watch("type");
  const watchRecurring = form.watch("recurring");
  const watchVariableAmount = form.watch("isVariableAmount");
  const watchRecurringType = form.watch("recurringType");

  // Reset form quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        source: "",
        date: new Date().toISOString().split("T")[0],
        status: "paid",
        recurring: false,
        isVariableAmount: false,
        recurringType: "infinite",
        recurringMonths: "",
        recurringEndDate: "",
      });
      setDisplayAmount("");
    }
  }, [isOpen, form]);

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setDisplayAmount(formatted);
    form.setValue("amount", formatted);
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Corrigir problema de fuso horário ao criar data
      const dateParts = data.date.split('-');
      const transactionDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      const monthRef = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Para transações recorrentes com valor variável, permitir amount como null
      let amount: number | null = null;
      
      if (!data.recurring || !data.isVariableAmount) {
        // Usar a função parseCurrency para converter corretamente
        amount = parseCurrency(data.amount);
        
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Valor deve ser um número positivo");
        }
      }

      // Preparar dados de recorrência
      let recurringMonths: number | undefined;
      let recurringEndDate: string | undefined;

      if (data.recurring && data.recurringType === "fixed") {
        if (data.recurringMonths && data.recurringMonths.trim()) {
          recurringMonths = parseInt(data.recurringMonths);
        }
        if (data.recurringEndDate && data.recurringEndDate.trim()) {
          recurringEndDate = data.recurringEndDate;
        }
      }

      // Garantir que todos os campos estão com tipos corretos conforme estrutura real do Firestore
      const transactionData = {
        type: data.type,
        amount: amount,
        category: data.category,
        description: data.description,
        source: data.source,
        date: transactionDate,
        status: data.status,
        recurring: data.recurring,
        isVariableAmount: data.isVariableAmount || false,
        recurringType: data.recurring ? data.recurringType : undefined,
        recurringMonths: recurringMonths,
        recurringEndDate: recurringEndDate,
      };

      console.log('Dados da transação a serem salvos:', transactionData);

      await addTransaction(currentUser.uid, transactionData);

      // Feedback específico para transações recorrentes
      if (transactionData.recurring) {
        if (data.recurringType === "infinite") {
          // Para transações infinitas, não mencionar período específico
          if (transactionData.isVariableAmount) {
            toast.success("Transação Recorrente Infinita Criada", {
              description: "Transação infinita criada. Você pode definir os valores mensalmente conforme necessário.",
            });
          } else {
            toast.success("Transação Recorrente Infinita Criada", {
              description: "Transação principal criada e será replicada automaticamente a cada mês!",
            });
          }
        } else {
          // Para transações fixas, mostrar duração específica
          let durationText = "";
          
          if (data.recurringMonths && data.recurringMonths.trim()) {
            const months = parseInt(data.recurringMonths);
            durationText = `próximos ${months} ${months === 1 ? 'mês' : 'meses'}`;
          } else if (data.recurringEndDate && data.recurringEndDate.trim()) {
            const endDate = new Date(data.recurringEndDate);
            durationText = `até ${endDate.toLocaleDateString('pt-BR')}`;
          }

          if (transactionData.isVariableAmount) {
            toast.success("Transação Recorrente Criada", {
              description: `Transação criada para os ${durationText}. Você pode definir os valores mensalmente.`,
            });
          } else {
            toast.success("Transação Recorrente Criada", {
              description: `Transação principal criada e replicada automaticamente para os ${durationText}!`,
            });
          }
        }
      } else {
        toast.success("Transação adicionada", {
          description: "A transação foi adicionada com sucesso.",
        });
      }

      form.reset();
      onClose();
      
      // O listener em tempo real irá atualizar automaticamente a tabela
      // Não é necessário callback manual pois o Firestore onSnapshot detecta mudanças
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Erro ao salvar transação", {
        description: error instanceof Error ? error.message : "Não foi possível adicionar a transação. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 form-compact">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="income" />
                        <Label htmlFor="income">Receita</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="expense" />
                        <Label htmlFor="expense">Despesa</Label>
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
                      placeholder={
                        watchRecurring && watchVariableAmount 
                          ? "Valor será definido mensalmente" 
                          : "0,00"
                      }
                      value={displayAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      disabled={watchRecurring && watchVariableAmount}
                    />
                  </FormControl>
                  <FormMessage />
                  {watchRecurring && watchVariableAmount && (
                    <p className="text-sm text-muted-foreground">
                      Para transações variáveis, o valor será definido mensalmente na visualização mensal
                    </p>
                  )}
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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Em aberto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Transação recorrente</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {watchRecurring && (
              <FormField
                control={form.control}
                name="isVariableAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Valor variável (ex: Conta de Luz)</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Para transações que mudam de valor mensalmente
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {watchRecurring && (
              <FormField
                control={form.control}
                name="recurringType"
                render={({ field }) => (
                  <FormItem className="ml-6">
                    <FormLabel>Duração da recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="infinite">Recorrência Infinita</SelectItem>
                        <SelectItem value="fixed">Prazo Determinado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchRecurring && watchRecurringType === "fixed" && (
              <div className="ml-6 space-y-3">
                <FormField
                  control={form.control}
                  name="recurringMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de meses (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Ex: 6"
                          min="1"
                          max="120"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de término (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        Defina pelo menos a quantidade de meses ou data de término
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            )}

              <div className="flex justify-end space-x-3 pt-4 flex-shrink-0">
                <Button type="button" variant="outline" onClick={onClose}>
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
