
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Save, Send, AlertCircle, Edit3 } from 'lucide-react';
import { generateHandoverSummary } from '../../services/geminiService.ts';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift: 'Manhã' | 'Tarde' | 'Noite';
  logs: string[];
  onSave: (summary: string) => Promise<void>;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  currentShift,
  logs,
  onSave
}) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && logs.length > 0) {
      handleGenerate();
    } else if (isOpen && logs.length === 0) {
      setSummary('Nenhum log relevante encontrado para as últimas 12 horas.');
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateHandoverSummary(logs);
      setSummary(result);
    } catch (err) {
      setError("Não foi possível gerar o resumo automaticamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!summary || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(summary);
      onClose();
    } catch (err) {
      setError("Erro ao salvar a evolução de passagem de plantão.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Resumo de Plantão Inteligente</h3>
              <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest">Turno: {currentShift}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Analisando registros...</p>
                <p className="text-sm text-gray-500">A IA está identificando anomalias e estruturando os destaques clínicos.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Resumo Estruturado (Editável)
                </label>
                <button 
                  onClick={handleGenerate}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Regerar
                </button>
              </div>
              
              <textarea
                className="w-full h-80 border-2 border-indigo-50 rounded-2xl p-6 text-gray-700 leading-relaxed outline-none focus:border-indigo-200 transition-all resize-none bg-indigo-50/10 font-medium"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="O resumo aparecerá aqui..."
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-tight">
                  <strong>Nota Importante:</strong> Revise o conteúdo gerado pela IA. Este resumo será salvo no prontuário de cada residente mencionado como uma evolução de <strong>Passagem de Plantão</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-white border border-gray-200 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isLoading || !summary || isSaving}
            className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <><Send className="w-5 h-5"/> Confirmar e Enviar</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
