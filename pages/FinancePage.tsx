
import React, { useState } from 'react';
import { ReceivablesDashboard } from '../components/ReceivablesDashboard';
import { CashFlowDashboard } from '../components/CashFlowDashboard';
import { useData } from '../contexts/DataContext';
import { CalendarClock, Banknote } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const { invoices, residents, setInvoices } = useData();
  const [activeTab, setActiveTab] = useState<'accrual' | 'cashflow'>('accrual');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header e Navegação de Abas */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
            <p className="text-gray-500 text-sm">Controle de faturas, despesas e análise de caixa.</p>
         </div>

         <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start md:self-auto">
            <button
              onClick={() => setActiveTab('accrual')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'accrual' 
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
               <CalendarClock className="w-4 h-4" /> Regime de Competência
            </button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'cashflow' 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
               <Banknote className="w-4 h-4" /> Fluxo de Caixa Real
            </button>
         </div>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="min-h-[500px]">
        {activeTab === 'accrual' ? (
          <ReceivablesDashboard 
            invoices={invoices} 
            residents={residents} 
            onUpdateInvoices={setInvoices} 
            allInvoices={invoices} 
          />
        ) : (
          <CashFlowDashboard 
            invoices={invoices}
            residents={residents}
          />
        )}
      </div>

    </div>
  );
};
