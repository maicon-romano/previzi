import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    name: currentUser?.displayName || "",
    email: currentUser?.email || "",
    reminderTime: "09:00",
    billReminders: true,
    monthlyReport: false,
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would save these settings to Firestore
      // await updateUserSettings(currentUser.uid, settings);
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleSettingChange("name", e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500">
                O email não pode ser alterado após o cadastro
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-900">Lembrete de vencimentos</h4>
              <p className="text-sm text-gray-500">Receba notificações antes dos vencimentos</p>
            </div>
            <Switch
              checked={settings.billReminders}
              onCheckedChange={(checked) => handleSettingChange("billReminders", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-900">Resumo mensal</h4>
              <p className="text-sm text-gray-500">Relatório financeiro no final do mês</p>
            </div>
            <Switch
              checked={settings.monthlyReport}
              onCheckedChange={(checked) => handleSettingChange("monthlyReport", checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Horário das notificações</Label>
            <Select
              value={settings.reminderTime}
              onValueChange={(value) => handleSettingChange("reminderTime", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="07:00">07:00</SelectItem>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
                <SelectItem value="12:00">12:00</SelectItem>
                <SelectItem value="18:00">18:00</SelectItem>
                <SelectItem value="20:00">20:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plan Information */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Plano Atual</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Plano Básico</h4>
              <p className="text-sm text-gray-500">Gratuito para sempre</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-800">
              Ativo
            </span>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-check text-success-500 mr-3"></i>
              <span>Transações ilimitadas</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-check text-success-500 mr-3"></i>
              <span>Relatórios básicos</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-check text-success-500 mr-3"></i>
              <span>Projeções financeiras</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-check text-success-500 mr-3"></i>
              <span>Suporte por email</span>
            </div>
          </div>
          
          <Button variant="outline" disabled>
            <i className="fas fa-crown mr-2"></i>
            Plano Premium em breve
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Alterar senha</h4>
                <p className="text-sm text-gray-500">
                  Última alteração: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Alterar
              </Button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Autenticação de dois fatores</h4>
                <p className="text-sm text-gray-500">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Em breve
              </Button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Exportar dados</h4>
                <p className="text-sm text-gray-500">
                  Baixe uma cópia dos seus dados financeiros
                </p>
              </div>
              <Button variant="outline" size="sm">
                <i className="fas fa-download mr-2"></i>
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Salvando...
            </>
          ) : (
            <>
              <i className="fas fa-save mr-2"></i>
              Salvar alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
