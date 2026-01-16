
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, Wallet, Building2, Bell, Menu, Activity,
  UserCheck, TrendingUp, BrainCircuit, Settings, Receipt, Landmark,
  GripVertical, BarChart3, ListTodo, ClipboardCheck, History, ShieldCheck,
  X, Search, FileText, LogOut, Lock, Mail
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
import { useAuth } from './contexts/AuthContext';

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
    if (!user) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action, details, category, residentId: resId,
      userId: user.id, userName: user.name, userRole: user.role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- HANDLERS ---
  const handleUpdateResident = (updated: Resident) => {
    setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleUpdatePrescriptions = (updated: Prescription[]) => {
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

  const handleUpdateResidentFee = (resId: string, newFee: FeeConfig, updatePending: boolean) => {
    setResidents(prev => prev.map(r => r.id === resId ? { ...r, feeConfig: newFee } : r));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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
              
              <p className="text-center text-xs text-gray-400">
                Acesso restrito a colaboradores autorizados.
              </p>
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
          
          <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                   {user?.name.charAt(0)}
                </div>
                <div className="min-w-0">
                   <p className="text-sm font-bold truncate">{user?.name}</p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{user?.role}</p>
                </div>
             </div>
          </div>
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
            <button className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
               <Bell className="w-5 h-5"/>
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <Settings className="text-gray-400"/>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          
          {activeTab === 'routine' && !selectedResidentId && (
            <DailyRoutineDashboard 
               residents={filteredResidents} 
               onLogAction={logAction} 
               onAddEvolution={handleAddEvolution}
               onUpdateResident={handleUpdateResident}
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
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="Receita (Mês)" value={formatCurrency(65000)} icon={<TrendingUp/>} color="green" trend="+12.5%" trendUp={true}/>
                  <StatCard title="Despesa (Mês)" value={formatCurrency(42000)} icon={<Wallet/>} color="red" trend="-2.4%" trendUp={true}/>
                  <StatCard title="Residentes" value={residents.length} icon={<UserCheck/>} color="blue"/>
                  <StatCard title="Equipe Ativa" value={filteredStaff.length} icon={<Users/>} color="purple"/>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-center mb-8">
                        <div>
                           <h3 className="text-xl font-bold text-gray-900">Fluxo de Caixa</h3>
                           <p className="text-sm text-gray-400">Consolidado Matriz & Filial</p>
                        </div>
                        <div className="flex gap-2">
                           <button className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors">6 meses</button>
                           <button className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">1 ano</button>
                        </div>
                     </div>
                     <FinancialChart data={[
                        { name: 'Mai', receita: 45000, despesa: 38000 },
                        { name: 'Jun', receita: 52000, despesa: 41000 },
                        { name: 'Jul', receita: 48000, despesa: 43000 },
                        { name: 'Ago', receita: 61000, despesa: 39000 },
                        { name: 'Set', receita: 59000, despesa: 45000 },
                        { name: 'Out', receita: 65000, despesa: 42000 },
                     ]} />
                  </div>

                  <div className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <BrainCircuit className="w-32 h-32" />
                     </div>
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-blue-400" /> Insight IA
                     </h3>
                     <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Nossa IA analisa os dados de todas as unidades para fornecer recomendações estratégicas.
                     </p>
                     
                     {aiInsight ? (
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 animate-in fade-in duration-500">
                           <p className="text-sm leading-relaxed text-slate-200">{aiInsight}</p>
                           <button onClick={() => setAiInsight(null)} className="mt-4 text-xs font-bold text-blue-400 hover:underline">Recalcular Insight</button>
                        </div>
                     ) : (
                        <button 
                           onClick={async () => {
                              setIsLoadingAi(true);
                              const res = await analyzeFinancialHealth([], selectedBranchId === 'all' ? 'Rede Consolidada' : BRANCHES.find(b => b.id === selectedBranchId)?.name || '');
                              setAiInsight(res);
                              setIsLoadingAi(false);
                           }}
                           className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20"
                           disabled={isLoadingAi}
                        >
                           {isLoadingAi ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           ) : (
                              <><Activity className="w-5 h-5"/> Gerar Análise Mensal</>
                           )}
                        </button>
                     )}

                     <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Ocupação Média</span>
                           <span className="font-bold text-emerald-400">92%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Ticket Médio</span>
                           <span className="font-bold text-blue-400">R$ 5.400</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>
      
      {/* Audit Modal Logic Placeholder */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
             <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                <div>
                   <h3 className="text-xl font-bold text-gray-900">Registro de Auditoria</h3>
                   <p className="text-sm text-gray-400">Rastreabilidade completa de ações críticas</p>
                </div>
                <button onClick={() => setIsAuditModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                   <X className="w-6 h-6 text-gray-400" />
                </button>
             </div>
             <div className="flex-1 overflow-auto p-8">
                {auditLogs.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                       <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="pb-4">Data/Hora</th>
                          <th className="pb-4">Usuário</th>
                          <th className="pb-4">Ação</th>
                          <th className="pb-4">Categoria</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {auditLogs.map(l => (
                          <tr key={l.id} className="text-sm">
                             <td className="py-4 text-gray-500">{new Date(l.timestamp).toLocaleString()}</td>
                             <td className="py-4 font-bold text-gray-900">{l.userName}</td>
                             <td className="py-4 text-gray-700">{l.action} - <span className="text-xs text-gray-400 italic">{l.details}</span></td>
                             <td className="py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                   l.category === 'medical' ? 'bg-rose-100 text-rose-700' : 
                                   l.category === 'financial' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                   {l.category}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <History className="w-12 h-12 mb-4 opacity-20" />
                     <p>Nenhuma atividade registrada no log de auditoria.</p>
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
