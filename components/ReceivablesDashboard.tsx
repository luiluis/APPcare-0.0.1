
import React, { useState, useMemo } from 'react';
import { 
  FileText, PlusCircle, Clock, Search, Check, 
  ArrowUpCircle, ArrowDownCircle, 
  Calendar, Download, Printer, Filter
} from 'lucide-react';
import { Invoice, Resident, InvoiceStatus, InvoiceCategory, PaymentConfirmDTO } from '../types';
import { BRANCHES } from '../constants';
import { formatCurrency, getFirstDayOfMonth, getLastDayOfMonth, formatDateBr } from '../lib/utils';
import { useInvoiceLogic } from '../hooks/useInvoiceLogic';
import { usePaymentProcessing } from '../hooks/usePaymentProcessing';
import { NewInvoiceModal } from './modals/NewInvoiceModal';
import { InvoiceDetailsModal } from './modals/InvoiceDetailsModal';
import { PaymentModal } from './modals/PaymentModal';

interface ReceivablesDashboardProps {
  invoices: Invoice[];
  residents: Resident[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
  allInvoices: Invoice[];
}

export const ReceivablesDashboard: React.FC<ReceivablesDashboardProps> = ({ 
  invoices, residents, onUpdateInvoices, allInvoices
}) => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Dialogs State
  const [modalState, setModalState] = useState({
    newInvoice: false,
    newInvoiceType: 'income' as 'income' | 'expense',
    details: null as Invoice | null,
    payment: false,
    paymentTargetIds: [] as string[]
  });

  // Hooks Separados (SRP)
  const { createRecurringInvoices, addQuickConsume } = useInvoiceLogic({
    invoices: allInvoices,
    onUpdateInvoices
  });

  const { registerPayment, markAsPaidBatch } = usePaymentProcessing({
    invoices: allInvoices,
    onUpdateInvoices
  });

  // --- PERFORMANCE OPTIMIZATION ---
  // Cria um Map para acesso O(1) aos residentes, evitando residents.find() dentro do map das faturas
  const residentsMap = useMemo(() => {
    return residents.reduce((acc, resident) => {
        acc[resident.id] = resident;
        return acc;
    }, {} as Record<string, Resident>);
  }, [residents]);

  const branchesMap = useMemo(() => {
    return BRANCHES.reduce((acc, branch) => {
        acc[branch.id] = branch.name;
        return acc;
    }, {} as Record<string, string>);
  }, []);

  // --- FILTERING LOGIC ---
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const inDate = inv.dueDate >= startDate && inv.dueDate <= endDate;
        const inStatus = statusFilter === 'all' || inv.status === statusFilter;
        const inCategory = categoryFilter === 'all' || inv.items.some(item => item.category === categoryFilter);
        return inDate && inStatus && inCategory;
      })
      .map(inv => {
        const resident = inv.residentId ? residentsMap[inv.residentId] : null;
        const branchName = inv.branchId ? branchesMap[inv.branchId] : 'N/A';
        return { 
          ...inv, 
          residentName: resident?.name || (inv.type === 'expense' ? 'Despesa Operacional' : 'Sem Residente'),
          branchName
        };
      })
      .filter(inv => 
        inv.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.items[0]?.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [invoices, residentsMap, branchesMap, searchTerm, startDate, endDate, statusFilter, categoryFilter]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    // Para simplificar, o KPI considera o saldo restante como pendente
    const incomePaid = filteredInvoices.filter(i => i.type === 'income' && i.status === InvoiceStatus.PAID).reduce((acc, c) => acc + (c.paidAmount || c.totalAmount), 0);
    const expensePaid = filteredInvoices.filter(i => i.type === 'expense' && i.status === InvoiceStatus.PAID).reduce((acc, c) => acc + (c.paidAmount || c.totalAmount), 0);
    
    // Pendente = Total - Pago (mesmo que seja parcial)
    const pendingIncome = filteredInvoices.filter(i => i.type === 'income' && i.status !== InvoiceStatus.PAID).reduce((acc, c) => acc + (c.totalAmount - (c.paidAmount || 0)), 0);
    const pendingExpense = filteredInvoices.filter(i => i.type === 'expense' && i.status !== InvoiceStatus.PAID).reduce((acc, c) => acc + (c.totalAmount - (c.paidAmount || 0)), 0);
    
    const overdue = filteredInvoices.filter(i => i.status === InvoiceStatus.OVERDUE).reduce((acc, c) => acc + (c.totalAmount - (c.paidAmount || 0)), 0);

    return { balance: incomePaid - expensePaid, pendingIncome, pendingExpense, overdue };
  }, [filteredInvoices]);

  // --- BULK ACTIONS HANDLERS ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const initiatePayment = (ids: string[]) => {
    setModalState(s => ({ 
      ...s, 
      payment: true,
      paymentTargetIds: ids
    }));
  };

  // Handler Atualizado para suportar o novo Modal
  const handlePaymentConfirm = (amount: number, paymentDetails: PaymentConfirmDTO) => {
    const { paymentTargetIds } = modalState;

    if (paymentTargetIds.length === 1) {
        // Pagamento Individual (Suporta Parcial)
        registerPayment(
            paymentTargetIds[0], 
            amount, 
            paymentDetails.paymentMethod, 
            paymentDetails.paymentDate
        );
    } else {
        // Pagamento em Lote (Mantém lógica anterior de baixa total para simplificar)
        // Em um app real, distribuiria o valor, mas aqui assumimos baixa de todos
        markAsPaidBatch(paymentTargetIds, paymentDetails);
    }
    
    // Cleanup
    setSelectedIds(new Set()); 
    setModalState(s => ({ ...s, payment: false, paymentTargetIds: [], details: null }));
  };

  // --- CÁLCULOS PARA O MODAL DE PAGAMENTO ---
  const paymentCalculation = useMemo(() => {
      const targets = allInvoices.filter(inv => modalState.paymentTargetIds.includes(inv.id));
      
      const original = targets.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const paid = targets.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
      const remaining = original - paid;

      return { original, paid, remaining, count: targets.length };
  }, [allInvoices, modalState.paymentTargetIds]);

  const handleExportCSV = () => {
    const headers = ["ID", "Tipo", "Vencimento", "Descricao", "Valor Total", "Valor Pago", "Status"];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.type,
      inv.dueDate,
      inv.items[0].description,
      (inv.totalAmount / 100).toFixed(2), // Exibe em reais no CSV
      ((inv.paidAmount || 0) / 100).toFixed(2),
      inv.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financeiro.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    if (status === InvoiceStatus.PAID) return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    if (status === InvoiceStatus.OVERDUE) return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
    return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
  };

  const getStatusLabel = (status: string, paidAmount: number = 0, totalAmount: number) => {
    if (status === InvoiceStatus.PAID) return 'Pago';
    if (paidAmount > 0 && paidAmount < totalAmount) return 'Parcial'; // Novo Label Visual
    if (status === InvoiceStatus.OVERDUE) return 'Atrasado';
    return 'Pendente';
  };

  return (
    <div className="space-y-8 relative">
      
      {/* --- ACTION BAR & FILTERS --- */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-center shadow-sm">
        
        {/* Filters Group */}
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
           {/* Date Picker Clean */}
           <div className="flex items-center gap-2">
             <div className="relative">
                <input 
                  type="date" 
                  className="pl-3 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white hover:border-gray-300 transition-colors"
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                />
             </div>
             <span className="text-gray-400 font-medium">até</span>
             <div className="relative">
                <input 
                  type="date" 
                  className="pl-3 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white hover:border-gray-300 transition-colors"
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                />
             </div>
           </div>

           {/* Dropdowns */}
           <div className="flex gap-2">
             <select 
               className="py-2.5 px-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-gray-300"
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
             >
               <option value="all">Todos Status</option>
               <option value={InvoiceStatus.PENDING}>Pendente</option>
               <option value={InvoiceStatus.PAID}>Pago</option>
               <option value={InvoiceStatus.OVERDUE}>Atrasado</option>
             </select>

             <select 
               className="py-2.5 px-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-gray-300"
               value={categoryFilter}
               onChange={e => setCategoryFilter(e.target.value)}
             >
               <option value="all">Todas Categorias</option>
               {Object.values(InvoiceCategory).map(cat => (
                 <option key={cat} value={cat} className="capitalize">{cat}</option>
               ))}
             </select>
           </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 h-11 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white text-gray-900 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              onClick={handleExportCSV}
              className="h-11 px-4 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            
            <div className="h-8 w-px bg-gray-200 hidden md:block mx-1"></div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setModalState(s => ({ ...s, newInvoice: true, newInvoiceType: 'income' }))}
                className="h-11 px-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 font-bold text-sm"
              >
                <PlusCircle className="w-5 h-5" /> Nova Receita
              </button>
              <button 
                onClick={() => setModalState(s => ({ ...s, newInvoice: true, newInvoiceType: 'expense' }))}
                className="h-11 px-4 flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm"
              >
                <ArrowDownCircle className="w-5 h-5" /> Nova Despesa
              </button>
            </div>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div onClick={() => setStatusFilter(InvoiceStatus.PAID)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all group">
          <p className="text-gray-500 text-sm font-medium group-hover:text-gray-700">Saldo Realizado</p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">{formatCurrency(stats.balance)}</div>
        </div>
        <div onClick={() => { setStatusFilter(InvoiceStatus.PENDING); setModalState(s => ({...s, newInvoiceType: 'income'})); }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-all group">
            <p className="text-gray-500 text-sm font-medium group-hover:text-blue-800">A Receber (Pendente)</p>
            <div className="mt-2 text-3xl font-bold tracking-tight text-blue-700">{formatCurrency(stats.pendingIncome)}</div>
        </div>
        <div onClick={() => { setStatusFilter(InvoiceStatus.PENDING); setModalState(s => ({...s, newInvoiceType: 'expense'})); }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-amber-400 cursor-pointer hover:shadow-md transition-all group">
            <p className="text-gray-500 text-sm font-medium group-hover:text-amber-800">A Pagar (Pendente)</p>
            <div className="mt-2 text-3xl font-bold tracking-tight text-amber-700">{formatCurrency(stats.pendingExpense)}</div>
        </div>
        <div onClick={() => setStatusFilter(InvoiceStatus.OVERDUE)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-rose-500 cursor-pointer hover:shadow-md transition-all group">
          <p className="text-gray-500 text-sm font-medium group-hover:text-rose-800">Em Atraso</p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-rose-700">{formatCurrency(stats.overdue)}</div>
        </div>
      </div>

      {/* --- BULK ACTIONS --- */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-40 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
             <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm font-bold">{selectedIds.size} selecionados</div>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex gap-2">
             <button 
               onClick={() => initiatePayment(Array.from(selectedIds))}
               className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm transition-colors"
             >
               <Check className="w-4 h-4" /> Baixar
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-sm transition-colors">
               <Printer className="w-4 h-4" /> Imprimir
             </button>
          </div>
          <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-slate-400 hover:text-white"><Check className="w-5 h-5" /></button>
        </div>
      )}

      {/* --- TABLE --- */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-5 w-16 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" onChange={handleSelectAll} checked={filteredInvoices.length > 0 && selectedIds.size === filteredInvoices.length} />
                </th>
                <th className="px-2 py-5">Descrição</th>
                <th className="px-6 py-5">Categoria</th>
                <th className="px-6 py-5">Vencimento</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Valor</th>
                <th className="px-6 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv: any) => {
                  const paid = inv.paidAmount || 0;
                  const isPartial = paid > 0 && paid < inv.totalAmount;
                  
                  return (
                  <tr 
                    key={inv.id} 
                    className={`hover:bg-blue-50/30 group transition-colors ${selectedIds.has(inv.id) ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleSelectOne(inv.id)}
                  >
                    <td className="px-6 py-5 text-center" onClick={e => e.stopPropagation()}>
                       <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white" checked={selectedIds.has(inv.id)} onChange={() => handleSelectOne(inv.id)} />
                    </td>
                    <td className="px-2 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${inv.type === 'income' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                           {inv.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="text-base font-bold text-gray-900 block">{inv.type === 'income' ? inv.residentName : inv.items[0]?.description}</span>
                          <span className="text-sm text-gray-400 font-medium">{inv.branchName}</span>
                          {inv.attachmentUrl && <span className="text-[10px] text-blue-500 font-bold ml-1 px-1.5 py-0.5 bg-blue-50 rounded">CLIP</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wide">
                          {inv.items[0]?.category}
                       </span>
                    </td>
                    <td className="px-6 py-5 flex items-center gap-2 text-gray-600 font-medium">
                        <Clock className="w-4 h-4 text-gray-400" /> {formatDateBr(inv.dueDate)}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(inv.status)}`}>
                        {getStatusLabel(inv.status, paid, inv.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className={`text-base font-bold ${inv.type === 'income' ? 'text-gray-900' : 'text-rose-600'}`}>
                        {inv.type === 'expense' && '- '}{formatCurrency(inv.totalAmount)}
                      </div>
                      {isPartial && (
                          <div className="text-xs text-emerald-600 font-bold">
                              Pago: {formatCurrency(paid)}
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-center items-center gap-3">
                         {inv.status !== InvoiceStatus.PAID ? (
                           <button 
                             onClick={() => initiatePayment([inv.id])}
                             className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                             title="Baixar"
                           >
                             <Check className="w-5 h-5" />
                           </button>
                         ) : (
                           <div className="w-9 h-9 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center" title={`Pago: ${formatDateBr(inv.paymentDate)}`}><Check className="w-5 h-5" /></div>
                         )}
                        <button 
                          onClick={() => setModalState(s => ({ ...s, details: inv }))}
                          className="w-9 h-9 rounded-full bg-white text-gray-500 border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
              )}) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Nenhum lançamento encontrado.</td></tr>
              )}
            </tbody>
        </table>
      </div>

      {/* --- MODALS --- */}
      <NewInvoiceModal 
        isOpen={modalState.newInvoice} 
        onClose={() => setModalState(s => ({ ...s, newInvoice: false }))} 
        type={modalState.newInvoiceType} 
        onSave={createRecurringInvoices}
        onAddExtra={addQuickConsume}
        residents={residents} 
      />

      <InvoiceDetailsModal 
        invoice={modalState.details} 
        onClose={() => setModalState(s => ({ ...s, details: null }))}
        resident={residentsMap[modalState.details?.residentId || '']}
        onPay={() => initiatePayment(modalState.details ? [modalState.details.id] : [])}
      />

      {/* Novo Modal de Pagamento com Suporte a Parcial */}
      <PaymentModal 
        isOpen={modalState.payment}
        onClose={() => setModalState(s => ({ ...s, payment: false, paymentTargetIds: [] }))}
        onConfirm={handlePaymentConfirm}
        count={paymentCalculation.count}
        originalAmount={paymentCalculation.original}
        paidAmount={paymentCalculation.paid}
        remainingAmount={paymentCalculation.remaining}
      />

    </div>
  );
};
