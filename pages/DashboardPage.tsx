
import React from 'react';
import { StatCard } from '../components/StatCard';
import { TrendingUp, Wallet, UserCheck, ShieldAlert } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const DashboardPage: React.FC = () => {
  const { residents, incidents } = useData();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Receita (Mês)" 
          value="R$ 65.000" 
          icon={<TrendingUp/>} 
          color="green" 
          trend="+12.5%" 
          trendUp={true}
        />
        <StatCard 
          title="Despesa (Mês)" 
          value="R$ 42.000" 
          icon={<Wallet/>} 
          color="red" 
          trend="-2.4%" 
          trendUp={true}
        />
        <StatCard 
          title="Residentes" 
          value={residents.length} 
          icon={<UserCheck/>} 
          color="blue"
        />
        <StatCard 
          title="Ocorrências 24h" 
          value={incidents.filter(i => new Date(i.date) > new Date(Date.now() - 86400000)).length} 
          icon={<ShieldAlert/>} 
          color="red"
        />
      </div>
      
      {/* Aqui virão os gráficos e outros widgets do dashboard */}
    </div>
  );
};
