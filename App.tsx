
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Building2, 
  Bell, 
  Menu,
  Activity,
  UserCheck,
  TrendingUp,
  BrainCircuit,
  Settings,
  Receipt,
  Landmark,
  GripVertical,
  BarChart3,
  ListTodo,
  ClipboardCheck,
  History,
  ShieldCheck,
  X,
  Search,
  FileText
} from 'lucide-react';
import { BRANCHES, MOCK_RESIDENTS, MOCK_STAFF, MOCK_INVOICES } from './constants';
import { BranchType, Resident, Invoice, AuditLog, FeeConfig, InvoiceStatus, Evolution } from './types';
import { StatCard } from './components/StatCard';
import { FinancialChart } from './components/FinancialChart';
import { ReceivablesDashboard } from './components/ReceivablesDashboard';
import { ResidentList } from './components/residents/ResidentList';
import { ResidentProfile } from './components/residents/ResidentProfile';
import { DailyRoutineDashboard } from './components/DailyRoutineDashboard'; 
import { analyzeFinancialHealth } from './services/geminiService';

// --- MOCK LOGGED USER ---
const CURRENT_USER = {
  id: 'stf-1',
  name: 'Enf. Ana Souza',
  role: 'Enfermeira Chefe'
};

function App() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'residents' | 'routine'>('dashboard');
  const [financeView, setFinanceView] = useState<'overview' | 'receivables'>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Data State
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  
  // Audit State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Navigation State
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Drag State
  const [widgetOrder, setWidgetOrder] = useState<string[]>(['kpi', 'chart', 'recent']);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- LOGGING SYSTEM ---
  const logAction = (action: string, details: string, category: AuditLog['category'], residentId?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      action,
      details,
      category,
      residentId,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userRole: CURRENT_USER.role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- FILTERING ---
  const filteredResidents = useMemo(() => {
    return selectedBranchId === 'all' 
      ? residents 
      : residents.filter(r => r.branchId === selectedBranchId);
  }, [selectedBranchId, residents]);

  const filteredStaff = useMemo(() => {
    return selectedBranchId === 'all'
      ? MOCK_STAFF
      : MOCK_STAFF.filter(s => s.branchId === selectedBranchId);
  }, [selectedBranchId]);

  const filteredInvoices = useMemo(() => {
    if (selectedBranchId === 'all') return invoices;
    const branchResidentIds = filteredResidents.map(r => r.id);
    return invoices.filter(inv => 
      (inv.type === 'expense' && inv.branchId === selectedBranchId) ||
      (inv.residentId && branchResidentIds.includes(inv.residentId))
    );
  }, [selectedBranchId, filteredResidents, invoices]);

  // --- STATS & CHARTS ---
  const financialStats = useMemo(() => {
    const currentMonth = 10; 
    const currentYear = 2023;
    const currentMonthInvoices = filteredInvoices.filter(inv => inv.month === currentMonth && inv.year === currentYear);

    const revenue = currentMonthInvoices.filter(i => i.type === 'income').reduce((acc, curr) => acc + curr.totalAmount, 0);
    const expenses = currentMonthInvoices.filter(i => i.type === 'expense').reduce((acc, curr) => acc + curr.totalAmount, 0);

    return {
      residents: filteredResidents.length,
      staff: filteredStaff.length,
      occupancy: Math.round((filteredResidents.length / (selectedBranchId === 'all' ? 60 : selectedBranchId === 'b1' ? 40 : 20)) * 100),
      revenue,
      expenses,
      net: revenue - expenses
    };
  }, [filteredResidents, filteredInvoices, filteredStaff, selectedBranchId]);

  const chartData = useMemo(() => {
    const map = new Map<string, { name: string; receita: number; despesa: number }>();
    const months = ['Ago', 'Set', 'Out'];
    months.forEach(m => map.set(m, { name: m, receita: 0, despesa: 0 }));

    filteredInvoices.forEach(inv => {
      let monthName = '';
      if (inv.month === 8) monthName = 'Ago';
      if (inv.month === 9) monthName = 'Set';
      if (inv.month === 10) monthName = 'Out';
      
      if (monthName && map.has(monthName)) {
        const entry = map.get(monthName)!;
        if (inv.type === 'income') entry.receita += inv.totalAmount;
        else entry.despesa += inv.totalAmount;
      }
    });

    return Array.from(map.values());
  }, [filteredInvoices]);

  const recentExpenses = useMemo(() => {
    return filteredInvoices
      .filter(inv => inv.type === 'expense')
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 5);
  }, [filteredInvoices]);

  // --- HANDLERS ---
  const handleAiAnalysis = async () => {
    setIsLoadingAi(true);
    setAiInsight(null);
    const branchName = selectedBranchId === 'all' ? 'Todas as Unidades' : BRANCHES.find(b => b.id === selectedBranchId)?.name || '';
    
    const aiData = filteredInvoices.map(inv => ({
      id: inv.id,
      description: inv.items[0]?.description || 'N/A',
      amount: inv.totalAmount,
      type: inv.type,
      category: inv.items[0]?.category || 'outros',
      date: inv.dueDate,
      branchId: inv.branchId || '',
      isRecurring: true
    }));

    const insight = await analyzeFinancialHealth(aiData, branchName);
    setAiInsight(insight);
    setIsLoadingAi(false);
  };

  const handleUpdateInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
  };

  const handleUpdateResident = (updatedResident: Resident) => {
    const updatedList = residents.map(r => r.id === updatedResident.id ? updatedResident : r);
    setResidents(updatedList);
    if (selectedResident && selectedResident.id === updatedResident.id) {
        setSelectedResident(updatedResident);
    }
  };

  const handleAddEvolution = (residentId: string, content: string, type: Evolution['type']) => {
    const today = new Date();
    const dateString = `${today.getDate()}/${today.getMonth()+1} ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    const newEvolution: Evolution = {
        id: `ev-${Date.now()}-${Math.random()}`,
        date: dateString,
        author: CURRENT_USER.name,
        role: CURRENT_USER.role,
        content: content,
        type: type
    };

    const updatedList = residents.map(r => {
        if (r.id === residentId) {
            return {
                ...r,
                evolutions: [newEvolution, ...(r.evolutions || [])]
            };
        }
        return r;
    });
    setResidents(updatedList);
    
    if (selectedResident && selectedResident.id === residentId) {
        setSelectedResident({ ...selectedResident, evolutions: [newEvolution, ...(selectedResident.evolutions || [])] });
    }
  };

  const handleUpdateResidentFee = (residentId: string, newFeeConfig: FeeConfig, updatePendingInvoices: boolean) => {
    const updatedList = residents.map(r => {
        if (r.id === residentId) {
            return { 
                ...r, 
                feeConfig: newFeeConfig,
                benefitValue: newFeeConfig.baseValue + newFeeConfig.careLevelAdjustment + newFeeConfig.fixedExtras - newFeeConfig.discount 
            };
        }
        return r;
    });
    setResidents(updatedList);
    
    const targetResident = updatedList.find(r => r.id === residentId);
    if (selectedResident && selectedResident.id === residentId) {
        setSelectedResident(targetResident || null);
    }

    if (updatePendingInvoices) {
        const newTotal = newFeeConfig.baseValue + newFeeConfig.careLevelAdjustment + newFeeConfig.fixedExtras - newFeeConfig.discount;
        const updatedInvoices = invoices.map(inv => {
            if (inv.residentId === residentId && inv.type === 'income' && inv.status === InvoiceStatus.PENDING) {
                const updatedItems = inv.items.map(item => {
                    if (item.category === 'mensalidade') {
                        return { ...item, amount: newTotal };
                    }
                    return item;
                });
                const newInvoiceTotal = updatedItems.reduce((acc, curr) => acc + curr.amount, 0);
                return { ...inv, items: updatedItems, totalAmount: newInvoiceTotal };
            }
            return inv;
        });
        setInvoices([...updatedInvoices]);
        logAction('Atualização Financeira', `Atualizou contrato e faturas pendentes de ${targetResident?.name}`, 'financial', residentId);
    } else {
        logAction('Atualização Contratual', `Atualizou configuração de mensalidade de ${targetResident?.name}`, 'financial', residentId);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // --- DRAG HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.currentTarget.style.opacity = '0.4';
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    if (dragItem.current !== null && dragOverItem.current !== null) {
        const copyListItems = [...widgetOrder];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        setWidgetOrder(copyListItems);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // --- WIDGET RENDERER ---
  const renderWidget = (key: string) => {
    switch (key) {
      case 'kpi':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <StatCard title="Receita Mensal" value={formatCurrency(financialStats.revenue)} icon={<TrendingUp className="w-6 h-6" />} color="green" trend="+12%" trendUp={true} />
            <StatCard title="Despesas" value={formatCurrency(financialStats.expenses)} icon={<Wallet className="w-6 h-6" />} color="red" trend="-2%" trendUp={true} />
            <StatCard title="Resultado Líquido" value={formatCurrency(financialStats.net)} icon={<Activity className="w-6 h-6" />} color="blue" />
          </div>
        );
      case 'chart':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" /> Evolução Financeira
            </h3>
            <FinancialChart data={chartData} />
          </div>
        );
      case 'recent':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-400" /> Últimas Despesas
            </h3>
            {recentExpenses.length > 0 ? (
              <ul className="space-y-0">
                {recentExpenses.map(inv => (
                  <li key={inv.id} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800">{inv.items[0]?.description}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{inv.items[0]?.category}</p>
                    </div>
                    <div className="text-right">
                       <span className="font-bold text-red-600 block">- {formatCurrency(inv.totalAmount)}</span>
                       <span className="text-xs text-gray-400">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma despesa recente.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const NavItems = () => (
    <nav className="space-y-2">
      <button 
        onClick={() => { setActiveTab('dashboard'); setSelectedResident(null); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="font-medium">Visão Geral</span>
      </button>
      <button 
        onClick={() => { setActiveTab('routine'); setSelectedResident(null); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === 'routine' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
        <ClipboardCheck className="w-5 h-5" />
        <span className="font-medium">Rotina Diária</span>
      </button>
      <button 
        onClick={() => { setActiveTab('residents'); setSelectedResident(null); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === 'residents' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
        <Users className="w-5 h-5" />
        <span className="font-medium">Residentes</span>
      </button>
      <button 
          onClick={() => { setActiveTab('finance'); setSelectedResident(null); setIsMobileSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
        <Wallet className="w-5 h-5" />
        <span className="font-medium">Financeiro</span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-x-hidden relative">
      
      {/* --- MOBILE SIDEBAR (DRAWER) --- */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            {/* Sidebar content */}
            <div className="absolute top-0 left-0 bottom-0 w-72 bg-slate-900 text-white shadow-2xl animate-in slide-in-from-left duration-300">
               <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold tracking-tight">AppCare</span>
                    </div>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <NavItems />

                  <div className="mt-auto pt-6 border-t border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 text-slate-300 font-bold">
                        AS
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{CURRENT_USER.name}</p>
                        <p className="text-xs text-slate-400">{CURRENT_USER.role}</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
        </div>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AppCare</span>
          </div>
          <NavItems />
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 text-slate-300 font-bold">
              AS
            </div>
            <div>
              <p className="text-sm font-medium text-white">{CURRENT_USER.name}</p>
              <p className="text-xs text-slate-400">{CURRENT_USER.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F4F6]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsMobileSidebarOpen(true)}
               className="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
             >
               <Menu className="w-6 h-6" />
             </button>
             
             {/* Branch Selector */}
             <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button 
                  onClick={() => setSelectedBranchId('all')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${selectedBranchId === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Consolidado
                </button>
                {BRANCHES.map(branch => (
                  <button 
                    key={branch.id}
                    onClick={() => setSelectedBranchId(branch.id)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${selectedBranchId === branch.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {branch.type}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audit Button */}
            <button 
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              title="Histórico / Auditoria"
            >
               <History className="w-5 h-5" />
               <span className="hidden lg:inline text-sm font-medium">Auditoria</span>
            </button>

            <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <button className="hidden sm:block p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          
          {/* Header Section */}
          {!selectedResident && activeTab !== 'routine' && (
             <div className="mb-6 sm:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {activeTab === 'finance' ? 'Departamento Financeiro' : 
                  activeTab === 'residents' ? 'Gestão de Residentes' :
                  selectedBranchId === 'all' ? 'Visão Geral Consolidada' : BRANCHES.find(b => b.id === selectedBranchId)?.name}
                </h1>
                <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-lg">
                  {activeTab === 'finance' ? 'Gestão de fluxo de caixa, receitas e despesas.' : 'Acompanhamento em tempo real da operação.'}
                </p>
              </div>
              
              {activeTab === 'dashboard' && (
                <button 
                  onClick={handleAiAnalysis}
                  disabled={isLoadingAi}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-70 font-medium"
                >
                  <BrainCircuit className="w-5 h-5" />
                  {isLoadingAi ? 'Analisando...' : 'Gerar Análise IA'}
                </button>
              )}
            </div>
          )}

          {/* ROUTINE TAB CONTENT */}
          {activeTab === 'routine' && !selectedResident && (
            <DailyRoutineDashboard 
               residents={filteredResidents}
               onUpdateResident={handleUpdateResident}
               onLogAction={logAction}
               onAddEvolution={handleAddEvolution}
            />
          )}

          {/* FINANCE TAB CONTENT */}
          {activeTab === 'finance' && !selectedResident && (
             <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setFinanceView('overview')} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${financeView === 'overview' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-transparent bg-white hover:bg-gray-50'}`}>
                    <div className={`p-4 rounded-xl ${financeView === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}><TrendingUp className="w-6 h-6" /></div>
                    <div className="min-w-0"><h3 className={`font-bold text-lg truncate ${financeView === 'overview' ? 'text-blue-900' : 'text-gray-700'}`}>Fluxo de Caixa</h3><p className="text-sm text-gray-500 truncate">Dashboards e KPIs</p></div>
                  </button>
                  <button onClick={() => setFinanceView('receivables')} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${financeView === 'receivables' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-transparent bg-white hover:bg-gray-50'}`}>
                    <div className={`p-4 rounded-xl ${financeView === 'receivables' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}><ListTodo className="w-6 h-6" /></div>
                    <div className="min-w-0"><h3 className={`font-bold text-lg truncate ${financeView === 'receivables' ? 'text-blue-900' : 'text-gray-700'}`}>Faturas & Despesas</h3><p className="text-sm text-gray-500 truncate">Controle diário</p></div>
                  </button>
                </div>
                {financeView === 'overview' ? (
                   <div className="flex flex-col gap-6 sm:gap-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><h2 className="text-xl font-bold text-gray-800">Painéis de Controle</h2><p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm w-fit"><GripVertical className="w-4 h-4 text-gray-400" /> Arraste para reorganizar</p></div>
                      {widgetOrder.map((key, index) => (
                        <div key={key} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="relative group transition-all duration-200 cursor-move rounded-xl hover:ring-2 hover:ring-blue-400 hover:ring-offset-2">
                          <div className="absolute top-4 right-4 p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 hover:bg-gray-100 rounded-lg z-10 cursor-grab active:cursor-grabbing transition-opacity hidden md:block"><GripVertical className="w-6 h-6" /></div>
                          {renderWidget(key)}
                        </div>
                      ))}
                   </div>
                ) : (
                   <ReceivablesDashboard invoices={filteredInvoices} residents={filteredResidents} onUpdateInvoices={handleUpdateInvoices} allInvoices={invoices} />
                )}
             </div>
          )}

          {/* DASHBOARD TAB CONTENT */}
          {activeTab === 'dashboard' && !selectedResident && (
            <>
              {aiInsight && (
                <div className="mb-6 sm:mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-4 sm:p-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 hidden sm:block"><BrainCircuit className="w-32 h-32 text-indigo-600" /></div>
                   <h3 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2"><BrainCircuit className="w-5 h-5" /> Insight do Gemini AI</h3>
                   <p className="text-indigo-800 whitespace-pre-line text-sm leading-relaxed max-w-3xl">{aiInsight}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard title="Receita Mensal" value={formatCurrency(financialStats.revenue)} icon={<TrendingUp className="w-6 h-6" />} color="green" trend="+12%" trendUp={true} />
                <StatCard title="Despesas" value={formatCurrency(financialStats.expenses)} icon={<Wallet className="w-6 h-6" />} color="red" trend="-2%" trendUp={true} />
                <StatCard title="Residentes" value={financialStats.residents} icon={<UserCheck className="w-6 h-6" />} color="blue" trend="95% Ocupação" trendUp={true} />
                <StatCard title="Equipe Ativa" value={financialStats.staff} icon={<Users className="w-6 h-6" />} color="purple" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px]"><h3 className="text-lg font-semibold text-gray-900 mb-6">Fluxo de Caixa (Trimestral)</h3><FinancialChart data={chartData} /></div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Ocupação</h3>
                  <div className="space-y-4">
                     <div className="p-4 bg-gray-50 rounded-lg"><div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">Taxa de Ocupação</span><span className="font-bold text-gray-900">{financialStats.occupancy}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${financialStats.occupancy}%` }}></div></div></div>
                     <div><h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Alertas Recentes</h4>
                       <ul className="space-y-3">
                         {filteredResidents.filter(r => r.status === 'Hospitalizado').map(r => (
                           <li key={r.id} className="flex items-start gap-3 text-sm"><span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"></span><div><p className="font-medium text-gray-900">{r.name}</p><p className="text-gray-500 text-xs">Hospitalizado - Requer atenção</p></div></li>
                         ))}
                         {filteredResidents.filter(r => r.status === 'Hospitalizado').length === 0 && <li className="text-sm text-gray-500">Nenhum alerta crítico no momento.</li>}
                       </ul>
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RESIDENTS TAB */}
          {activeTab === 'residents' && (
             selectedResident ? (
               <ResidentProfile 
                  resident={selectedResident} 
                  onBack={() => setSelectedResident(null)} 
                  onUpdateResident={handleUpdateResident} 
                  invoices={invoices} 
                  onLogAction={logAction}
                  onUpdateFee={handleUpdateResidentFee}
                />
             ) : (
               <ResidentList residents={filteredResidents} branches={BRANCHES} onSelect={setSelectedResident} />
             )
          )}

        </div>
      </main>
      
      {/* --- AUDIT MODAL --- */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 bg-indigo-100 rounded-xl text-indigo-700"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Auditoria & Rastreabilidade</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Registro completo de ações no sistema.</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAuditModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <div className="flex-1 overflow-auto p-0">
                 {auditLogs.length > 0 ? (
                    <div className="min-w-full overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-gray-500 font-bold uppercase text-[10px] sm:text-xs sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="px-4 sm:px-6 py-4">Data / Hora</th>
                                <th className="px-4 sm:px-6 py-4">Usuário</th>
                                <th className="px-4 sm:px-6 py-4">Ação</th>
                                <th className="px-4 sm:px-6 py-4">Detalhes</th>
                                <th className="px-4 sm:px-6 py-4">Categoria</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4 text-gray-500 font-medium">
                                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                            {log.userName.charAt(0)}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="font-bold text-gray-900">{log.userName}</p>
                                            <p className="text-[10px] text-gray-400">{log.userRole}</p>
                                        </div>
                                    </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 font-bold text-gray-800">{log.action}</td>
                                    <td className="px-4 sm:px-6 py-4 text-gray-600 max-w-xs truncate">{log.details}</td>
                                    <td className="px-4 sm:px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${log.category === 'medical' ? 'bg-blue-50 text-blue-700' :
                                        log.category === 'financial' ? 'bg-green-50 text-green-700' :
                                        log.category === 'operational' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {log.category}
                                    </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                       <FileText className="w-12 h-12 mb-3 text-gray-200" />
                       <p className="font-medium">Nenhum registro de auditoria encontrado ainda.</p>
                       <p className="text-xs mt-1">Realize ações no sistema para gerar logs.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

export default App;
