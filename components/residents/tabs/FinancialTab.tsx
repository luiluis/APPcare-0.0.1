
import React, { useState, useMemo } from 'react';
import { Resident, Invoice, Contact, InvoiceStatus, FeeConfig, ContractRecord } from '../../../types';
import { User, Phone, Mail, CreditCard, Edit2, Save, Receipt, CheckCircle2, AlertCircle, X, Percent, Banknote, Plus, Calendar, PieChart, Download, History, ArrowRight, TrendingUp } from 'lucide-react';
import { formatDateBr, formatCurrency } from '../../../lib/utils';
import { generateInvoiceReceipt } from '../../../lib/pdfService';

interface FinancialTabProps {
  resident: Resident;
  invoices: Invoice[];
  onUpdateResident: (updated: Resident) => void;
  onUpdateFee?: (residentId: string, newFeeConfig: FeeConfig, updatePendingInvoices: boolean) => void;
}

export const FinancialTab: React.FC<FinancialTabProps> = ({ resident, invoices, onUpdateResident, onUpdateFee }) => {
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isReadjustModalOpen, setIsReadjustModalOpen] = useState(false);
  const [updatePending, setUpdatePending] = useState(true); 
  
  // --- CONTACT LOGIC ---
  const responsibleContactIndex = resident.medicalRecord?.contacts.findIndex(c => c.isFinancialResponsible) ?? -1;
  const currentContact = responsibleContactIndex >= 0 ? resident.medicalRecord?.contacts[responsibleContactIndex] : {
      name: '', relation: 'Responsável', phone: '', email: '', cpf: '', address: '', isFinancialResponsible: true
  };
  const [contactForm, setContactForm] = useState<Contact>(currentContact!);

  // --- FEE & CONTRACT LOGIC ---
  // Se existir feeConfig mas não histórico, criamos o primeiro registro de histórico virtualmente
  const currentFeeConfig = resident.feeConfig || {
      baseValue: 0,
      careLevelAdjustment: 0,
      fixedExtras: 0,
      discount: 0,
      notes: '',
      paymentDay: 5
  };

  const contractHistory = useMemo(() => {
      // Se já tiver histórico, usa. Se não, cria o inicial baseado no feeConfig atual
      if (resident.contractHistory && resident.contractHistory.length > 0) {
          // Ordena do mais recente para o mais antigo
          return [...resident.contractHistory].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      }
      return [{
          id: 'initial',
          startDate: resident.admissionDate,
          baseValue: currentFeeConfig.baseValue,
          careLevelAdjustment: currentFeeConfig.careLevelAdjustment,
          fixedExtras: currentFeeConfig.fixedExtras,
          discount: currentFeeConfig.discount,
          notes: 'Contrato Inicial',
          readjustmentIndex: 'Admissão'
      } as ContractRecord];
  }, [resident]);

  const activeContract = contractHistory[0]; // O mais recente é o vigente

  // Estado do Modal de Reajuste
  const [readjustForm, setReadjustForm] = useState<ContractRecord>({
      id: '',
      startDate: new Date().toISOString().split('T')[0],
      baseValue: activeContract.baseValue,
      careLevelAdjustment: activeContract.careLevelAdjustment,
      fixedExtras: activeContract.fixedExtras,
      discount: activeContract.discount,
      readjustmentIndex: 'IPCA',
      notes: ''
  });

  const residentInvoices = invoices.filter(inv => inv.residentId === resident.id).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // --- ACTIONS ---

  const handleSaveContact = () => {
    if (!resident.medicalRecord) return;
    const updatedContacts = [...resident.medicalRecord.contacts];
    const contactToSave = { ...contactForm, isFinancialResponsible: true };

    if (responsibleContactIndex >= 0) {
        updatedContacts[responsibleContactIndex] = contactToSave;
    } else {
        updatedContacts.push(contactToSave);
    }

    onUpdateResident({
        ...resident,
        medicalRecord: {
            ...resident.medicalRecord,
            contacts: updatedContacts
        }
    });
    setIsEditingContact(false);
  };

  const calculateTotal = (record: ContractRecord | FeeConfig) => {
      return (record.baseValue || 0) + (record.careLevelAdjustment || 0) + (record.fixedExtras || 0) - (record.discount || 0);
  };

  const openReadjustModal = () => {
      setReadjustForm({
          id: `ctr-${Date.now()}`,
          startDate: new Date().toISOString().split('T')[0],
          baseValue: activeContract.baseValue,
          careLevelAdjustment: activeContract.careLevelAdjustment,
          fixedExtras: activeContract.fixedExtras,
          discount: activeContract.discount,
          readjustmentIndex: 'IPCA',
          notes: ''
      });
      setIsReadjustModalOpen(true);
  };

  const confirmReadjustment = () => {
      // 1. Encerra o contrato anterior (define endDate como ontem em relação ao novo start)
      const newStartDate = new Date(readjustForm.startDate);
      const prevEndDate = new Date(newStartDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);

      const updatedHistory = contractHistory.map(c => {
          if (!c.endDate && c.startDate < readjustForm.startDate) {
              return { ...c, endDate: prevEndDate.toISOString().split('T')[0] };
          }
          return c;
      });

      // 2. Adiciona o novo contrato
      updatedHistory.push(readjustForm);

      // 3. Atualiza o snapshot feeConfig para refletir o contrato vigente (performance)
      const newFeeConfig: FeeConfig = {
          baseValue: readjustForm.baseValue,
          careLevelAdjustment: readjustForm.careLevelAdjustment,
          fixedExtras: readjustForm.fixedExtras,
          discount: readjustForm.discount,
          notes: readjustForm.notes || '',
          paymentDay: currentFeeConfig.paymentDay // Mantém o dia de vencimento
      };

      // 4. Salva tudo
      if (onUpdateFee) {
          // Se tiver handler específico (que atualiza faturas pendentes), usa
          onUpdateFee(resident.id, newFeeConfig, updatePending);
          // E atualiza o histórico localmente no residente
          onUpdateResident({
              ...resident,
              contractHistory: updatedHistory,
              feeConfig: newFeeConfig,
              benefitValue: calculateTotal(newFeeConfig)
          });
      } else {
          onUpdateResident({
              ...resident,
              contractHistory: updatedHistory,
              feeConfig: newFeeConfig,
              benefitValue: calculateTotal(newFeeConfig)
          });
      }

      setIsReadjustModalOpen(false);
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-sm transition-all";
  const labelStyle = "text-xs font-bold text-gray-400 uppercase mb-1 block";

  // Variação Percentual (Novo vs Anterior)
  const percentDiff = useMemo(() => {
      const oldTotal = calculateTotal(activeContract);
      const newTotal = calculateTotal(readjustForm);
      if (oldTotal === 0) return 0;
      return ((newTotal - oldTotal) / oldTotal) * 100;
  }, [activeContract, readjustForm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Coluna 1: Dados do Pagante */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" /> Responsável Financeiro
                    </h3>
                    <button 
                        onClick={() => isEditingContact ? handleSaveContact() : setIsEditingContact(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold ${isEditingContact ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white'}`}
                    >
                        {isEditingContact ? <><Save className="w-4 h-4" /> Salvar</> : <><Edit2 className="w-4 h-4" /> Editar</>}
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className={labelStyle}>Nome Completo</label>
                        {isEditingContact ? (
                            <input 
                                type="text" 
                                className={inputStyle}
                                value={contactForm.name}
                                onChange={e => setContactForm({...contactForm, name: e.target.value})}
                            />
                        ) : (
                            <p className="text-gray-900 font-medium flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" /> {contactForm.name || '-'}</p>
                        )}
                    </div>
                    {/* ... (Outros campos de contato mantidos iguais) ... */}
                    <div>
                        <label className={labelStyle}>Parentesco</label>
                         {isEditingContact ? (
                            <input 
                                type="text" 
                                className={inputStyle}
                                value={contactForm.relation}
                                onChange={e => setContactForm({...contactForm, relation: e.target.value})}
                            />
                        ) : (
                            <p className="text-gray-900 font-medium text-sm">{contactForm.relation || '-'}</p>
                        )}
                    </div>
                    <div>
                        <label className={labelStyle}>Telefone / WhatsApp</label>
                         {isEditingContact ? (
                            <input 
                                type="text" 
                                className={inputStyle}
                                value={contactForm.phone}
                                onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                            />
                        ) : (
                            <p className="text-gray-900 font-medium flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /> {contactForm.phone || '-'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTRATO VIGENTE --- */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden group">
                {/* Background Decorativo */}
                <Banknote className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-100 rotate-12 group-hover:rotate-6 transition-transform pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-blue-900 font-bold flex items-center gap-2">
                                <Banknote className="w-5 h-5" /> Contrato Vigente
                            </h4>
                            <p className="text-xs text-blue-600 mt-1">
                                Início: {formatDateBr(activeContract.startDate)} ({activeContract.readjustmentIndex || 'Original'})
                            </p>
                        </div>
                        <button 
                            onClick={openReadjustModal}
                            className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
                        >
                            <TrendingUp className="w-3 h-3" /> Reajustar
                        </button>
                    </div>

                    <div className="space-y-2 text-sm bg-white/60 p-3 rounded-lg border border-blue-100 mb-3 backdrop-blur-sm">
                        <div className="flex justify-between">
                            <span className="text-blue-800">Base</span>
                            <span className="font-semibold text-blue-900">{formatCurrency(activeContract.baseValue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-800">Grau {resident.careLevel}</span>
                            <span className="font-semibold text-blue-900">{formatCurrency(activeContract.careLevelAdjustment)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-800">Extras</span>
                            <span className="font-semibold text-blue-900">{formatCurrency(activeContract.fixedExtras)}</span>
                        </div>
                        {activeContract.discount > 0 && (
                            <div className="flex justify-between text-green-700">
                                <span>Desconto</span>
                                <span className="font-semibold">- {formatCurrency(activeContract.discount)}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="font-bold text-blue-900 uppercase text-xs">Total Mensal</span>
                        <span className="text-2xl font-extrabold text-blue-700">{formatCurrency(calculateTotal(activeContract))}</span>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2 text-xs text-blue-500 font-medium">
                        <Calendar className="w-3 h-3" /> Vencimento todo dia {currentFeeConfig.paymentDay}
                    </div>
                </div>
            </div>
        </div>

        {/* Coluna 2 e 3: Histórico e Faturas */}
        <div className="lg:col-span-2 space-y-6">
             
             {/* TIMELINE DE HISTÓRICO DE CONTRATOS */}
             {contractHistory.length > 1 && (
                 <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                     <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                         <History className="w-4 h-4 text-gray-400" /> Histórico de Reajustes
                     </h3>
                     <div className="flex gap-4 overflow-x-auto pb-2">
                         {contractHistory.slice(1).map((record) => (
                             <div key={record.id} className="min-w-[200px] bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col justify-between opacity-75 hover:opacity-100 transition-opacity">
                                 <div>
                                     <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-bold text-gray-500">{record.readjustmentIndex}</span>
                                         <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">
                                             {new Date(record.startDate).getFullYear()}
                                         </span>
                                     </div>
                                     <p className="text-gray-900 font-bold">{formatCurrency(calculateTotal(record))}</p>
                                 </div>
                                 <div className="mt-2 text-[10px] text-gray-400 border-t border-gray-200 pt-1">
                                     {formatDateBr(record.startDate)} até {record.endDate ? formatDateBr(record.endDate) : '...'}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* TABELA DE FATURAS */}
             <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-gray-400" /> Histórico de Faturas
                    </h3>
                    <button className="text-sm text-blue-600 font-bold hover:underline">Ver Extrato Completo</button>
                </div>
                
                {residentInvoices.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Vencimento</th>
                                <th className="px-6 py-3">Descrição</th>
                                <th className="px-6 py-3">Valor</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Recibo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {residentInvoices.map(inv => {
                                const paidAmount = inv.paidAmount || 0;
                                const isPartial = paidAmount > 0 && paidAmount < inv.totalAmount;

                                return (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-600 font-medium">{formatDateBr(inv.dueDate)}</td>
                                    <td className="px-6 py-4 text-gray-900 font-semibold">{inv.items[0]?.description}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-bold">{formatCurrency(inv.totalAmount)}</div>
                                        {paidAmount > 0 && (
                                            <div className="text-xs font-medium text-emerald-600 mt-0.5">
                                                Pago: {formatCurrency(paidAmount)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {inv.status === InvoiceStatus.PAID ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                <CheckCircle2 className="w-3 h-3" /> Pago
                                            </span>
                                        ) : isPartial ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                                                <PieChart className="w-3 h-3" /> Parcial
                                            </span>
                                        ) : inv.status === InvoiceStatus.OVERDUE ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                <AlertCircle className="w-3 h-3" /> Atrasado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                                                Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {inv.status === InvoiceStatus.PAID && (
                                            <button 
                                                onClick={() => generateInvoiceReceipt(inv, resident.name)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                                                title="Baixar Recibo"
                                            >
                                                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-gray-400">Nenhum histórico financeiro encontrado.</div>
                )}
             </div>
        </div>

        {/* --- MODAL DE REAJUSTE --- */}
        {isReadjustModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
                    <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-white" />
                            <div>
                                <h3 className="text-xl font-bold">Novo Reajuste</h3>
                                <p className="text-blue-100 text-xs">Atualizar valores contratuais</p>
                            </div>
                        </div>
                        <button onClick={() => setIsReadjustModalOpen(false)} className="hover:bg-blue-500 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* 1. Motivo e Data */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Índice / Motivo</label>
                                <select 
                                    className={inputStyle}
                                    value={readjustForm.readjustmentIndex}
                                    onChange={e => setReadjustForm({...readjustForm, readjustmentIndex: e.target.value})}
                                >
                                    <option value="IPCA">IPCA (Inflação)</option>
                                    <option value="IGPM">IGPM (Aluguel)</option>
                                    <option value="Manual">Negociação Manual</option>
                                    <option value="Aditivo">Aditivo Contratual</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Início Vigência</label>
                                <input 
                                    type="date" 
                                    className={inputStyle}
                                    value={readjustForm.startDate}
                                    onChange={e => setReadjustForm({...readjustForm, startDate: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* 2. Valores Novos */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Novos Valores</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Base (Hospedagem)</label>
                                    <input 
                                        type="number" 
                                        className={inputStyle} 
                                        value={readjustForm.baseValue} 
                                        onChange={e => setReadjustForm({...readjustForm, baseValue: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div>
                                    <label className={labelStyle}>Adic. Grau</label>
                                    <input 
                                        type="number" 
                                        className={inputStyle} 
                                        value={readjustForm.careLevelAdjustment} 
                                        onChange={e => setReadjustForm({...readjustForm, careLevelAdjustment: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div>
                                    <label className={labelStyle}>Extras Fixos</label>
                                    <input 
                                        type="number" 
                                        className={inputStyle} 
                                        value={readjustForm.fixedExtras} 
                                        onChange={e => setReadjustForm({...readjustForm, fixedExtras: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div>
                                    <label className={labelStyle}>Descontos</label>
                                    <input 
                                        type="number" 
                                        className={`${inputStyle} text-green-700 bg-green-50 border-green-200`} 
                                        value={readjustForm.discount} 
                                        onChange={e => setReadjustForm({...readjustForm, discount: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Resumo e Impacto */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase">Novo Total</p>
                                <p className="text-2xl font-extrabold text-blue-700">{formatCurrency(calculateTotal(readjustForm))}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-blue-800 uppercase">Variação</p>
                                <div className={`flex items-center gap-1 font-bold ${percentDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {percentDiff >= 0 ? <TrendingUp className="w-4 h-4"/> : <ArrowRight className="w-4 h-4 rotate-45"/>}
                                    {percentDiff.toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* 4. Opção de Atualizar Pendentes */}
                        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <input 
                                type="checkbox" 
                                id="updatePendingCheck" 
                                className="mt-1 w-4 h-4 text-blue-600 rounded"
                                checked={updatePending}
                                onChange={e => setUpdatePending(e.target.checked)}
                            />
                            <label htmlFor="updatePendingCheck" className="text-xs text-amber-900 cursor-pointer">
                                <strong>Atualizar faturas pendentes?</strong><br/>
                                Se marcado, as faturas futuras (não pagas) serão recalculadas com o novo valor.
                            </label>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t flex gap-3">
                        <button onClick={() => setIsReadjustModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-white border border-gray-200 rounded-xl transition-colors">Cancelar</button>
                        <button 
                            onClick={confirmReadjustment}
                            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            Confirmar Reajuste
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
