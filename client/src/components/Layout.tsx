import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import AddTransactionModal from "./AddTransactionModal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, logout } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "fas fa-home" },
    { name: "Transações", href: "/transactions", icon: "fas fa-exchange-alt" },
    { name: "Previsibilidade", href: "/predictability", icon: "fas fa-crystal-ball" },
    { name: "Calendário", href: "/calendar", icon: "fas fa-calendar-alt" },
    { name: "Categorias", href: "/categories", icon: "fas fa-tags" },
    { name: "Configurações", href: "/settings", icon: "fas fa-cog" },
  ];

  const getPageInfo = () => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      "/dashboard": { title: "Dashboard", subtitle: "Visão geral das suas finanças" },
      "/transactions": { title: "Transações", subtitle: "Gerencie suas receitas e despesas" },
      "/predictability": { title: "Previsibilidade", subtitle: "Projeções e planejamento financeiro" },
      "/calendar": { title: "Calendário", subtitle: "Visualização mensal das transações" },
      "/categories": { title: "Categorias", subtitle: "Organize suas categorias de receitas e despesas" },
      "/settings": { title: "Configurações", subtitle: "Personalize sua experiência" },
    };
    return titles[location] || titles["/dashboard"];
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg border-r border-gray-200 transform transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-16" : "w-64"
      } ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo and Collapse Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg mr-2">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              {!isSidebarCollapsed && (
                <h1 className="text-lg font-bold text-gray-900">Previzi</h1>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex w-6 h-6 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            >
              <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-xs text-gray-500`}></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      title={isSidebarCollapsed ? item.name : ""}
                    >
                      <i className={`${item.icon} ${isSidebarCollapsed ? 'mx-auto' : 'mr-2'} text-sm`}></i>
                      {!isSidebarCollapsed && item.name}
                      {isSidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary text-sm"></i>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.displayName || "Usuário"}
                </p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-white p-2 rounded-lg shadow-md"
        >
          <i className="fas fa-bars text-gray-600"></i>
        </button>
      </div>

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} min-h-screen transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageInfo.title}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{pageInfo.subtitle}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <i className="fas fa-plus mr-1 text-xs"></i>
                Nova Transação
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4">{children}</main>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
