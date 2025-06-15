import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TransactionType } from "../types";
import { updateRecurringBaseValue } from "../utils/firestore";

interface UpdateRecurringBaseValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionType | null;
  onUpdated?: () => void;
}

const updateSchema = z.object({
  newBaseValue: z.string().min(1, "Valor é obrigatório"),
  overwriteEdited: z.boolean().default(false),
});

type UpdateFormData = z.infer<typeof updateSchema>;

// Função para formatar número brasileiro
const formatCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para converter formato brasileiro para número
const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  if (cleanValue.includes(',')) {
    const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  }
  return parseFloat(cleanValue) || 0;
};

export default function UpdateRecurringBaseValueModal({ 
  isOpen, 
  onClose, 
  transaction,
  onUpdated 
}: UpdateRecurringBaseValueModalProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [displayAmount, setDisplayAmount] = useState("");

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      newBaseValue: "",
      overwriteEdited: false,
    },
  });

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setDisplayAmount(formatted);
    form.setValue("newBaseValue", formatted);
  };

  const onSubmit = async (data: UpdateFormData) => {
    if (!currentUser || !transaction) return;

    setIsLoading(true);
    try {
      const newValue = parseCurrency(data.newBaseValue);
      
      if (isNaN(newValue) || newValue <= 0) {
        throw new Error("Valor deve ser um número positivo");
      }

      const updatedCount = await updateRecurringBaseValue(
        currentUser.uid,
        transaction,
        newValue,
        data.overwriteEdited
      );

      toast.success(
        `Atualizamos o valor base de ${updatedCount} transações futuras da série "${transaction.description}".`
      );

      onUpdated?.();
      onClose();
      form.reset();
      setDisplayAmount("");
    } catch (error) {
      console.error("Erro ao atualizar valor base:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar valor base");
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction || !transaction.recurring || !transaction.isVariableAmount) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-sync-alt text-blue-600"></i>
            Atualizar Valor Base da Recorrência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Transação Selecionada:</h4>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Descrição:</strong> {transaction.description}
            </p>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Valor Atual:</strong> R$ {(transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Categoria:</strong> {transaction.category}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newBaseValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Valor Base</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        value={displayAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overwriteEdited"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Sobrescrever valores já editados manualmente
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Se marcado, atualiza todos os meses futuros. Se desmarcado, atualiza apenas os meses que ainda não foram editados.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Atualizar Valor Base
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="bg-amber-50 p-3 rounded-lg">
            <p className="text-xs text-amber-800">
              <i className="fas fa-info-circle mr-1"></i>
              Esta ação irá atualizar o valor base de todas as transações futuras desta série recorrente. 
              As transações já pagas ou de meses anteriores não serão afetadas.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}