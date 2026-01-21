
import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, Resident } from '../types';
import { useCashFlow } from '../hooks/useCashFlow';
import { formatCurrency, formatDateBr } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';

interface CashFlowDashboardProps {
  invoices: Invoice[];
  residents: Resident[];
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({ invoices, residents }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { totalIn, totalOut, balance } = useCashFlow(invoices, month, year);

  // Filtro local para a tabela (Espelhando a lógica do hook para listar itens individuais)
  const transactions = useMemo(() => {
    return invoices.filter(inv => {
       if (!inv.paymentDate) return false;
       
       // Verifica se está pago (total ou parcial)
       const isPaid = inv.status === InvoiceStatus.PAID || (inv.paidAmount && inv.paidAmount > 0);
       if (!isPaid) return false;

       // Parse seguro da data de pagamento
       const [pYearStr, pMonthStr] = inv.paymentDate.split('T')[0].split('-');
       const pYear = parseInt(pYearStr);
       const pMonth = parseInt(pMonthStr);

       return pYear === year && pMonth === month;
    }).sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());
  }, [invoices, month, year]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const getDescription = (t: Invoice) => {
      if (t.type === 'income' && t.residentId) {
          const res = residents.find(r => r.id === t.residentId);
          return res ? `${res.name} - ${t.items[0]?.description}` : t.items[0]?.description;
      }
      return t.supplier ? `${t.supplier} - ${t.items[0]?.description}` : t.items[0]?.description;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Header & Controls */}
       <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <DollarSign className="w-5 h-5 text-blue-600" /> Fluxo de Caixa (Realizado)
          </h2>
          <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-lg">
             <button onClick={() => handleMonthChange(-1)} className="px-3 py-1.5 hover:bg-white rounded-md shadow-sm text-gray-600 font-bold transition-all hover:text-blue-600">{"<"}</button>
             <span className="font-bold text-gray-800 min-w-[140px] text-center capitalize text-sm">
                {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
             </span>
             <button onClick={() => handleMonthChange(1)} className="px-3 py-1.5 hover:bg-white rounded-md shadow-sm text-gray-600 font-bold transition-all hover:text-blue-600">{">"}</button>
          </div>
       </div>

       {/* Cards KPI */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingUp className="w-24 h-24 text-emerald-600" />
             </div>
             <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Entradas</span>
                <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><ArrowUpCircle className="w-5 h-5"/></div>
             </div>
             <p className="text-3xl font-extrabold text-emerald-700 relative z-10">{formatCurrency(totalIn)}</p>
             <p className="text-xs text-emerald-600 mt-1 font-medium relative z-10">Recebimentos no período</p>
          </div>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingDown className="w-24 h-24 text-rose-600" />
             </div>
             <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Saídas</span>
                <div className="p-2 bg-white rounded-lg text-rose-600 shadow-sm"><ArrowDownCircle className="w-5 h-5"/></div>
             </div>
             <p className="text-3xl font-extrabold text-rose-700 relative z-10">{formatCurrency(totalOut)}</p>
             <p className="text-xs text-rose-600 mt-1 font-medium relative z-10">Pagamentos efetuados</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <DollarSign className="w-24 h-24 text-blue-600" />
             </div>
             <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Saldo Líquido</span>
                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><DollarSign className="w-5 h-5"/></div>
             </div>
             <p className={`text-3xl font-extrabold relative z-10 ${balance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatCurrency(balance)}</p>
             <p className="text-xs text-blue-600 mt-1 font-medium relative z-10">Resultado operacional</p>
          </div>
       </div>

       {/* Tabela de Movimentações */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white border border-gray-200 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">Extrato de Movimentações</h3>
             </div>
             <button className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                 <Filter className="w-3 h-3" /> Filtrar
             </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-3">Data Pagto</th>
                       <th className="px-6 py-3">Descrição</th>
                       <th className="px-6 py-3">Categoria</th>
                       <th className="px-6 py-3 text-right">Valor</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {transactions.length > 0 ? transactions.map(t => {
                       const isIncome = t.type === 'income';
                       const amount = t.paidAmount || t.totalAmount;
                       return (
                          <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                             <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                                {formatDateBr(t.paymentDate)}
                             </td>
                             <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {isIncome ? <ArrowUpCircle className="w-4 h-4"/> : <ArrowDownCircle className="w-4 h-4"/>}
                                </div>
                                <span className="truncate max-w-[200px] sm:max-w-md" title={getDescription(t)}>
                                    {getDescription(t)}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${isIncome ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                   {t.items[0]?.category}
                                </span>
                             </td>
                             <td className={`px-6 py-4 text-right font-bold text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isIncome ? '+' : '-'} {formatCurrency(amount)}
                             </td>
                          </tr>
                       );
                    }) : (
                       <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                             <div className="flex flex-col items-center gap-2 text-gray-400">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="font-medium text-sm">Nenhuma movimentação financeira registrada neste mês.</p>
                             </div>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
          </div>
       </div>
    </div>
  );
};
