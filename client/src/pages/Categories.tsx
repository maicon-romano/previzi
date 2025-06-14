import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Plus } from "lucide-react";
import Swal from "sweetalert2";
import type { CategoryType } from "../types";

const categoryIcons = {
  // Income icons
  "Salário": "fas fa-briefcase",
  "Freelance": "fas fa-handshake",
  "Investimentos": "fas fa-chart-line",
  "Outros": "fas fa-plus",
  
  // Expense icons
  "Moradia": "fas fa-home",
  "Alimentação": "fas fa-utensils",
  "Transporte": "fas fa-car",
  "Lazer": "fas fa-gamepad",
  "Saúde": "fas fa-heartbeat",
  "Educação": "fas fa-graduation-cap",
};

export default function Categories() {
  const { categories, isLoading, addCategory, deleteCategory, updateCategory } = useCategories();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("income");
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] = useState<"income" | "expense">("income");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCategory({
        name: newCategoryName.trim(),
        type: newCategoryType,
        icon: categoryIcons[newCategoryName as keyof typeof categoryIcons] || "fas fa-tag",
      });

      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso.",
      });

      setNewCategoryName("");
      setNewCategoryType("income");
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a categoria. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: CategoryType) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryType(category.type);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCategory(editingCategory.id, {
        name: editCategoryName.trim(),
        type: editCategoryType,
        icon: categoryIcons[editCategoryName as keyof typeof categoryIcons] || "fas fa-tag",
      });

      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });

      setIsEditModalOpen(false);
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryType("income");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const result = await Swal.fire({
      title: 'Excluir Categoria',
      text: `Tem certeza que deseja excluir a categoria "${categoryName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-lg',
        title: 'text-lg font-semibold text-gray-900',
        content: 'text-gray-600',
        confirmButton: 'px-4 py-2 rounded-md font-medium',
        cancelButton: 'px-4 py-2 rounded-md font-medium'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteCategory(categoryId);
        toast({
          title: "Categoria excluída",
          description: "A categoria foi excluída com sucesso.",
        });
        
        Swal.fire({
          title: 'Excluída!',
          text: 'A categoria foi excluída com sucesso.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            popup: 'rounded-lg',
            title: 'text-lg font-semibold text-green-600'
          }
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a categoria. Tente novamente.",
          variant: "destructive",
        });
        
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível excluir a categoria.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-lg',
            title: 'text-lg font-semibold text-red-600'
          }
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const incomeCategories = categories.filter(cat => cat.type === "income");
  const expenseCategories = categories.filter(cat => cat.type === "expense");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income Categories */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Categorias de Receita</CardTitle>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-success-500 hover:bg-success-600 text-white"
                  size="sm"
                  onClick={() => setNewCategoryType("income")}
                >
                  <i className="fas fa-plus mr-1"></i>
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Nome da categoria</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ex: Salário, Freelance..."
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Tipo</Label>
                    <RadioGroup
                      value={newCategoryType}
                      onValueChange={(value) => setNewCategoryType(value as "income" | "expense")}
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
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddCategory}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {incomeCategories.length > 0 ? (
            <div className="space-y-3">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center mr-3">
                      <i className={`${category.icon || 'fas fa-tag'} text-success-600`}></i>
                    </div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <i className="fas fa-edit mr-1"></i>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-plus-circle text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria de receita</h3>
              <p>Adicione categorias para organizar suas receitas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Categorias de Despesa</CardTitle>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-danger-500 hover:bg-danger-600 text-white"
                  size="sm"
                  onClick={() => setNewCategoryType("expense")}
                >
                  <i className="fas fa-plus mr-1"></i>
                  Adicionar
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {expenseCategories.length > 0 ? (
            <div className="space-y-3">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <i className={`${category.icon || 'fas fa-tag'} text-danger-600`}></i>
                    </div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <i className="fas fa-edit mr-1"></i>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-plus-circle text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria de despesa</h3>
              <p>Adicione categorias para organizar suas despesas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
