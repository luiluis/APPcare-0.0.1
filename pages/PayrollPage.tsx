
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, CheckCircle2, AlertCircle, 
  FileText, Wallet, ChevronLeft, ChevronRight, Calculator, Check,
  Info, RefreshCw, AlertTriangle, Loader2, Eye
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usePayrollLogic } from '../hooks/usePayrollLogic';
import { usePayrollGeneration } from '../hooks/usePayrollGeneration';
import { usePaymentProcessing } from '../hooks/usePaymentProcessing';
import { formatCurrency, formatDateBr } from '../lib/utils';
import { InvoiceStatus, InvoiceCategory, PayrollLineItem, PayrollCalculationResult, Invoice, TaxTable } from '../types';
import { StatCard } from '../components/StatCard';
import { PayrollDetailModal } from '../components/modals/PayrollDetailModal';
import { dataService } from '../services/dataService';

export const PayrollPage: React.FC = () => {
  const { staff, invoices, setInvoices, staffIncidents, selectedBranchId } = useData();
  const { calculateEstimatedSalary } = usePayrollLogic();
  const { generatePayrollInvoice, generatePayrollBatch, updatePayrollInvoice } = usePayrollGeneration({ invoices, onUpdateInvoices: setInvoices });
  const { registerPayment } = usePaymentProcessing({ invoices, onUpdateInvoices: setInvoices });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [taxTables, setTaxTables] = useState<{ inss: TaxTable, irrf: TaxTable } | null>(null);
  
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  // --- STATE DO MODAL DE DETALHES ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
      name: string;
      role: string;
      calculation: PayrollCalculationResult;
      invoice?: Invoice | null;
  } | null>(null);

  // --- CARREGA TABELAS FISCAIS ---
  useEffect(() => {
      const loadTables = async () => {
          try {
              const tables = await dataService.getTaxTables(year);
              setTaxTables(tables);
          } catch (e) {
              console.error("Failed to load tax tables", e);
          }
      };
      loadTables();
  }, [year]);

  // --- FILTRO DE FUNCIONÁRIOS (Por Unidade) ---
  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      s.active && 
      (selectedBranchId === 'all' || s.branchId === selectedBranchId)
    );
  }, [staff, selectedBranchId]);

  // --- MAPA MESTRE DA FOLHA ---
  const payrollMap = useMemo(() => {
    if (!taxTables) return [];

    return filteredStaff.map(employee => {
      // 1. Procura se já existe fatura de salário
      const existingInvoice = invoices.find(inv => 
        inv.type === 'expense' &&
        (inv.category === InvoiceCategory.SALARIO || inv.items[0]?.category === InvoiceCategory.SALARIO) &&
        inv.staffId === employee.id &&
        inv.month === month &&
        inv.year === year
      );

      // 2. Calcula estimativa usando tabelas dinâmicas
      const calculation = calculateEstimatedSalary(
          employee, 
          staffIncidents, 
          month, 
          year,
          taxTables.inss,
          taxTables.irrf
      );

      // 3. Verifica se o valor da fatura existente difere do cálculo atual
      const isOutdated = existingInvoice && 
                         existingInvoice.status !== InvoiceStatus.PAID && 
                         Math.abs(existingInvoice.totalAmount - calculation.netTotal) > 1;

      return {
        staff: employee,
        invoice: existingInvoice,
        calculation: calculation,
        finalAmount: existingInvoice ? existingInvoice.totalAmount : calculation.netTotal,
        status: existingInvoice ? existingInvoice.status : 'not_generated',
        isOutdated
      };
    });
  }, [filteredStaff, invoices, staffIncidents, month, year, calculateEstimatedSalary, taxTables]);

  // --- TOTALIZADORES ---
  const stats = useMemo(() => {
    return payrollMap.reduce((acc, curr) => {
      acc.totalValue += curr.finalAmount;
      if (curr.status === InvoiceStatus.PAID) acc.totalPaid += curr.finalAmount;
      if (curr.status === 'not_generated') acc.pendingGeneration++;
      if (curr.status === InvoiceStatus.PENDING) acc.pendingPayment++;
      return acc;
    }, { totalValue: 0, totalPaid: 0, pendingGeneration: 0, pendingPayment: 0 });
  }, [payrollMap]);

  // --- ACTIONS ---

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const handleGenerateBatch = async () => {
    const pendingItems = payrollMap.filter(i => i.status === 'not_generated');
    
    if (pendingItems.length === 0) return;

    if (!confirm(`Confirmar geração da folha para ${pendingItems.length} colaboradores?`)) return;

    setIsGenerating(true);

    setTimeout(() => {
        const dueDate = new Date(year, month, 5).toISOString().split('T')[0];
        
        const batchList = pendingItems.map(item => ({
            staff: item.staff,
            calculation: item.calculation
        }));

        const count = generatePayrollBatch(batchList, dueDate);

        setIsGenerating(false);
        
        alert(`✅ Folha de Pagamento gerada com sucesso!\n\nForam criados ${count} lançamentos financeiros.`);
    }, 500);
  };

  const handleQuickPay = (invoiceId: string, amount: number) => {
    if (confirm("Confirmar pagamento deste salário via PIX/Transferência?")) {
        const today = new Date().toISOString().split('T')[0];
        registerPayment(invoiceId, amount / 100, 'transferencia', today, 'Pagamento via Painel RH');
    }
  };

  const handleSyncInvoice = (item: typeof payrollMap[0]) => {
      if (!item.invoice) return;
      
      const msg = `ATENÇÃO: O valor da folha será atualizado.\n\n` +
                  `Valor Atual (Fatura): ${formatCurrency(item.invoice.totalAmount)}\n` +
                  `Novo Valor (Cadastro): ${formatCurrency(item.calculation.netTotal)}\n\n` +
                  `Deseja confirmar a atualização?`;

      if (confirm(msg)) {
          updatePayrollInvoice(
              item.invoice.id,
              item.staff,
              item.calculation,
              item.invoice.dueDate
          );
      }
  };

  const handleOpenDetail = (item: typeof payrollMap[0]) => {
      setSelectedDetail({
          name: item.staff.name,
          role: item.staff.role,
          calculation: item.calculation,
          invoice: item.invoice
      });
      setDetailModalOpen(true);
  };

  const getAdditionsSum = (items: PayrollLineItem[]) => {
      return items
        .filter(i => i.type === 'earning' && i.id !== 'base-salary')
        .reduce((acc, i) => acc + i.amount, 0);
  };

  if (!taxTables) {
      return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* HEADER & NAV */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
            <p className="text-gray-500 text-sm">Gestão de salários, adiantamentos e holerites.</p>
         </div>

         <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start md:self-auto items-center">
             <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
             <div className="px-4 text-center min-w-[160px]">
                 <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Competência</span>
                 <span className="text-lg font-bold text-gray-900 capitalize">
                    {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                 </span>
             </div>
             <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"><ChevronRight className="w-5 h-5"/></button>
         </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard 
            title="Total da Folha" 
            value={formatCurrency(stats.totalValue)} 
            icon={<DollarSign className="w-6 h-6"/>} 
            color="blue"
         />
         <StatCard 
            title="Pago" 
            value={formatCurrency(stats.totalPaid)} 
            icon={<CheckCircle2 className="w-6 h-6"/>} 
            color="green"
         />
         <StatCard 
            title="A Pagar" 
            value={`${stats.pendingPayment} func.`} 
            icon={<Wallet className="w-6 h-6"/>} 
            color="amber"
            trend={formatCurrency(stats.totalValue - stats.totalPaid)}
         />
         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-center items-center text-center">
             {stats.pendingGeneration > 0 ? (
                 <>
                    <p className="text-sm text-gray-500 mb-2">{stats.pendingGeneration} pendentes de geração</p>
                    <button 
                        onClick={handleGenerateBatch}
                        disabled={isGenerating}
                        className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${isGenerating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Calculator className="w-4 h-4" />} 
                        {isGenerating ? 'Processando...' : 'Gerar Folha'}
                    </button>
                 </>
             ) : (
                 <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="font-bold text-gray-900">Folha Gerada</p>
                    <p className="text-xs text-gray-500">Todos os lançamentos criados.</p>
                 </>
             )}
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-200">
                  <tr>
                      <th className="px-6 py-4">Colaborador</th>
                      <th className="px-6 py-4 text-right">Salário Base</th>
                      <th className="px-6 py-4 text-right">Adicionais</th>
                      <th className="px-6 py-4 text-right">Descontos</th>
                      <th className="px-6 py-4 text-right bg-blue-50/30">Líquido</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {payrollMap.map((item) => {
                      const isGenerated = item.status !== 'not_generated';
                      const additions = getAdditionsSum(item.calculation.items);
                      
                      return (
                          <tr key={item.staff.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-6 py-4">
                                  <div>
                                      <p className="font-bold text-gray-900">{item.staff.name}</p>
                                      <p className="text-xs text-gray-500">{item.staff.role}</p>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-600">
                                  {formatCurrency(item.calculation.baseSalary)}
                              </td>
                              <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                                  + {formatCurrency(additions)}
                              </td>
                              <td className="px-6 py-4 text-right text-rose-600 font-medium">
                                  - {formatCurrency(item.calculation.discountTotal)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-900 bg-blue-50/30">
                                  {formatCurrency(item.finalAmount)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  {item.status === 'not_generated' && <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-bold uppercase">Simulação</span>}
                                  {item.status === InvoiceStatus.PENDING && (
                                      <div className="flex items-center justify-center gap-1.5">
                                          <span className="inline-flex px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold uppercase">Pendente</span>
                                          {item.isOutdated && (
                                              <div className="text-amber-500 animate-pulse" title="Valor diverge do cadastro atual. Necessário recalcular.">
                                                  <AlertTriangle className="w-4 h-4" />
                                              </div>
                                          )}
                                      </div>
                                  )}
                                  {item.status === InvoiceStatus.PAID && <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Pago</span>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                      {/* Botão de Detalhes (Sempre Visível) */}
                                      <button 
                                          onClick={() => handleOpenDetail(item)}
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                          title={isGenerated ? "Ver Holerite Detalhado" : "Ver Simulação de Cálculo"}
                                      >
                                          {isGenerated ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>

                                      {isGenerated && (
                                          <>
                                            {item.isOutdated && (
                                                <button 
                                                    onClick={() => handleSyncInvoice(item)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 bg-amber-50/50 rounded-lg transition-colors border border-amber-200"
                                                    title={`Recalcular: Valor Fatura (${formatCurrency(item.invoice?.totalAmount)}) ≠ Novo Cálculo (${formatCurrency(item.calculation.netTotal)})`}
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            {item.status !== InvoiceStatus.PAID && (
                                                <button 
                                                    onClick={() => handleQuickPay(item.invoice!.id, item.finalAmount)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                                    title="Confirmar Pagamento"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                          </>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
          
          {payrollMap.length === 0 && (
              <div className="p-10 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p>Nenhum colaborador encontrado para a unidade selecionada.</p>
              </div>
          )}
      </div>

      <PayrollDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        staffName={selectedDetail?.name || ''}
        staffRole={selectedDetail?.role || ''}
        competence={selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        calculation={selectedDetail?.calculation || null}
        invoice={selectedDetail?.invoice || null}
      />

    </div>
  );
};
