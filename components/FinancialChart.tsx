
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../lib/utils';

interface FinancialChartProps {
  data: { name: string; receita: number; despesa: number }[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#6B7280'}} 
            // Converte Centavos para 'k' Reais (ex: 100000 -> 1k)
            tickFormatter={(val) => {
                const inReais = val / 100;
                if (inReais === 0) return 'R$0';
                if (inReais >= 1000) return `R$${(inReais/1000).toFixed(0)}k`;
                return `R$${inReais}`;
            }} 
          />
          <Tooltip 
            cursor={{fill: '#F3F4F6'}}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            // Formata valor bruto (centavos) para moeda BRL usando o utilitário padrão
            formatter={(value: number) => [formatCurrency(value), '']}
          />
          <Legend />
          <Bar name="Receitas" dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
          <Bar name="Despesas" dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
