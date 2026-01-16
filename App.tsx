
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, Wallet, Building2, Bell, Menu, Activity,
  UserCheck, TrendingUp, BrainCircuit, Settings, Receipt, Landmark,
  GripVertical, BarChart3, ListTodo, ClipboardCheck, History, ShieldCheck,
  X, Search, FileText
} from 'lucide-react';
import { 
  BRANCHES, MOCK_RESIDENTS, MOCK_STAFF, MOCK_INVOICES, 
  MOCK_PRESCRIPTIONS, MOCK_STOCK, MOCK_EVOLUTIONS, MOCK_DOCUMENTS 
} from './constants';
import { 
  BranchType, Resident, Invoice, AuditLog, FeeConfig, 
  InvoiceStatus, Evolution, Prescription, StockItem, ResidentDocument 
} from './types';
import { StatCard } from './components/StatCard';
import { FinancialChart } from './components/FinancialChart';
import { ReceivablesDashboard } from './components/ReceivablesDashboard';
import { ResidentList } from './components/residents/ResidentList';
import { ResidentProfile } from './components/residents/ResidentProfile';
import { DailyRoutineDashboard } from './components/DailyRoutineDashboard'; 
import { analyzeFinancialHealth } from './services/geminiService';

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
  
  // --- STATE (Independent Tables) ---
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [stockItems, setStockItems] = useState<StockItem[]>(MOCK_STOCK);
  const [evolutions, setEvolutions] = useState<Evolution[]>(MOCK_EVOLUTIONS);
  const [documents, setDocuments] = useState<ResidentDocument[]>(MOCK_DOCUMENTS);
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Widget Order state
  const [widgetOrder, setWidgetOrder] = useState<string[]>(['kpi', 'chart', 'recent']);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- DERIVED STATE ---
  const selectedResident = useMemo(() => 
    residents.find(r => r.id === selectedResidentId) || null, 
  [residents, selectedResidentId]);

  const filteredResidents = useMemo(() => {
    return selectedBranchId === 'all' ? residents : residents.filter(r => r.branchId === selectedBranchId);
  }, [selectedBranchId, residents]);

  const filteredStaff = useMemo(() => {
    return selectedBranchId === 'all' ? MOCK_STAFF : MOCK_STAFF.filter(s => s.branchId === selectedBranchId);
  }, [selectedBranchId]);

  const filteredInvoices = useMemo(() => {
    if (selectedBranchId === 'all') return invoices;
    const branchResidentIds = filteredResidents.map(r => r.id);
    return invoices.filter(inv => 
      (inv.type === 'expense' && inv.branchId === selectedBranchId) ||
      (inv.residentId && branchResidentIds.includes(inv.residentId))
    );
  }, [selectedBranchId, filteredResidents, invoices]);

  // --- LOGGING ---
  const logAction = (action: string, details: string, category: AuditLog['category'], resId?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action, details, category, residentId: resId,
      userId: CURRENT_USER.id, userName: CURRENT_USER.name, userRole: CURRENT_USER.role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- HANDLERS ---
  const handleUpdateResident = (updated: Resident) => {
    setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleUpdatePrescriptions = (updated: Prescription[]) => {
      // Aqui substituímos as prescrições do residente específico
      const residentId = updated[0]?.residentId;
      if (!residentId) return;
      setPrescriptions(prev => [
          ...prev.filter(p => p.residentId !== residentId),
          ...updated
      ]);
  };

  const handleUpdateStock = (updated: StockItem[]) => {
    const residentId = updated[0]?.residentId;
    if (!residentId) return;
    setStockItems(prev => [
        ...prev.filter(s => s.residentId !== residentId),
        ...updated
    ]);
  };

  const handleUpdateDocuments = (updated: ResidentDocument[]) => {
    const residentId = updated[0]?.residentId;
    if (!residentId) return;
    setDocuments(prev => [
        ...prev.filter(d => d.residentId !== residentId),
        ...updated
    ]);
  };

  const handleAddEvolution = (resId: string, content: string, type: Evolution['type']) => {
    const newEv: Evolution = {
        id: `ev-${Date.now()}`,
        residentId: resId,
        date: new Date().toLocaleString('pt-BR'),
        author: CURRENT_USER.name,
        role: CURRENT_USER.role,
        content,
        type
    };
    setEvolutions(prev => [newEv, ...prev]);
  };

  const handleUpdateResidentFee = (resId: string, newFee: FeeConfig, updatePending: boolean) => {
    setResidents(prev => prev.map(r => r.id === resId ? { ...r, feeConfig: newFee } : r));
    // Lógica de faturas permaneceria similar ao anterior, mas buscando em `invoices` state
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Widget management
  const renderWidget = (key: string) => {
    const stats = { revenue: 50000, expenses: 30000, net: 20000 }; // Mocked for brevity
    switch (key) {
      case 'kpi': return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full"><StatCard title="Receita" value={formatCurrency(stats.revenue)} icon={<TrendingUp />} color="green" /><StatCard title="Despesas" value={formatCurrency(stats.expenses)} icon={<Wallet />} color="red" /><StatCard title="Líquido" value={formatCurrency(stats.net)} icon={<Activity />} color="blue" /></div>;
      case 'chart': return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full"><h3 className="font-semibold mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Evolução</h3><FinancialChart data={[]} /></div>;
      case 'recent': return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full"><h3 className="font-semibold mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> Despesas</h3><p className="text-sm text-gray-400">Ver histórico financeiro para detalhes.</p></div>;
      default: return null;
    }
  };

  const NavItems = () => (
    <nav className="space-y-2">
      {['dashboard', 'routine', 'residents', 'finance'].map((tab) => (
        <button key={tab} onClick={() => { setActiveTab(tab as any); setSelectedResidentId(null); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          {tab === 'dashboard' && <LayoutDashboard className="w-5 h-5" />}
          {tab === 'routine' && <ClipboardCheck className="w-5 h-5" />}
          {tab === 'residents' && <Users className="w-5 h-5" />}
          {tab === 'finance' && <Wallet className="w-5 h-5" />}
          <span className="font-medium capitalize">{tab === 'finance' ? 'Financeiro' : tab.replace('routine', 'Rotina Diária')}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-x-hidden relative">
      
      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)}/>
            <div className="absolute top-0 left-0 bottom-0 w-72 bg-slate-900 text-white p-6 flex flex-col shadow-2xl animate-in slide-in-from-left">
               <div className="flex items-center justify-between mb-10"><h2 className="text-xl font-bold">AppCare</h2><button onClick={() => setIsMobileSidebarOpen(false)}><X /></button></div>
               <NavItems />
            </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col p-6 shadow-xl z-20">
          <div className="flex items-center gap-3 mb-10"><Activity className="text-blue-500"/><span className="text-xl font-bold">AppCare</span></div>
          <NavItems />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F4F6]">
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2.5 text-gray-600 border rounded-xl"><Menu /></button>
             <div className="flex items-center bg-gray-100 p-1 rounded-xl border">
                <button onClick={() => setSelectedBranchId('all')} className={`px-3 py-2 text-sm rounded-lg transition-all ${selectedBranchId === 'all' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500'}`}>Consolidado</button>
                {BRANCHES.map(b => <button key={b.id} onClick={() => setSelectedBranchId(b.id)} className={`px-3 py-2 text-sm rounded-lg transition-all ${selectedBranchId === b.id ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500'}`}>{b.type}</button>)}
             </div>
          </div>
          <div className="flex items-center gap-3"><button onClick={() => setIsAuditModalOpen(true)} className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><History className="w-5 h-5"/> Auditoria</button><Bell className="text-gray-400"/><Settings className="text-gray-400"/></div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          
          {activeTab === 'routine' && !selectedResidentId && (
            <DailyRoutineDashboard 
               residents={filteredResidents} 
               prescriptions={prescriptions}
               onLogAction={logAction} 
               onAddEvolution={handleAddEvolution}
            />
          )}

          {activeTab === 'finance' && !selectedResidentId && (
             <ReceivablesDashboard invoices={filteredInvoices} residents={filteredResidents} onUpdateInvoices={setInvoices} allInvoices={invoices} />
          )}

          {activeTab === 'residents' && (
             selectedResidentId ? (
               <ResidentProfile 
                  resident={selectedResident!} 
                  prescriptions={prescriptions.filter(p => p.residentId === selectedResidentId)}
                  stock={stockItems.filter(s => s.residentId === selectedResidentId)}
                  evolutions={evolutions.filter(e => e.residentId === selectedResidentId)}
                  documents={documents.filter(d => d.residentId === selectedResidentId)}
                  onBack={() => setSelectedResidentId(null)} 
                  onUpdateResident={handleUpdateResident} 
                  onUpdatePrescriptions={(updated) => setPrescriptions(prev => [...prev.filter(p => p.residentId !== selectedResidentId), ...updated])}
                  onUpdateStock={(updated) => setStockItems(prev => [...prev.filter(s => s.residentId !== selectedResidentId), ...updated])}
                  onUpdateDocuments={(updated) => setDocuments(prev => [...prev.filter(d => d.residentId !== selectedResidentId), ...updated])}
                  invoices={invoices} 
                  onLogAction={logAction}
                  onAddEvolution={handleAddEvolution}
                  onUpdateFee={handleUpdateResidentFee}
                />
             ) : (
               <ResidentList residents={filteredResidents} branches={BRANCHES} onSelect={(r) => setSelectedResidentId(r.id)} />
             )
          )}

          {activeTab === 'dashboard' && !selectedResidentId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <StatCard title="Receita" value={formatCurrency(65000)} icon={<TrendingUp/>} color="green"/>
               <StatCard title="Despesa" value={formatCurrency(42000)} icon={<Wallet/>} color="red"/>
               <StatCard title="Residentes" value={residents.length} icon={<UserCheck/>} color="blue"/>
               <StatCard title="Equipe" value={filteredStaff.length} icon={<Users/>} color="purple"/>
            </div>
          )}

        </div>
      </main>
      
      {/* Audit Modal Logic Placeholder */}
      {isAuditModalOpen && <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col"><div className="flex justify-between mb-4 font-bold"><h3>Auditoria</h3><button onClick={() => setIsAuditModalOpen(false)}><X/></button></div><div className="flex-1 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Data</th><th>Usuário</th><th>Ação</th></tr></thead><tbody>{auditLogs.map(l => <tr key={l.id}><td>{l.timestamp}</td><td>{l.userName}</td><td>{l.action}</td></tr>)}</tbody></table></div></div></div>}

    </div>
  );
}

export default App;
