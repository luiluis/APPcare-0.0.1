
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useFinancialReports, DRENode } from '../hooks/useFinancialReports';
import { useOccupancyMetrics } from '../hooks/useOccupancyMetrics';
import { StatCard } from './StatCard';
import { FinancialChart } from './FinancialChart';
import { 
  Users, DollarSign, BedDouble, AlertTriangle, FileText, Wallet, 
  TrendingUp, Briefcase, Palmtree, FileWarning, ArrowRight, 
  Calendar, PieChart, Activity, TrendingDown, ChevronDown, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { InvoiceStatus } from '../types';
import { useNavigate } from 'react-router-dom';

// Componente Recursivo para Linhas do DRE
const DRERow: React.FC<{ node: DRENode; level?: number }> = ({ node, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isRoot = level === 0;

  // Cores baseadas no tipo
  const valueColor = node.category.type === 'income' ? 'text-emerald-600' : 'text-rose-600';
  const bgColor = isRoot ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50';

  return (
    <>
      <div 
        className={`flex justify-between items-center py-3 px-4 border-b border-gray-100 transition-colors ${bgColor}`}
        style={{ paddingLeft: `${level * 20 + 16}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 cursor-pointer">
          {hasChildren && (
            <span className="text-gray-400">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
          <span className={`text-sm ${isRoot ? 'text-gray-800' : 'text-gray-600'}`}>
            {node.category.name}
          </span>
        </div>
        <span className={`text-sm tabular-nums ${isRoot ? 'font-extrabold' : 'font-medium'} ${valueColor}`}>
          {formatCurrency(node.value)}
        </span>
      </div>
      
      {expanded && node.children.map(child => (
        <DRERow key={child.category.id} node={child} level={level + 1} />
      ))}
    </>
  );
};

export const ManagerDashboard: React.FC = () => {
  const { invoices, staff, hrAlerts } = useData();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();

  const { dre, loading: loadingDre } = useFinancialReports(selectedMonth, selectedYear);
  const metrics = useOccupancyMetrics(dre);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const chartData = useMemo(() => {
    const data: Record<string, { name: string; receita: number; despesa: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      data[key] = { name: d.toLocaleDateString('pt-BR', { month: 'short' }), receita: 0, despesa: 0 };
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Seletor */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Estratégica</h1>
          <p className="text-gray-500 text-sm">Acompanhamento de DRE e indicadores de performance.</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ocupação Atual" 
          value={`${metrics.occupiedBeds}/${metrics.totalCapacity}`} 
          icon={<BedDouble className="w-6 h-6"/>} 
          color="blue"
          trend={`${metrics.occupancyRate.toFixed(0)}% ocupado`}
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
          trend="Receita / Residente"
          trendUp={true}
        />
        <StatCard 
          title="Custo por Leito" 
          value={formatCurrency(metrics.costPerBed)} 
          icon={<PieChart className="w-6 h-6"/>} 
          color={metrics.profitPerBed >= 0 ? "indigo" : "red"}
          trend={metrics.profitPerBed >= 0 ? "Operação Lucrativa" : "Prejuízo por Idoso"}
          trendUp={metrics.profitPerBed >= 0}
        />
      </div>

      {/* Alerta Crítico de Viabilidade */}
      {metrics.profitPerBed < 0 && (
         <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
             <div className="p-2 bg-white rounded-full text-red-500 shadow-sm"><AlertTriangle className="w-6 h-6"/></div>
             <div>
                 <h3 className="text-red-800 font-bold">Atenção: Prejuízo Operacional por Idoso</h3>
                 <p className="text-red-700 text-sm mt-1">
                     O custo mensal por leito ({formatCurrency(metrics.costPerBed)}) está superando o ticket médio cobrado ({formatCurrency(metrics.averageTicket)}). 
                     Para atingir o ponto de equilíbrio (Break Even), você precisaria de aproximadamente <strong>{metrics.breakEvenPoint} residentes</strong> com a estrutura atual de custos.
                 </p>
             </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: DRE */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                       <FileText className="w-5 h-5 text-gray-500" /> DRE Analítico (Plano de Contas)
                   </h3>
                   <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">Regime de Competência</span>
               </div>
               
               <div className="divide-y divide-gray-50">
                   {dre?.tree.map(node => (
                       <DRERow key={node.category.id} node={node} />
                   ))}
                   
                   {/* Rodapé do DRE */}
                   <div className="bg-slate-50 border-t border-gray-200 p-4 flex justify-between items-center mt-2">
                       <span className="font-bold text-gray-900 text-lg uppercase tracking-wide">Resultado Operacional (EBITDA)</span>
                       <span className={`font-extrabold text-2xl ${dre?.ebitda && dre.ebitda >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                           {formatCurrency(dre?.ebitda)}
                       </span>
                   </div>
               </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-600" /> Evolução Semestral
                  </h3>
               </div>
               <FinancialChart data={chartData} />
           </div>
        </div>

        {/* Right Column: Radar RH & Alertas */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" /> Radar RH
                  </h3>
                  {hrAlerts.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{hrAlerts.length}</span>}
              </div>
              
              <div className="space-y-3">
                  {hrAlerts.length > 0 ? hrAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        onClick={() => navigate(`/rh/${alert.staffId}`)}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group"
                      >
                          <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${alert.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                              <AlertTriangle className="w-4 h-4" />
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
                  )) : (
                      <div className="text-center py-6">
                          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Users className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">Equipe 100%</p>
                          <p className="text-xs text-gray-500">Nenhuma pendência trabalhista.</p>
                      </div>
                  )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
