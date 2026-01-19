
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, ClipboardCheck, History, LogOut, Menu, Activity, X, Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useData } from '../../contexts/DataContext.tsx';
import { BRANCHES } from '../../constants.ts';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedBranchId, setSelectedBranchId } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/rotina', label: 'Rotina Diária', icon: ClipboardCheck },
    { path: '/residentes', label: 'Residentes', icon: Users },
    { path: '/rh', label: 'Equipe', icon: Briefcase },
    { path: '/financeiro', label: 'Financeiro', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-x-hidden relative">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col p-6 shadow-xl z-20">
        <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
          <Activity className="text-blue-500" />
          <span className="text-xl font-bold">AppCare</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 
                ${location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F4F6]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2.5 text-gray-600 border rounded-xl">
              <Menu />
            </button>
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border">
              <button 
                onClick={() => setSelectedBranchId('all')} 
                className={`px-3 py-2 text-sm rounded-lg transition-all ${selectedBranchId === 'all' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500'}`}
              >
                Consolidado
              </button>
              {BRANCHES.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => setSelectedBranchId(b.id)} 
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${selectedBranchId === b.id ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500'}`}
                >
                  {b.type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-gray-900 leading-none">{user?.name}</span>
              <span className="text-xs text-gray-400 mt-1">{user?.role}</span>
            </div>
            <button className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <History className="w-5 h-5" /> 
              <span className="hidden lg:inline">Auditoria</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] md:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
          <div className="w-64 bg-slate-900 h-full p-6 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3"><Activity className="text-blue-500"/><span className="text-xl font-bold text-white">AppCare</span></div>
                <button onClick={() => setIsMobileSidebarOpen(false)}><X className="text-white"/></button>
             </div>
             <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 
                    ${location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
             </nav>
          </div>
        </div>
      )}
    </div>
  );
};
