
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useFinancialReports } from '../hooks/useFinancialReports';
import { useOccupancyMetrics } from '../hooks/useOccupancyMetrics';
import { StatCard } from './StatCard';
import { FinancialChart } from './FinancialChart';
import { 
  Users, DollarSign, BedDouble, AlertTriangle, FileText, Wallet, 
  TrendingUp, Briefcase, Palmtree, FileWarning, ArrowRight, 
  Calendar, PieChart, Activity, TrendingDown
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { InvoiceStatus } from '../types';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard: React.FC = () => {
  const { invoices, staff, hrAlerts } = useData();
  const navigate = useNavigate();

  // --- SELETOR DE COMPETÊNCIA ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();

  // --- HOOKS DE INTELIGÊNCIA ---
  const { dre, loading: loadingDre } = useFinancialReports(selectedMonth, selectedYear);
  const metrics = useOccupancyMetrics(dre);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  // --- KPI 3: EQUIPE ATIVA ---
  const activeStaffCount = staff.filter(s => s.active).length;

  // --- GRÁFICO FINANCEIRO (Últimos 6 meses) ---
  const chartData = useMemo(() => {
    const data: Record<string, { name: string; receita: number; despesa: number }> = {};
    
    // Inicializa últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
      data[key] = { name: monthName, receita: 0, despesa: 0 };
    }

    invoices.forEach(inv => {
      const key = `${inv.month}/${inv.year}`;
      if (data[key]) {
        if (inv.type === 'income') data[key].receita += inv.totalAmount;
        else data[key].despesa += inv.totalAmount;
      }
    });

    return Object.values(data);
  }, [invoices]);

  // --- ALERTAS ADMINISTRATIVOS ---
  const alerts = useMemo(() => {
    const list = [];

    // Alerta de Viabilidade Econômica
    if (metrics.profitPerBed < 0) {
       list.push({
         id: 'loss',
         title: 'Prejuízo Operacional por Leito',
         value: `Déficit de ${formatCurrency(Math.abs(metrics.profitPerBed))}/residente`,
         icon: TrendingDown,
         color: 'text-red-700',
         bg: 'bg-red-100'
       });
    }

    const overdueIncome = invoices.filter(i => i.type === 'income' && i.status === InvoiceStatus.OVERDUE).length;
    if (overdueIncome > 0) {
      list.push({
        id: 'overdue',
        title: 'Mensalidades em Atraso',
        value: `${overdueIncome} faturas`,
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      });
    }

    const pendingExpenses = invoices.filter(i => i.type === 'expense' && i.status === InvoiceStatus.PENDING).length;
    if (pendingExpenses > 0) {
      list.push({
        id: 'expenses',
        title: 'Contas a Pagar (Pendentes)',
        value: `${pendingExpenses} lançamentos`,
        icon: Wallet,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      });
    }

    return list;
  }, [invoices, metrics]);

  const getHRAlertIcon = (type: string) => {
      switch (type) {
          case 'contract': return Briefcase;
          case 'vacation': return Palmtree;
          case 'document': return FileWarning;
          default: return AlertTriangle;
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Seletor */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Gerencial</h1>
          <p className="text-gray-500 text-sm">Saúde financeira e operacional da unidade.</p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
             <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"><ArrowRight className="w-5 h-5 rotate-180"/></button>
             <div className="px-4 text-center min-w-[160px] flex items-center justify-center gap-2">
                 <Calendar className="w-4 h-4 text-blue-600" />
                 <span className="text-sm font-bold text-gray-900 capitalize">
                    {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                 </span>
             </div>
             <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"><ArrowRight className="w-5 h-5"/></button>
         </div>
      </div>

      {/* KPI Cards (Operacionais e Financeiros) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ocupação" 
          value={`${metrics.occupiedBeds}/${metrics.totalCapacity}`} 
          icon={<BedDouble className="w-6 h-6"/>} 
          color="blue"
          trend={`${metrics.occupancyRate.toFixed(0)}% preenchido`}
          trendUp={metrics.occupancyRate > 80}
        />
        <StatCard 
          title="Resultado (EBITDA)" 
          value={formatCurrency(dre?.ebitda || 0)} 
          icon={<Activity className="w-6 h-6"/>} 
          color={dre?.ebitda && dre.ebitda >= 0 ? "green" : "red"}
          trend="Resultado Operacional"
          trendUp={!!dre?.ebitda && dre.ebitda > 0}
        />
        <StatCard 
          title="Ticket Médio" 
          value={formatCurrency(metrics.averageTicket)} 
          icon={<DollarSign className="w-6 h-6"/>} 
          color="emerald"
          trend="Receita por Residente"
          trendUp={true}
        />
        <StatCard 
          title="Custo por Leito" 
          value={formatCurrency(metrics.costPerBed)} 
          icon={<PieChart className="w-6 h-6"/>} 
          color={metrics.profitPerBed >= 0 ? "indigo" : "red"}
          trend={`Lucro: ${formatCurrency(metrics.profitPerBed)}`}
          trendUp={metrics.profitPerBed >= 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: DRE & Charts */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* DRE Simplificado */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                       <FileText className="w-5 h-5 text-gray-500" /> DRE Gerencial
                   </h3>
                   <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">Regime de Competência</span>
               </div>
               
               <div className="p-6 space-y-4">
                   {/* Receita */}
                   <div className="flex justify-between items-center text-sm">
                       <span className="font-medium text-gray-600">Receita Bruta</span>
                       <span className="font-bold text-emerald-600">{formatCurrency(dre?.grossRevenue)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="font-medium text-gray-400 pl-4">(-) Impostos (Simples 6%)</span>
                       <span className="text-red-400">{formatCurrency(dre?.taxes)}</span>
                   </div>
                   <div className="border-b border-gray-100 my-1"></div>
                   
                   <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-gray-700">(=) Receita Líquida</span>
                       <span className="text-gray-900">{formatCurrency(dre?.netRevenue)}</span>
                   </div>

                   {/* Custos */}
                   <div className="flex justify-between items-center text-sm mt-4">
                       <span className="font-medium text-gray-400 pl-4">(-) Custo Variável (Estoque/Farmácia)</span>
                       <span className="text-red-500">{formatCurrency(dre?.variableCosts)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="font-medium text-gray-400 pl-4">(-) Despesas Operacionais (Fixas/Folha)</span>
                       <span className="text-red-500">{formatCurrency(dre?.operationalExpenses)}</span>
                   </div>
                   
                   {/* Resultado */}
                   <div className="border-t-2 border-gray-100 pt-3 mt-2 flex justify-between items-center">
                       <span className="font-bold text-base text-gray-900 uppercase tracking-wide">Resultado (EBITDA)</span>
                       <span className={`font-extrabold text-xl ${dre?.ebitda && dre.ebitda >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                           {formatCurrency(dre?.ebitda)}
                       </span>
                   </div>
                   
                   {dre?.ebitda && dre.ebitda < 0 && (
                       <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2 mt-2">
                           <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                           <p>Atenção: A operação está deficitária neste mês. O custo por leito ({formatCurrency(metrics.costPerBed)}) supera o ticket médio ({formatCurrency(metrics.averageTicket)}). Ponto de equilíbrio estimado: {metrics.breakEvenPoint} residentes.</p>
                       </div>
                   )}
               </div>
           </div>

           {/* Gráfico Histórico */}
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-600" /> Histórico Semestral
                  </h3>
               </div>
               <FinancialChart data={chartData} />
           </div>
        </div>

        {/* Right Column: Alerts & Quick Stats */}
        <div className="space-y-6">
           
           {/* Alerts List */}
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-amber-500" /> Alertas do Mês
              </h3>
              <div className="space-y-3">
                 {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group cursor-pointer">
                       <div className={`p-3 rounded-xl ${alert.bg} ${alert.color}`}>
                          <alert.icon className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{alert.title}</p>
                          <p className="text-xs text-gray-500 font-medium">{alert.value}</p>
                       </div>
                    </div>
                 ))}
                 {alerts.length === 0 && (
                   <p className="text-sm text-gray-400 italic text-center py-4">Nenhum alerta crítico pendente.</p>
                 )}
              </div>
           </div>

           {/* Radar RH Widget */}
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" /> Radar RH
                  </h3>
                  {hrAlerts.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{hrAlerts.length}</span>}
              </div>
              
              <div className="space-y-3">
                  {hrAlerts.length > 0 ? hrAlerts.map(alert => {
                      const Icon = getHRAlertIcon(alert.type);
                      return (
                          <div 
                            key={alert.id} 
                            onClick={() => navigate(`/rh/${alert.staffId}`)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group"
                          >
                              <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${alert.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                  <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center">
                                      <p className="text-sm font-bold text-gray-800 truncate">{alert.staffName}</p>
                                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500" />
                                  </div>
                                  <p className={`text-xs mt-0.5 leading-snug ${alert.severity === 'high' ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                                      {alert.message}
                                  </p>
                              </div>
                          </div>
                      );
                  }) : (
                      <div className="text-center py-6">
                          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Users className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">Tudo Certo!</p>
                          <p className="text-xs text-gray-500">Nenhuma pendência trabalhista encontrada.</p>
                      </div>
                  )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};
