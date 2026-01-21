
import React, { useState } from 'react';
import { X, Printer, HelpCircle, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { PayrollCalculationResult } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface PayrollDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffRole: string;
  competence: string; // Ex: "Outubro/2023"
  calculation: PayrollCalculationResult | null;
}

export const PayrollDetailModal: React.FC<PayrollDetailModalProps> = ({
  isOpen,
  onClose,
  staffName,
  staffRole,
  competence,
  calculation
}) => {
  const [showExplainer, setShowExplainer] = useState(false);

  if (!isOpen || !calculation) return null;

  const inssItem = calculation.items.find(i => i.id === 'inss');
  // Recupera a memória de cálculo que foi concatenada com ' | ' no hook
  const inssBreakdown = inssItem?.description ? inssItem.description.split(' | ') : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Estilo Institucional */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{staffName}</h2>
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
              {calculation.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 py-3 px-4 hover:bg-blue-50/30 transition-colors items-center">
                  <div className="col-span-6 font-medium text-gray-900">
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
                  <p className="text-gray-900 font-bold tabular-nums">{formatCurrency(calculation.grossTotal)}</p>
                </div>
                <div className="text-right border-r border-gray-200 pr-6">
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Descontos</p>
                  <p className="text-rose-600 font-bold tabular-nums">{formatCurrency(calculation.discountTotal)}</p>
                </div>
                <div className="text-right bg-emerald-100/50 -my-4 -mr-4 p-4 flex flex-col justify-center rounded-l-xl">
                  <p className="text-xs text-emerald-800 uppercase font-extrabold">Salário Líquido</p>
                  <p className="text-xl text-emerald-700 font-bold tabular-nums">{formatCurrency(calculation.netTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo (Accordion) */}
          {inssBreakdown.length > 0 && (
            <div className="mt-6 border border-indigo-100 rounded-xl bg-indigo-50/30 overflow-hidden">
              <button 
                onClick={() => setShowExplainer(!showExplainer)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Entenda o cálculo do INSS (Progressivo)
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
                       <span className="text-indigo-600 font-bold">Total INSS: {formatCurrency(inssItem?.amount)}</span>
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
