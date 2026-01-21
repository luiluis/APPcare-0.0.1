
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, Wallet, CreditCard, DollarSign, Calculator } from 'lucide-react';
import { getLocalISOString, formatCurrency, toCents } from '../../lib/utils';
import { PaymentConfirmDTO } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, data: PaymentConfirmDTO) => void;
  originalAmount: number; // Valor Total da Fatura (Em Centavos)
  paidAmount: number;     // Quanto já foi pago antes (Em Centavos)
  remainingAmount: number;// Quanto falta (Em Centavos)
  count: number;          // Quantos itens selecionados
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  originalAmount, 
  paidAmount, 
  remainingAmount, 
  count 
}) => {
  const [amountToPay, setAmountToPay] = useState<string>('');
  
  const [formData, setFormData] = useState<PaymentConfirmDTO>({
    paymentDate: getLocalISOString(),
    paymentMethod: 'pix',
    paymentAccount: 'itau_matriz'
  });

  // Ao abrir, sugere o valor restante total
  // CRÍTICO: remainingAmount vem em centavos (ex: 12050), input espera float (120.50)
  useEffect(() => {
    if (isOpen) {
      setAmountToPay((remainingAmount / 100).toFixed(2));
    }
  }, [isOpen, remainingAmount]);

  const handleConfirm = () => {
      // 1. Converte input visual (float string) para centavos para validação segura
      const valueInCents = toCents(amountToPay);
      
      if (valueInCents <= 0) {
          alert("O valor do pagamento deve ser maior que zero.");
          return;
      }

      // Validação Inteiro vs Inteiro para evitar erros de ponto flutuante
      // Margem de erro de 1 centavo permitida
      if (valueInCents > remainingAmount + 1) { 
          if(!confirm("O valor digitado é maior que a dívida restante. Deseja prosseguir mesmo assim?")) return;
      }

      // 2. Passa o valor float para o hook (que fará a multiplicação por 100 internamente)
      // Mantemos parseFloat aqui pois a assinatura do onConfirm espera number (float da UI)
      // O hook usePaymentProcessing faz Math.round(amount * 100)
      onConfirm(parseFloat(amountToPay), formData);
  };

  if (!isOpen) return null;

  const isMultiple = count > 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Registrar Pagamento</h3>
              <p className="text-emerald-100 text-xs font-medium">
                {isMultiple ? `${count} itens selecionados` : 'Baixa individual'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Original</p>
                    <p className="text-sm font-bold text-gray-700">{formatCurrency(originalAmount)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Já Pago</p>
                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(paidAmount)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Restante</p>
                    <p className="text-sm font-bold text-blue-700">{formatCurrency(remainingAmount)}</p>
                </div>
            </div>

            {/* Input Principal */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Valor do Pagamento (R$)</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-lg">R$</span>
                    </div>
                    <input 
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold text-gray-900 focus:ring-0 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={amountToPay}
                        onChange={e => setAmountToPay(e.target.value)}
                        autoFocus
                    />
                    {isMultiple && (
                        <div className="mt-2 flex items-start gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg">
                            <Calculator className="w-3 h-3 mt-0.5" />
                            <span>Atenção: Para múltiplos itens, o valor será distribuído ou aplicado integralmente.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Detalhes (Data, Método, Conta) */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Data</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:border-emerald-500 outline-none"
                                value={formData.paymentDate}
                                onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Método</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select 
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:border-emerald-500 outline-none bg-white appearance-none"
                                value={formData.paymentMethod}
                                onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                            >
                                <option value="pix">PIX</option>
                                <option value="boleto">Boleto</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                                <option value="transferencia">TED/DOC</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Conta de Destino/Origem</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:border-emerald-500 outline-none bg-white appearance-none"
                            value={formData.paymentAccount}
                            onChange={e => setFormData({...formData, paymentAccount: e.target.value})}
                        >
                            <option value="itau_matriz">Banco Itaú - Matriz</option>
                            <option value="bb_matriz">Banco do Brasil - Matriz</option>
                            <option value="cx_filial">Caixa Econômica - Filial</option>
                            <option value="caixinha">Caixinha (Espécie)</option>
                        </select>
                    </div>
                </div>
            </div>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-white transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-5 h-5" /> Confirmar Baixa
          </button>
        </div>

      </div>
    </div>
  );
};
