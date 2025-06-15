import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Target } from "lucide-react";
import { toast } from "sonner";

export type SimulatedItem = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  start: Date;
  end: Date | null; // null = infinite
  enabled: boolean;
};

interface ScenarioSimulatorProps {
  scenarios: SimulatedItem[];
  onScenariosChange: (scenarios: SimulatedItem[]) => void;
}

export default function ScenarioSimulator({ scenarios, onScenariosChange }: ScenarioSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    start: '',
    end: '',
    isInfinite: false
  });

  const resetForm = () => {
    setFormData({
      type: 'income',
      description: '',
      amount: '',
      start: '',
      end: '',
      isInfinite: false
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    
    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }
    
    if (!formData.start) {
      toast.error("Data de início é obrigatória");
      return;
    }
    
    const startDate = new Date(formData.start);
    let endDate: Date | null = null;
    
    if (!formData.isInfinite && formData.end) {
      endDate = new Date(formData.end);
      if (endDate <= startDate) {
        toast.error("Data de fim deve ser posterior à data de início");
        return;
      }
    }

    const newScenario: SimulatedItem = {
      id: crypto.randomUUID(),
      type: formData.type,
      description: formData.description.trim(),
      amount,
      start: startDate,
      end: endDate,
      enabled: true
    };

    onScenariosChange([...scenarios, newScenario]);
    resetForm();
    toast.success("Cenário adicionado com sucesso!");
  };

  const removeScenario = (id: string) => {
    onScenariosChange(scenarios.filter(s => s.id !== id));
    toast.success("Cenário removido");
  };

  const toggleScenario = (id: string) => {
    onScenariosChange(
      scenarios.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const activeScenarios = scenarios.filter(s => s.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          🔮 Cenários ({activeScenarios.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Simulador "E se...?"
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form to add new scenario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Novo Cenário</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Freelance mensal, Aluguel novo..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="start">Data de Início</Label>
                  <Input
                    id="start"
                    type="date"
                    value={formData.start}
                    onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="infinite"
                    checked={formData.isInfinite}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isInfinite: checked, end: checked ? '' : prev.end }))}
                  />
                  <Label htmlFor="infinite">Cenário infinito</Label>
                </div>

                {!formData.isInfinite && (
                  <div>
                    <Label htmlFor="end">Data de Fim</Label>
                    <Input
                      id="end"
                      type="date"
                      value={formData.end}
                      onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cenário
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List of existing scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cenários Ativos ({scenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {scenarios.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum cenário criado ainda.
                  <br />
                  Use o formulário ao lado para simular "E se...?"
                </p>
              ) : (
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`p-3 border rounded-lg ${scenario.enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={scenario.enabled}
                            onCheckedChange={() => toggleScenario(scenario.id)}
                          />
                          <Badge variant={scenario.type === 'income' ? 'default' : 'destructive'}>
                            {scenario.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScenario(scenario.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1">{scenario.description}</h4>
                      <p className="text-sm text-gray-600">
                        R$ {scenario.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {scenario.start.toLocaleDateString('pt-BR')} → {' '}
                        {scenario.end ? scenario.end.toLocaleDateString('pt-BR') : 'Infinito'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}