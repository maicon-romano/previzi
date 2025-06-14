import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { useSources } from "../hooks/useSources";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Plus, User, Users } from "lucide-react";
import Swal from "sweetalert2";
import type { CategoryType, SourceType } from "../types";

const availableIcons = [
  { value: "fas fa-briefcase", label: "Trabalho", category: "income" },
  { value: "fas fa-handshake", label: "Freelance", category: "income" },
  { value: "fas fa-chart-line", label: "Investimentos", category: "income" },
  { value: "fas fa-piggy-bank", label: "Poupança", category: "income" },
  { value: "fas fa-gift", label: "Presente", category: "income" },
  { value: "fas fa-dollar-sign", label: "Dinheiro", category: "income" },
  
  { value: "fas fa-home", label: "Moradia", category: "expense" },
  { value: "fas fa-utensils", label: "Alimentação", category: "expense" },
  { value: "fas fa-car", label: "Transporte", category: "expense" },
  { value: "fas fa-gamepad", label: "Lazer", category: "expense" },
  { value: "fas fa-heartbeat", label: "Saúde", category: "expense" },
  { value: "fas fa-graduation-cap", label: "Educação", category: "expense" },
  { value: "fas fa-shopping-cart", label: "Compras", category: "expense" },
  { value: "fas fa-tshirt", label: "Roupas", category: "expense" },
  { value: "fas fa-mobile-alt", label: "Telefone", category: "expense" },
  { value: "fas fa-bolt", label: "Energia", category: "expense" },
  { value: "fas fa-tint", label: "Água", category: "expense" },
  { value: "fas fa-wifi", label: "Internet", category: "expense" },
  { value: "fas fa-credit-card", label: "Cartão", category: "expense" },
  { value: "fas fa-university", label: "Banco", category: "expense" },
  { value: "fas fa-plane", label: "Viagem", category: "expense" },
  { value: "fas fa-paw", label: "Pet", category: "expense" },
  { value: "fas fa-plus", label: "Outros", category: "both" },
];

export default function Categories() {
  const { categories, isLoading: categoriesLoading, addCategory, deleteCategory, updateCategory } = useCategories();
  const { sources, isLoading: sourcesLoading, addSource, deleteSource, updateSource } = useSources();
  const { toast } = useToast();
  
  // Category states
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("income");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] = useState<"income" | "expense">("income");
  const [editCategoryIcon, setEditCategoryIcon] = useState("");
  
  // Source states
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isEditSourceModalOpen, setIsEditSourceModalOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [editingSource, setEditingSource] = useState<SourceType | null>(null);
  const [editSourceName, setEditSourceName] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter icons based on category type
  const getFilteredIcons = (type: "income" | "expense") => {
    return availableIcons.filter(icon => icon.category === type || icon.category === "both");
  };

  // Category handlers
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
        icon: newCategoryIcon || "fas fa-tag",
      });

      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso.",
      });

      setNewCategoryName("");
      setNewCategoryType("income");
      setNewCategoryIcon("");
      setIsAddCategoryModalOpen(false);
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
    setEditCategoryIcon(category.icon || "");
    setIsEditCategoryModalOpen(true);
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
        icon: editCategoryIcon || "fas fa-tag",
      });

      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });

      setIsEditCategoryModalOpen(false);
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryType("income");
      setEditCategoryIcon("");
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
      reverseButtons: true
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
          showConfirmButton: false
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
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // Source handlers
  const handleAddSource = async () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da origem é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addSource({
        name: newSourceName.trim(),
      });

      toast({
        title: "Origem adicionada",
        description: "A origem foi adicionada com sucesso.",
      });

      setNewSourceName("");
      setIsAddSourceModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a origem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSource = (source: SourceType) => {
    setEditingSource(source);
    setEditSourceName(source.name);
    setIsEditSourceModalOpen(true);
  };

  const handleUpdateSource = async () => {
    if (!editingSource || !editSourceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da origem é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSource(editingSource.id, {
        name: editSourceName.trim(),
      });

      toast({
        title: "Origem atualizada",
        description: "A origem foi atualizada com sucesso.",
      });

      setIsEditSourceModalOpen(false);
      setEditingSource(null);
      setEditSourceName("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a origem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    const result = await Swal.fire({
      title: 'Excluir Origem',
      text: `Tem certeza que deseja excluir a origem "${sourceName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await deleteSource(sourceId);
        
        toast({
          title: "Origem excluída",
          description: "A origem foi excluída com sucesso.",
        });
        
        Swal.fire({
          title: 'Excluída!',
          text: 'A origem foi excluída com sucesso.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a origem. Tente novamente.",
          variant: "destructive",
        });
        
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível excluir a origem.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // Filter categories by type
  const incomeCategories = categories.filter((cat) => cat.type === "income");
  const expenseCategories = categories.filter((cat) => cat.type === "expense");

  if (categoriesLoading || sourcesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="sources">Origens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Categorias de Receita</CardTitle>
                  <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-success-500 hover:bg-success-600 text-white"
                        size="sm"
                        onClick={() => setNewCategoryType("income")}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
                  <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-danger-500 hover:bg-danger-600 text-white"
                        size="sm"
                        onClick={() => setNewCategoryType("expense")}
                      >
                        <Plus className="w-4 h-4 mr-1" />
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria de despesa</h3>
                    <p>Adicione categorias para organizar suas despesas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Origens de Recursos</CardTitle>
                <Dialog open={isAddSourceModalOpen} onOpenChange={setIsAddSourceModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {sources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{source.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditSource(source)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSource(source.id, source.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma origem cadastrada</h3>
                  <p>Adicione origens para identificar de onde vem seu dinheiro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen}>
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
            <div className="space-y-2">
              <Label htmlFor="category-icon">Ícone</Label>
              <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um ícone">
                    {newCategoryIcon && (
                      <div className="flex items-center">
                        <i className={`${newCategoryIcon} mr-2`}></i>
                        {availableIcons.find(icon => icon.value === newCategoryIcon)?.label}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {getFilteredIcons(newCategoryType).map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center">
                        <i className={`${icon.value} mr-2`}></i>
                        {icon.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddCategoryModalOpen(false)}
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

      {/* Edit Category Modal */}
      <Dialog open={isEditCategoryModalOpen} onOpenChange={setIsEditCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nome da categoria</Label>
              <Input
                id="edit-category-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Ex: Salário, Freelance..."
              />
            </div>
            <div className="space-y-3">
              <Label>Tipo</Label>
              <RadioGroup
                value={editCategoryType}
                onValueChange={(value) => setEditCategoryType(value as "income" | "expense")}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-icon">Ícone</Label>
              <Select value={editCategoryIcon} onValueChange={setEditCategoryIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um ícone">
                    {editCategoryIcon && (
                      <div className="flex items-center">
                        <i className={`${editCategoryIcon} mr-2`}></i>
                        {availableIcons.find(icon => icon.value === editCategoryIcon)?.label}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {getFilteredIcons(editCategoryType).map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center">
                        <i className={`${icon.value} mr-2`}></i>
                        {icon.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditCategoryModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Source Modal */}
      <Dialog open={isAddSourceModalOpen} onOpenChange={setIsAddSourceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Origem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">Nome da origem</Label>
              <Input
                id="source-name"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Ex: Maicon, Gabi, Conjunto..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddSourceModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddSource}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Source Modal */}
      <Dialog open={isEditSourceModalOpen} onOpenChange={setIsEditSourceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Origem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-source-name">Nome da origem</Label>
              <Input
                id="edit-source-name"
                value={editSourceName}
                onChange={(e) => setEditSourceName(e.target.value)}
                placeholder="Ex: Maicon, Gabi, Conjunto..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditSourceModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateSource}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}