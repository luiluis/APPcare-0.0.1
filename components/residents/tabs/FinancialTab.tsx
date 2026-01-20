
import React, { useState } from 'react';
import { Resident, Invoice, Contact, InvoiceStatus, FeeConfig } from '../../../types';
import { User, Phone, Mail, MapPin, CreditCard, Edit2, Save, Receipt, CheckCircle2, AlertCircle, X, Calculator, Percent, Banknote, Plus, Calendar, PieChart, Download } from 'lucide-react';
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
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [updatePending, setUpdatePending] = useState(true); // Toggle para atualizar financeiro
  
  // --- CONTACT LOGIC ---
  const responsibleContactIndex = resident.medicalRecord?.contacts.findIndex(c => c.isFinancialResponsible) ?? -1;
  const currentContact = responsibleContactIndex >= 0 ? resident.medicalRecord?.contacts[responsibleContactIndex] : {
      name: '', relation: 'Responsável', phone: '', email: '', cpf: '', address: '', isFinancialResponsible: true
  };
  const [contactForm, setContactForm] = useState<Contact>(currentContact!);

  // --- FEE LOGIC ---
  const initialFee: FeeConfig = resident.feeConfig || {
      baseValue: 0,
      careLevelAdjustment: 0,
      fixedExtras: 0,
      discount: 0,
      notes: '',
      paymentDay: 5
  };
  const [feeForm, setFeeForm] = useState<FeeConfig>(initialFee);

  const residentInvoices = invoices.filter(inv => inv.residentId === resident.id).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // --- SAVE HANDLERS ---
  const handleSaveContact = () => {
    if (!resident.medicalRecord) return;
    const updatedContacts = [...resident.medicalRecord.contacts];
    
    // Ensure flag is set
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

  const handleSaveFee = () => {
      // Use the smarter handler if available, otherwise fallback to basic update
      if (onUpdateFee) {
          onUpdateFee(resident.id, feeForm, updatePending);
      } else {
          onUpdateResident({
              ...resident,
              feeConfig: feeForm,
              benefitValue: feeForm.baseValue + feeForm.careLevelAdjustment + feeForm.fixedExtras - feeForm.discount
          });
      }
      setIsEditingFee(false);
  };

  const calculateTotal = () => {
      return (feeForm.baseValue || 0) + (feeForm.careLevelAdjustment || 0) + (feeForm.fixedExtras || 0) - (feeForm.discount || 0);
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-sm transition-all";
  const labelStyle = "text-xs font-bold text-gray-400 uppercase mb-1 block";

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
                        <label className={labelStyle}>CPF</label>
                         {isEditingContact ? (
                            <input 
                                type="text" 
                                className={inputStyle}
                                value={contactForm.cpf || ''}
                                placeholder="000.000.000-00"
                                onChange={e => setContactForm({...contactForm, cpf: e.target.value})}
                            />
                        ) : (
                            <p className="text-gray-900 font-medium text-sm">{contactForm.cpf || '-'}</p>
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

                    <div>
                        <label className={labelStyle}>Email</label>
                         {isEditingContact ? (
                            <input 
                                type="email" 
                                className={inputStyle}
                                value={contactForm.email || ''}
                                onChange={e => setContactForm({...contactForm, email: e.target.value})}
                            />
                        ) : (
                            <p className="text-gray-900 font-medium flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /> {contactForm.email || '-'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- COMPOSIÇÃO DA MENSALIDADE (Nova Lógica) --- */}
            <div className={`bg-blue-50 border rounded-xl p-6 shadow-sm transition-all ${isEditingFee ? 'border-blue-400 ring-2 ring-blue-100' : 'border-blue-100'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-blue-900 font-bold flex items-center gap-2">
                        <Banknote className="w-5 h-5" /> Contrato & Mensalidade
                    </h4>
                    <button 
                        onClick={() => isEditingFee ? handleSaveFee() : setIsEditingFee(true)}
                        className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${isEditingFee ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-100 border border-blue-200'}`}
                    >
                        {isEditingFee ? 'CONFIRMAR' : 'ALTERAR'}
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-800">Dia de Vencimento</span>
                        {isEditingFee ? (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-500" />
                                <input type="number" min="1" max="31" className="w-16 text-center p-1 rounded border border-blue-300 text-sm font-bold" value={feeForm.paymentDay} onChange={e => setFeeForm({...feeForm, paymentDay: parseInt(e.target.value) || 1})} />
                            </div>
                        ) : (
                            <span className="font-semibold text-blue-900">Dia {feeForm.paymentDay}</span>
                        )}
                    </div>

                    <div className="h-px bg-blue-200 my-2"></div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-800">Valor Base (Hospedagem)</span>
                        {isEditingFee ? (
                            <input type="number" className="w-24 text-right p-1 rounded border border-blue-300 text-sm" value={feeForm.baseValue} onChange={e => setFeeForm({...feeForm, baseValue: parseFloat(e.target.value) || 0})} />
                        ) : (
                            <span className="font-semibold text-blue-900">{formatCurrency(feeForm.baseValue)}</span>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3"/> Adicional Grau {resident.careLevel}</span>
                        {isEditingFee ? (
                            <input type="number" className="w-24 text-right p-1 rounded border border-blue-300 text-sm" value={feeForm.careLevelAdjustment} onChange={e => setFeeForm({...feeForm, careLevelAdjustment: parseFloat(e.target.value) || 0})} />
                        ) : (
                            <span className="font-semibold text-blue-900">{formatCurrency(feeForm.careLevelAdjustment)}</span>
                        )}
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3"/> Extras Fixos</span>
                        {isEditingFee ? (
                            <input type="number" className="w-24 text-right p-1 rounded border border-blue-300 text-sm" value={feeForm.fixedExtras} onChange={e => setFeeForm({...feeForm, fixedExtras: parseFloat(e.target.value) || 0})} />
                        ) : (
                            <span className="font-semibold text-blue-900">{formatCurrency(feeForm.fixedExtras)}</span>
                        )}
                    </div>

                    {(feeForm.discount > 0 || isEditingFee) && (
                        <div className="flex justify-between items-center text-sm text-green-700">
                            <span className="flex items-center gap-1"><Percent className="w-3 h-3"/> Descontos</span>
                            {isEditingFee ? (
                                <input type="number" className="w-24 text-right p-1 rounded border border-green-300 text-sm text-green-700 bg-green-50" value={feeForm.discount} onChange={e => setFeeForm({...feeForm, discount: parseFloat(e.target.value) || 0})} />
                            ) : (
                                <span className="font-semibold">- {formatCurrency(feeForm.discount)}</span>
                            )}
                        </div>
                    )}
                    
                    <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                        <span className="font-bold text-blue-900 uppercase text-xs">Total Mensal</span>
                        <span className="text-2xl font-bold text-blue-700">{formatCurrency(calculateTotal())}</span>
                    </div>

                    {/* Observações Contratuais */}
                    <div className="pt-2">
                        <label className="text-[10px] font-bold text-blue-400 uppercase">Notas do Contrato</label>
                        {isEditingFee ? (
                            <textarea 
                                className="w-full mt-1 p-2 text-sm rounded border border-blue-300 bg-white" 
                                rows={2}
                                value={feeForm.notes}
                                onChange={e => setFeeForm({...feeForm, notes: e.target.value})}
                            ></textarea>
                        ) : (
                            <p className="text-xs text-blue-800 italic bg-blue-100/50 p-2 rounded">{feeForm.notes || 'Sem observações.'}</p>
                        )}
                    </div>

                    {/* Checkbox para Atualizar Financeiro */}
                    {isEditingFee && (
                        <div className="mt-3 bg-blue-100/50 p-2 rounded flex items-start gap-2 border border-blue-200 animate-in fade-in">
                            <input 
                                type="checkbox" 
                                id="updatePending" 
                                className="mt-1 w-4 h-4 text-blue-600 rounded"
                                checked={updatePending}
                                onChange={e => setUpdatePending(e.target.checked)}
                            />
                            <label htmlFor="updatePending" className="text-xs text-blue-900 font-medium cursor-pointer leading-tight">
                                Atualizar automaticamente o valor das faturas pendentes futuras para R$ {calculateTotal().toFixed(2)}?
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Coluna 2: Histórico Financeiro */}
        <div className="lg:col-span-2 space-y-6">
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
                                    
                                    {/* Coluna Valor (Com destaque para parcial) */}
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-bold">{formatCurrency(inv.totalAmount)}</div>
                                        {paidAmount > 0 && (
                                            <div className="text-xs font-medium text-emerald-600 mt-0.5">
                                                Pago: {formatCurrency(paidAmount)}
                                            </div>
                                        )}
                                    </td>

                                    {/* Coluna Status (Com badge parcial) */}
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

                                    {/* Coluna Recibo (Novo) */}
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
    </div>
  );
};
