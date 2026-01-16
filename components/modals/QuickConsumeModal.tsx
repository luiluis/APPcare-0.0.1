
import React, { useState } from 'react';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { BRANCHES } from '../../constants';
import { Resident, InvoiceCategory, QuickConsumeDTO } from '../../types';
import { getLocalISOString } from '../../lib/utils';

interface QuickConsumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QuickConsumeDTO) => void;
  residents: Resident[];
}

export const QuickConsumeModal: React.FC<QuickConsumeModalProps> = ({ isOpen, onClose, onSave, residents }) => {
  const [formData, setFormData] = useState<QuickConsumeDTO>({
    branchId: BRANCHES[0].id,
    residentId: '',
    description: '',
    amount: '',
    date: getLocalISOString(),
    category: InvoiceCategory.FARMACIA
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const residentsFiltered = residents.filter(r => r.branchId === formData.branchId);

  const handleSubmit = () => {
    if (!formData.residentId || !formData.description || !formData.amount) {
      setError("Preencha todos os campos.");
      return;
    }
    setError('');
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600"><ShoppingCart className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-gray-900">Lançar Extra</h3>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="space-y-5">
          <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-800 border border-amber-100 flex gap-3 items-start">
             <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <p>Adiciona à fatura aberta do mês atual automaticamente.</p>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Unidade</label>
             <select 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none"
                value={formData.branchId}
                onChange={e => setFormData({...formData, branchId: e.target.value, residentId: ''})}
             >
               {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Residente</label>
             <select 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none"
                value={formData.residentId}
                onChange={e => setFormData({...formData, residentId: e.target.value})}
             >
               <option value="">Selecione...</option>
               {residentsFiltered.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
             </select>
          </div>

          <div className="grid grid-cols-3 gap-5">
             <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item</label>
                <input 
                  type="text"
                  placeholder="Ex: Fralda G"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Valor</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
             </div>
          </div>

          <button onClick={handleSubmit} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-xl shadow-md mt-4">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
