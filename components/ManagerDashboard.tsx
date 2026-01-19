
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { StatCard } from './StatCard';
import { FinancialChart } from './FinancialChart';
import { Users, DollarSign, BedDouble, AlertTriangle, FileText, Wallet, TrendingUp, Briefcase, Palmtree, FileWarning, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { InvoiceStatus } from '../types';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard: React.FC = () => {
  const { residents, invoices, staff, hrAlerts } = useData();
  const navigate = useNavigate();

  // --- KPI 1: OCUPAÇÃO ---
  const totalBeds = 50;
  const occupiedBeds = residents.filter(r => r.status === 'Ativo' || r.status === 'Hospitalizado').length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  // --- KPI 2: FATURAMENTO (Mês Atual) ---
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const monthlyRevenue = invoices
    .filter(i => i.type === 'income' && i.month === currentMonth && i.year === currentYear)
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

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

    // Alerta 1: Recebimentos Atrasados
    const overdueIncome = invoices.filter(i => i.type === 'income' && i.status === InvoiceStatus.OVERDUE).length;
    if (overdueIncome > 0) {
      list.push({
        id: 'overdue',
        title: 'Mensalidades em Atraso',
        value: `${overdueIncome} faturas`,
        icon: AlertTriangle,
        color: 'text-red-600',
        bg: 'bg-red-50'
      });
    }

    // Alerta 2: Contas a Pagar (Vencendo Hoje/Amanhã - Simulação baseada em pendentes)
    const pendingExpenses = invoices.filter(i => i.type === 'expense' && i.status === InvoiceStatus.PENDING).length;
    if (pendingExpenses > 0) {
      list.push({
        id: 'expenses',
        title: 'Contas a Pagar (Pendentes)',
        value: `${pendingExpenses} lançamentos`,
        icon: Wallet,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      });
    }

    // Alerta 3: Contratos (Simulado para atender o prompt, já que não temos data de expiração no mock)
    // Lógica real: Filtraria documents com category 'contract' e data próxima
    list.push({
      id: 'contracts',
      title: 'Renovação de Contratos',
      value: '2 vencendo em breve',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    });

    return list;
  }, [invoices]);

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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Gerencial</h1>
          <p className="text-gray-500 text-sm">Resumo executivo da operação e financeiro.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-xs font-bold text-gray-600 uppercase">Sistema Operante</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Ocupação Atual" 
          value={`${occupiedBeds}/${totalBeds}`} 
          icon={<BedDouble className="w-6 h-6"/>} 
          color="blue"
          trend={`${occupancyRate}% preenchido`}
          trendUp={occupancyRate > 80}
        />
        <StatCard 
          title="Faturamento (Mês)" 
          value={formatCurrency(monthlyRevenue)} 
          icon={<DollarSign className="w-6 h-6"/>} 
          color="green"
          trend="Consolidado"
          trendUp={true}
        />
        <StatCard 
          title="Equipe Ativa" 
          value={activeStaffCount} 
          icon={<Users className="w-6 h-6"/>} 
          color="purple"
          trend="Colaboradores"
          trendUp={true}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Financial Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-blue-600" /> Performance Financeira
              </h3>
              <select className="text-xs font-bold bg-gray-50 border-none rounded-lg py-1 px-3 text-gray-500">
                 <option>Últimos 6 meses</option>
              </select>
           </div>
           <FinancialChart data={chartData} />
        </div>

        {/* Right Column: Alerts & Quick Stats */}
        <div className="space-y-6">
           
           {/* Radar RH Widget (NOVO) */}
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

           {/* Alerts List */}
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-amber-500" /> Alertas Administrativos
              </h3>
              <div className="space-y-3">
                 {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group cursor-pointer">
                       <div className={`p-3 rounded-xl ${alert.bg} ${alert.color}`}>
                          <alert.icon className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{alert.title}</p>
                          <p className="text-xs text-gray-500">{alert.value}</p>
                       </div>
                    </div>
                 ))}
                 {alerts.length === 0 && (
                   <p className="text-sm text-gray-400 italic">Nenhum alerta pendente.</p>
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};
