
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, Wallet, Building2, Bell, Menu, Activity,
  UserCheck, TrendingUp, BrainCircuit, Settings, Receipt, Landmark,
  GripVertical, BarChart3, ListTodo, ClipboardCheck, History, ShieldCheck,
  X, Search, FileText, LogOut, Lock, Mail, ShieldAlert
} from 'lucide-react';
import { 
  BRANCHES, MOCK_RESIDENTS, MOCK_STAFF, MOCK_INVOICES, 
  MOCK_PRESCRIPTIONS, MOCK_STOCK, MOCK_EVOLUTIONS, MOCK_DOCUMENTS 
} from './constants';
import { 
  BranchType, Resident, Invoice, AuditLog, FeeConfig, 
  InvoiceStatus, Evolution, Prescription, StockItem, ResidentDocument, IncidentReport 
} from './types';
import { StatCard } from './components/StatCard';
import { FinancialChart } from './components/FinancialChart';
import { ReceivablesDashboard } from './components/ReceivablesDashboard';
import { ResidentList } from './components/residents/ResidentList';
import { ResidentProfile } from './components/residents/ResidentProfile';
import { DailyRoutineDashboard } from './components/DailyRoutineDashboard'; 
import { analyzeFinancialHealth } from './services/geminiService';
import { dataService } from './services/dataService';
import { useAuth } from './contexts/AuthContext';
import { IncidentReportModal } from './components/modals/IncidentReportModal';

function App() {
  const { user, isAuthenticated, login, logout, isLoading: isAuthLoading } = useAuth();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'residents' | 'routine'>('dashboard');
  const [financeView, setFinanceView] = useState<'overview' | 'receivables'>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // --- STATE (Independent Tables) ---
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [stockItems, setStockItems] = useState<StockItem[]>(MOCK_STOCK);
  const [evolutions, setEvolutions] = useState<Evolution[]>(MOCK_EVOLUTIONS);
  const [documents, setDocuments] = useState<ResidentDocument[]>(MOCK_DOCUMENTS);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Modals
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentTargetResident, setIncidentTargetResident] = useState<Resident | null>(null);

  // --- DERIVED STATE ---
  const selectedResident = useMemo(() => 
    residents.find(r => r.id === selectedResidentId) || null, 
  [residents, selectedResidentId]);

  const filteredResidents = useMemo(() => {
    return selectedBranchId === 'all' ? residents : residents.filter(r => r.branchId === selectedBranchId);
  }, [selectedBranchId, residents]);

  // --- HANDLERS ---
  const handleUpdateResident = (updated: Resident) => {
    setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleAddEvolution = (resId: string, content: string, type: Evolution['type']) => {
    if (!user) return;
    const newEv: Evolution = {
        id: `ev-${Date.now()}`,
        residentId: resId,
        date: new Date().toLocaleString('pt-BR'),
        author: user.name,
        role: user.role,
        content,
        type
    };
    setEvolutions(prev => [newEv, ...prev]);
  };

  const handleLogAction = (action: string, details: string, category: AuditLog['category'], resId?: string) => {
    if (!user) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action, details, category, residentId: resId,
      userId: user.id, userName: user.name, userRole: user.role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddIncident = async (incidentData: any) => {
    const newIncident = await dataService.addIncident(incidentData);
    setIncidents(prev => [...prev, newIncident]);
    handleLogAction("Registro de Incidente", `Tipo: ${incidentData.type}, Gravidade: ${incidentData.severity}`, "medical", incidentData.residentId);
    
    // Auto-evolucao para incidentes
    handleAddEvolution(incidentData.residentId, `INCIDENTE REGISTRADO: ${incidentData.type.toUpperCase()}. ${incidentData.description}`, 'nursing');
  };

  const openIncidentModal = (res: Resident) => {
    setIncidentTargetResident(res);
    setIsIncidentModalOpen(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPass) {
      await login(loginEmail, loginPass);
    }
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-blue-600 p-8 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                 <Activity className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AppCare ERP</h1>
              <p className="text-blue-100 mt-2">Gestão Profissional para ILPIs</p>
           </div>
           
           <form className="p-8 space-y-6" onSubmit={handleLoginSubmit}>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Corporativo</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      type="email" 
                      required
                      placeholder="ana.souza@appcare.com"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                    />
                 </div>
              </div>

              <button 
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Entrar no Sistema</>
                )}
              </button>
           </form>
        </div>
      </div>
    );
  }

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
      <div className="pt-10">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-x-hidden relative">
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
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAuditModalOpen(true)} className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><History className="w-5 h-5"/> Auditoria</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          {activeTab === 'routine' && (
            <DailyRoutineDashboard 
               residents={filteredResidents} 
               onLogAction={handleLogAction} 
               onAddEvolution={handleAddEvolution}
               onUpdateResident={handleUpdateResident}
            />
          )}

          {activeTab === 'finance' && (
             <ReceivablesDashboard invoices={invoices} residents={filteredResidents} onUpdateInvoices={setInvoices} allInvoices={invoices} />
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
                  onLogAction={handleLogAction}
                  onAddEvolution={handleAddEvolution}
                />
             ) : (
               <ResidentList 
                  residents={filteredResidents} 
                  branches={BRANCHES} 
                  incidents={incidents}
                  onSelect={(r) => setSelectedResidentId(r.id)} 
                  onReportIncident={openIncidentModal}
               />
             )
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="Receita (Mês)" value="R$ 65.000" icon={<TrendingUp/>} color="green" trend="+12.5%" trendUp={true}/>
                  <StatCard title="Despesa (Mês)" value="R$ 42.000" icon={<Wallet/>} color="red" trend="-2.4%" trendUp={true}/>
                  <StatCard title="Residentes" value={residents.length} icon={<UserCheck/>} color="blue"/>
                  <StatCard title="Ocorrências 24h" value={incidents.filter(i => new Date(i.date) > new Date(Date.now() - 86400000)).length} icon={<ShieldAlert/>} color="red"/>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Incident Modal */}
      <IncidentReportModal 
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        resident={incidentTargetResident}
        onSave={handleAddIncident}
      />

    </div>
  );
}

export default App;
