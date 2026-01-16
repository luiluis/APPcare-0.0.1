
import React, { useState, useEffect } from 'react';
import { 
  X, PlusCircle, Receipt, Building2, Repeat, UploadCloud, 
  Paperclip, ShoppingCart, FileText, AlertCircle, User, 
  Truck, Wallet, Calendar 
} from 'lucide-react';
import { BRANCHES } from '../../constants';
import { Resident, InvoiceStatus, InvoiceCategory, CreateInvoiceDTO, QuickConsumeDTO } from '../../types';
import { getLocalISOString } from '../../lib/utils';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInvoiceDTO) => void;
  onAddExtra: (data: QuickConsumeDTO) => void;
  type: 'income' | 'expense';
  residents: Resident[];
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({ isOpen, onClose, onSave, onAddExtra, type, residents }) => {
  // Mode (Apenas para Receita): 'invoice' (Mensalidade) vs 'extra' (Consumo)
  const [incomeMode, setIncomeMode] = useState<'invoice' | 'extra'>('invoice');
  
  const [formData, setFormData] = useState({
    branchId: BRANCHES[0].id,
    residentId: '',
    supplier: '', // Apenas para Despesa
    description: '',
    amount: '',
    date: getLocalISOString(),
    status: InvoiceStatus.PENDING,
    category: type === 'income' ? InvoiceCategory.MENSALIDADE : InvoiceCategory.OUTROS,
    isRecurring: false,
    recurrenceCount: 12
  });
  
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState('');

  // Reset state when opening/closing or changing type
  useEffect(() => {
    if (isOpen) {
      setIncomeMode('invoice');
      setFormData(prev => ({
        ...prev,
        description: '',
        amount: '',
        residentId: '',
        supplier: '',
        category: type === 'income' ? InvoiceCategory.MENSALIDADE : InvoiceCategory.OUTROS,
        isRecurring: false,
        attachment: null
      }));
      setAttachment(null);
      setError('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const residentsFiltered = residents.filter(r => r.branchId === formData.branchId);
  const isIncome = type === 'income';

  const handleSubmit = () => {
    if (!formData.amount || !formData.date) {
      setError("Preencha valor e data.");
      return;
    }
    
    if (isIncome && !formData.residentId) {
      setError("Selecione um residente.");
      return;
    }

    if (!isIncome && !formData.description) {
        setError("Informe a descrição da despesa.");
        return;
    }

    setError('');
    
    // Fluxo 1: Receita - Item Extra (Adiciona a fatura existente)
    if (isIncome && incomeMode === 'extra') {
       onAddExtra({
         branchId: formData.branchId,
         residentId: formData.residentId,
         description: formData.description || 'Consumo Extra',
         amount: formData.amount,
         date: formData.date,
         category: formData.category,
         attachment: attachment
       });
    } 
    // Fluxo 2: Nova Fatura (Receita) ou Nova Despesa
    else {
       onSave({ 
         type,
         branchId: formData.branchId,
         residentId: formData.residentId,
         supplier: formData.supplier,
         description: formData.description || (isIncome ? 'Mensalidade' : 'Despesa'),
         amount: formData.amount,
         dueDate: formData.date,
         status: formData.status,
         category: formData.category,
         isRecurring: formData.isRecurring,
         recurrenceCount: formData.recurrenceCount,
         attachment: attachment 
       });
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* --- HEADER DIFFERENCIADO --- */}
        <div className={`p-6 pb-4 flex justify-between items-start ${isIncome ? 'bg-blue-50' : 'bg-rose-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl shadow-sm ${isIncome ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
              {isIncome ? <Wallet className="w-6 h-6" /> : <Receipt className="w-6 h-6" />}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isIncome ? 'text-blue-900' : 'text-rose-900'}`}>
                {isIncome ? 'Lançar Receita' : 'Registrar Despesa'}
              </h3>
              <p className={`text-sm ${isIncome ? 'text-blue-600' : 'text-rose-600'}`}>
                {isIncome ? 'Cobrança de Residentes' : 'Pagamento de Fornecedores'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {/* --- SELEÇÃO DE UNIDADE (Comum) --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Unidade</label>
                <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 text-sm"
                    value={formData.branchId}
                    onChange={e => setFormData({...formData, branchId: e.target.value, residentId: ''})}
                >
                    {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                </div>
            </div>

            {/* =================================================================================
                                          FLUXO DE RECEITA (INCOME)
               ================================================================================= */}
            {isIncome && (
                <>
                   {/* 1. QUEM PAGA? */}
                   <div>
                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5">Residente Pagante</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select 
                                className="w-full border border-blue-200 bg-blue-50/30 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                                value={formData.residentId}
                                onChange={e => setFormData({...formData, residentId: e.target.value})}
                            >
                                <option value="">Selecione o residente...</option>
                                {residentsFiltered.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                   </div>

                   {/* 2. O QUE É? (Selector) */}
                   <div className="bg-gray-100 p-1 rounded-xl flex">
                        <button 
                        onClick={() => { setIncomeMode('invoice'); setFormData(prev => ({...prev, category: InvoiceCategory.MENSALIDADE, description: ''})); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${incomeMode === 'invoice' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                        <FileText className="w-4 h-4" /> Mensalidade
                        </button>
                        <button 
                        onClick={() => { setIncomeMode('extra'); setFormData(prev => ({...prev, category: InvoiceCategory.FARMACIA, description: ''})); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${incomeMode === 'extra' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                        <ShoppingCart className="w-4 h-4" /> Item Extra
                        </button>
                   </div>

                   {/* 3. DETALHES DA COBRANÇA */}
                   <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        {incomeMode === 'invoice' ? (
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-500"
                                    placeholder="Mensalidade (Automático)"
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Item / Produto</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ex: Fralda G, Terapia..."
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        autoFocus
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Categoria</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none capitalize"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value as InvoiceCategory})}
                                    >
                                        {Object.values(InvoiceCategory).filter(c => c !== 'mensalidade').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Valor (R$)</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
                                placeholder="0,00"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                {incomeMode === 'invoice' ? 'Vencimento' : 'Data Consumo'}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-2 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                        </div>
                   </div>

                   {/* Recorrência (Apenas Mensalidade) */}
                   {incomeMode === 'invoice' && (
                       <div className="flex items-center gap-3 py-2">
                            <input 
                                type="checkbox" 
                                id="rec" 
                                className="w-4 h-4 text-blue-600 rounded"
                                checked={formData.isRecurring}
                                onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                            />
                            <label htmlFor="rec" className="text-sm text-gray-700 font-medium">Repetir pelos próximos meses?</label>
                       </div>
                   )}
                </>
            )}

            {/* =================================================================================
                                          FLUXO DE DESPESA (EXPENSE)
               ================================================================================= */}
            {!isIncome && (
                <>
                    {/* 1. PARA QUEM? */}
                    <div>
                        <label className="block text-xs font-bold text-rose-600 uppercase tracking-wide mb-1.5">Fornecedor / Favorecido</label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full border border-rose-200 bg-rose-50/30 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none text-gray-900 font-medium placeholder-gray-400"
                                placeholder="Ex: Enel, Sabesp, João Manutenção..."
                                value={formData.supplier}
                                onChange={e => setFormData({...formData, supplier: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* 2. O QUE É? */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Descrição da Despesa</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                                placeholder="Ex: Conta de Luz Outubro"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Categoria</label>
                            <select 
                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none capitalize"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value as InvoiceCategory})}
                            >
                                {Object.values(InvoiceCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Valor (R$)</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-gray-900"
                                placeholder="0,00"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* 3. QUANDO? */}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Vencimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-2 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                id="rec-exp" 
                                className="w-4 h-4 text-rose-600 rounded"
                                checked={formData.isRecurring}
                                onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                             />
                             <label htmlFor="rec-exp" className="text-sm text-gray-700 font-medium">Despesa Fixa?</label>
                        </div>
                    </div>
                </>
            )}

            {/* --- UPLOAD DE ANEXO (Comum) --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Comprovante / Nota Fiscal</label>
                <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center hover:bg-gray-50 transition-colors cursor-pointer relative flex items-center justify-center gap-3">
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                    />
                    {attachment ? (
                        <>
                            <Paperclip className="w-5 h-5 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{attachment.name}</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-500">Anexar documento</span>
                        </>
                    )}
                </div>
            </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-white transition-colors">Cancelar</button>
            <button 
                onClick={handleSubmit} 
                className={`flex-1 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 
                ${isIncome ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
                {isIncome 
                   ? (incomeMode === 'invoice' ? 'Gerar Cobrança' : 'Lançar Extra') 
                   : 'Salvar Despesa'}
            </button>
        </div>

      </div>
    </div>
  );
};
