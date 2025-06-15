import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { updateTransaction } from "../utils/firebase";
import { useToast } from "../hooks/use-toast";
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
import { TransactionType } from "../types";

interface EditVariableTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionType | null;
  onTransactionUpdated: () => void;
}

const editTransactionSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório"),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

export default function EditVariableTransactionModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onTransactionUpdated 
}: EditVariableTransactionModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      amount: "",
    },
  });

  useEffect(() => {
    if (transaction && isOpen) {
      form.reset({
        amount: transaction.amount?.toString() || "",
      });
    }
  }, [transaction, isOpen, form]);

  const onSubmit = async (data: EditTransactionFormData) => {
    if (!currentUser || !transaction) return;

    setIsLoading(true);
    try {
      await updateTransaction(currentUser.uid, transaction.id, {
        amount: parseFloat(data.amount),
      });

      toast({
        title: "Transação atualizada",
        description: "O valor da transação foi atualizado com sucesso.",
      });

      onTransactionUpdated();
      onClose();
      form.reset();
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (date: Date) => {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Valor - {transaction?.description}
          </DialogTitle>
          {transaction && (
            <p className="text-sm text-gray-600">
              {getMonthName(new Date(transaction.date))} • {transaction.category}
            </p>
          )}
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}