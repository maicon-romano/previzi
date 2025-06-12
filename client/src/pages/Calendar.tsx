import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Calendar() {
  const { transactions, isLoading } = useTransactions();
  const [currentDate, setCurrentDate] = useState(new Date());

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month days
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonth.getDate() - i,
      isCurrentMonth: false,
      isPrevMonth: true,
      date: new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isPrevMonth: false,
      date: new Date(currentYear, currentMonth, day),
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isPrevMonth: false,
      date: new Date(currentYear, currentMonth + 1, day),
    });
  }

  // Get transactions for a specific date
  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getDate() === date.getDate() &&
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + direction, 1));
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Calendar Header */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((calendarDay, index) => {
            const dayTransactions = getTransactionsForDate(calendarDay.date);
            const totalIncome = dayTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = dayTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);
            const hasTransactions = dayTransactions.length > 0;

            return (
              <div
                key={index}
                className={`h-24 p-2 border border-gray-100 rounded-lg cursor-pointer transition-colors ${
                  calendarDay.isCurrentMonth
                    ? "hover:bg-gray-50"
                    : "bg-gray-50"
                } ${hasTransactions ? "border-primary/20 bg-primary/5" : ""}`}
              >
                <div className={`text-sm font-medium ${
                  calendarDay.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                }`}>
                  {calendarDay.day}
                </div>
                
                {hasTransactions && (
                  <div className="mt-1 space-y-1">
                    {totalIncome > 0 && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-success-500 rounded-full mr-1"></div>
                        <div className="text-xs text-success-600 truncate">
                          +R${(totalIncome / 1000).toFixed(1)}k
                        </div>
                      </div>
                    )}
                    {totalExpenses > 0 && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-danger-500 rounded-full mr-1"></div>
                        <div className="text-xs text-danger-600 truncate">
                          -R${(totalExpenses / 1000).toFixed(1)}k
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Receitas</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-danger-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Despesas</span>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Resumo do Mês</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600">
                R$ {transactions
                  .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === 'income' && 
                           tDate.getMonth() === currentMonth && 
                           tDate.getFullYear() === currentYear;
                  })
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-success-700 mt-1">Total de Receitas</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-danger-600">
                R$ {transactions
                  .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === 'expense' && 
                           tDate.getMonth() === currentMonth && 
                           tDate.getFullYear() === currentYear;
                  })
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-danger-700 mt-1">Total de Despesas</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {transactions.filter(t => {
                  const tDate = new Date(t.date);
                  return tDate.getMonth() === currentMonth && 
                         tDate.getFullYear() === currentYear;
                }).length}
              </div>
              <div className="text-sm text-blue-700 mt-1">Total de Transações</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
