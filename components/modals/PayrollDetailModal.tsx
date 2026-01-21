
import React, { useState, useMemo } from 'react';
import { X, Printer, HelpCircle, ChevronDown, ChevronUp, Calculator, FileText, AlertCircle } from 'lucide-react';
import { PayrollCalculationResult, Invoice } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface PayrollDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffRole: string;
  competence: string; // Ex: "Outubro/2023"
  calculation?: PayrollCalculationResult | null;
  invoice?: Invoice | null; // Nova prop opcional para exibir fatura já gerada
}

export const PayrollDetailModal: React.FC<PayrollDetailModalProps> = ({
  isOpen,
  onClose,
  staffName,
  staffRole,
  competence,
  calculation,
  invoice
}) => {
  const [showExplainer, setShowExplainer] = useState(false);

  // Normalização dos Dados (Adapter Pattern)
  const displayData = useMemo(() => {
    // 1. Prioridade: Fatura Gerada (Dados Reais/Persistidos)
    if (invoice) {
        const items = invoice.items.map(item => ({
            id: item.id,
            label: item.description,
            // Tenta extrair referência do texto se possível, senão vazio
            reference: item.description.includes('(') ? item.description.match(/\((.*?)\)/)?.[1] : '-',
            // Na fatura, descontos são salvos como negativos
            type: item.amount < 0 ? 'deduction' : 'earning',
            amount: Math.abs(item.amount),
            originalAmount: item.amount
        }));

        const gross = items.filter(i => i.type === 'earning').reduce((acc, i) => acc + i.amount, 0);
        const discount = items.filter(i => i.type === 'deduction').reduce((acc, i) => acc + i.amount, 0);

        return {
            mode: 'invoice',
            items,
            grossTotal: gross,
            discountTotal: discount,
            netTotal: invoice.totalAmount,
            inssItem: null // Faturas simples perdem a memória de cálculo detalhada
        };
    }

    // 2. Fallback: Simulação em Tempo Real
    if (calculation) {
        return {
            mode: 'simulation',
            items: calculation.items,
            grossTotal: calculation.grossTotal,
            discountTotal: calculation.discountTotal,
            netTotal: calculation.netTotal,
            inssItem: calculation.items.find(i => i.id === 'inss')
        };
    }

    return null;
  }, [invoice, calculation]);

  if (!isOpen || !displayData) return null;

  // Recupera a memória de cálculo (apenas disponível em modo Simulação)
  const inssBreakdown = displayData.inssItem?.description ? displayData.inssItem.description.split(' | ') : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Estilo Institucional */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{staffName}</h2>
                {displayData.mode === 'simulation' ? (
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Simulação (Prévia)
                    </span>
                ) : (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Folha Oficial
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm mt-1">
              <span className="uppercase tracking-wider font-semibold">{staffRole}</span>
              <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
              <span>Ref: {competence}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Imprimir">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Holerite */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Cabeçalho da Tabela */}
            <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide py-3 px-4">
              <div className="col-span-6">Descrição</div>
              <div className="col-span-2 text-center">Ref.</div>
              <div className="col-span-2 text-right text-emerald-700">Vencimentos</div>
              <div className="col-span-2 text-right text-rose-700">Descontos</div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-gray-100 text-sm">
              {displayData.items.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 py-3 px-4 hover:bg-blue-50/30 transition-colors items-center">
                  <div className="col-span-6 font-medium text-gray-900 truncate pr-2">
                    {item.label}
                  </div>
                  <div className="col-span-2 text-center text-gray-500 text-xs">
                    {item.reference || '-'}
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-gray-700">
                    {item.type === 'earning' ? formatCurrency(item.amount) : '0,00'}
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-rose-600">
                    {item.type === 'deduction' ? formatCurrency(item.amount) : '0,00'}
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé de Totais */}
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-right border-r border-gray-200 pr-6">
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Bruto</p>
                  <p className="text-gray-900 font-bold tabular-nums">{formatCurrency(displayData.grossTotal)}</p>
                </div>
                <div className="text-right border-r border-gray-200 pr-6">
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Descontos</p>
                  <p className="text-rose-600 font-bold tabular-nums">{formatCurrency(displayData.discountTotal)}</p>
                </div>
                <div className="text-right bg-emerald-100/50 -my-4 -mr-4 p-4 flex flex-col justify-center rounded-l-xl">
                  <p className="text-xs text-emerald-800 uppercase font-extrabold">Salário Líquido</p>
                  <p className="text-xl text-emerald-700 font-bold tabular-nums">{formatCurrency(displayData.netTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo (Apenas Simulação) */}
          {displayData.mode === 'simulation' && inssBreakdown.length > 0 && (
            <div className="mt-6 border border-indigo-100 rounded-xl bg-indigo-50/30 overflow-hidden">
              <button 
                onClick={() => setShowExplainer(!showExplainer)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Entenda o cálculo do INSS (Simulado)
                </div>
                {showExplainer ? <ChevronUp className="w-4 h-4 text-indigo-400"/> : <ChevronDown className="w-4 h-4 text-indigo-400"/>}
              </button>
              
              {showExplainer && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                  <div className="bg-white p-4 rounded-lg border border-indigo-100 text-xs text-gray-600 space-y-2 shadow-sm">
                    <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Calculator className="w-3 h-3" /> Memória de Cálculo:
                    </p>
                    {inssBreakdown.map((line, idx) => (
                      <div key={idx} className="flex justify-between border-b border-gray-50 pb-1 last:border-0">
                        <span>{line.split('=')[0]}</span>
                        <span className="font-mono font-bold text-gray-800">={line.split('=')[1]}</span>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                       <span className="text-indigo-600 font-bold">Total INSS: {formatCurrency(displayData.inssItem?.amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
