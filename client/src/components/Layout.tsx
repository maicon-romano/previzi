import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AddTransactionModal from "./AddTransactionModal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
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
    { name: "Previsibilidade", href: "/predictability", icon: "fas fa-chart-line" },
    { name: "Calendário", href: "/calendar", icon: "fas fa-calendar-alt" },
    { name: "Categorias", href: "/categories", icon: "fas fa-tags" },
    { name: "Configurações", href: "/settings", icon: "fas fa-cog" },
  ];

  const getPageInfo = () => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      "/dashboard": { title: "Dashboard", subtitle: "Visão geral das suas finanças" },
      "/transactions": { title: "Transações", subtitle: "Navegue entre os meses e gerencie suas receitas e despesas" },
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
      <div className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-blue-50 to-white shadow-xl border-r border-blue-100 transform transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-16" : "w-64"
      } ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo and Collapse Button */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-blue-100 bg-white/50">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mr-3 shadow-md">
                <i className="fas fa-chart-line text-white text-lg"></i>
              </div>
              {!isSidebarCollapsed && (
                <h1 className="text-xl font-bold text-gray-800">Previzi</h1>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-blue-100 transition-all duration-200 border border-blue-200"
            >
              <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm text-blue-600`}></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
                      }`}
                      title={isSidebarCollapsed ? item.name : ""}
                    >
                      <i className={`${item.icon} ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} text-base ${
                        isActive ? 'text-white' : 'text-blue-600'
                      }`}></i>
                      {!isSidebarCollapsed && (
                        <span className="font-medium">{item.name}</span>
                      )}
                      {isSidebarCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
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
          <div className="px-3 py-4 border-t border-blue-100 bg-white/30">
            {!isSidebarCollapsed ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {currentUser?.displayName || currentUser?.email?.split('@')[0] || "Usuário"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {currentUser?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200"
                >
                  <i className="fas fa-sign-out-alt mr-3 text-red-500"></i>
                  Sair da Conta
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Sair da Conta"
                >
                  <i className="fas fa-sign-out-alt text-sm"></i>
                </button>
              </div>
            )}
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
