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
        {/* Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Legenda do Calendário</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center">
              <div className="flex items-center bg-green-100 rounded px-2 py-1 mr-2">
                <i className="fas fa-arrow-up text-green-600 text-xs mr-1"></i>
                <span className="text-green-700 font-medium">2</span>
              </div>
              <span className="text-gray-600">Receitas (quantidade + valor)</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center bg-red-100 rounded px-2 py-1 mr-2">
                <i className="fas fa-arrow-down text-red-600 text-xs mr-1"></i>
                <span className="text-red-700 font-medium">3</span>
              </div>
              <span className="text-gray-600">Despesas (quantidade + valor)</span>
            </div>
            <div className="flex items-center">
              <div className="text-green-600 font-bold mr-2">+R$ 1.500</div>
              <span className="text-gray-600">Saldo líquido do dia</span>
            </div>
          </div>
        </div>

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
              .filter(t => t.type === 'income' && t.amount !== null)
              .reduce((sum, t) => sum + (t.amount || 0), 0);
            const totalExpenses = dayTransactions
              .filter(t => t.type === 'expense' && t.amount !== null)
              .reduce((sum, t) => sum + (t.amount || 0), 0);
            const hasTransactions = dayTransactions.length > 0;

            return (
              <div
                key={index}
                className={`h-32 p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                  calendarDay.isCurrentMonth
                    ? hasTransactions 
                      ? "border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                    : "bg-gray-100 border-gray-300"
                } ${hasTransactions ? "transform hover:scale-105" : ""}`}
              >
                <div className={`text-sm font-semibold mb-2 ${
                  calendarDay.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                }`}>
                  {calendarDay.day}
                </div>
                
                {hasTransactions && (
                  <div className="space-y-1">
                    {/* Income Section */}
                    {totalIncome > 0 && (
                      <div className="flex items-center justify-between bg-green-100 rounded px-1 py-0.5">
                        <div className="flex items-center">
                          <i className="fas fa-arrow-up text-green-600 text-xs mr-1"></i>
                          <span className="text-xs font-medium text-green-700">
                            {dayTransactions.filter(t => t.type === 'income').length}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-green-600">
                          R$ {totalIncome >= 1000 
                            ? `${(totalIncome / 1000).toFixed(1)}k` 
                            : totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                          }
                        </div>
                      </div>
                    )}
                    
                    {/* Expense Section */}
                    {totalExpenses > 0 && (
                      <div className="flex items-center justify-between bg-red-100 rounded px-1 py-0.5">
                        <div className="flex items-center">
                          <i className="fas fa-arrow-down text-red-600 text-xs mr-1"></i>
                          <span className="text-xs font-medium text-red-700">
                            {dayTransactions.filter(t => t.type === 'expense').length}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-red-600">
                          R$ {totalExpenses >= 1000 
                            ? `${(totalExpenses / 1000).toFixed(1)}k` 
                            : totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                          }
                        </div>
                      </div>
                    )}
                    
                    {/* Net Balance Indicator */}
                    {(totalIncome > 0 || totalExpenses > 0) && (
                      <div className={`text-center text-xs font-bold ${
                        totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {totalIncome - totalExpenses >= 0 ? '+' : ''}R$ {(totalIncome - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                  .reduce((sum, t) => sum + (t.amount || 0), 0)
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
                  .reduce((sum, t) => sum + (t.amount || 0), 0)
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
