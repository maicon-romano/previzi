import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
}

export default function MonthYearPicker({ value, onChange, className = "" }: MonthYearPickerProps) {
  const getMonthName = (monthRef: string) => {
    const [year, month] = monthRef.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className={`text-xl font-bold text-gray-800 capitalize hover:bg-blue-50 px-4 py-2 ${className}`}
        >
          {getMonthName(value)}
          <CalendarDays className="h-4 w-4 ml-2 text-blue-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-center">Selecionar Mês e Ano</h3>
          
          {/* Year selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Ano</label>
            <Select 
              value={value.split('-')[0]} 
              onValueChange={(year) => {
                const month = value.split('-')[1];
                onChange(`${year}-${month}`);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Month selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Mês</label>
            <Select 
              value={value.split('-')[1]} 
              onValueChange={(month) => {
                const year = value.split('-')[0];
                onChange(`${year}-${month}`);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = String(i + 1).padStart(2, '0');
                  const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' });
                  return (
                    <SelectItem key={monthNum} value={monthNum}>
                      {monthName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Quick selection buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const now = new Date();
                onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
              }}
              className="flex-1"
            >
              Mês Atual
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                onChange(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`);
              }}
              className="flex-1"
            >
              Mês Anterior
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}