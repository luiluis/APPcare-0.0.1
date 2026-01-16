
import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Wallet, CreditCard } from 'lucide-react';
import { getLocalISOString } from '../../lib/utils';
import { PaymentConfirmDTO } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PaymentConfirmDTO) => void;
  totalAmount: number;
  count: number; // Quantos itens estão sendo baixados
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, totalAmount, count }) => {
  const [formData, setFormData] = useState<PaymentConfirmDTO>({
    paymentDate: getLocalISOString(),
    paymentMethod: 'pix',
    paymentAccount: 'itau_matriz'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Confirmar Baixa</h3>
              <p className="text-xs text-gray-500">Conciliação Financeira</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex justify-between items-center">
           <span className="text-gray-600 font-medium text-sm">{count} Lançamento(s) selecionado(s)</span>
           <span className="text-emerald-700 font-bold text-lg">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
           </span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Data do Pagamento</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-900 shadow-sm"
                value={formData.paymentDate}
                onChange={e => setFormData({...formData, paymentDate: e.target.value})}
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Forma de Pagamento</label>
             <div className="relative">
               <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <select 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-900 shadow-sm appearance-none"
                  value={formData.paymentMethod}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
               >
                 <option value="pix">PIX</option>
                 <option value="boleto">Boleto Bancário</option>
                 <option value="transferencia">TED / DOC</option>
                 <option value="dinheiro">Dinheiro (Espécie)</option>
                 <option value="cartao_credito">Cartão de Crédito</option>
                 <option value="cheque">Cheque</option>
               </select>
             </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Conta de Saída/Entrada</label>
             <div className="relative">
               <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <select 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-900 shadow-sm appearance-none"
                  value={formData.paymentAccount}
                  onChange={e => setFormData({...formData, paymentAccount: e.target.value})}
               >
                 <option value="itau_matriz">Banco Itaú - Matriz</option>
                 <option value="bb_matriz">Banco do Brasil - Matriz</option>
                 <option value="cx_filial">Caixinha (Petty Cash) - Filial</option>
                 <option value="inter_filial">Banco Inter - Filial</option>
               </select>
             </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(formData)}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
          >
            Confirmar Baixa
          </button>
        </div>

      </div>
    </div>
  );
};
