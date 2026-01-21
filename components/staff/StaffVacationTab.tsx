
import React, { useState, useMemo } from 'react';
import { Staff, VacationRecord, StaffIncident } from '../../types';
import { useVacationLogic } from '../../hooks/useVacationLogic';
import { Palmtree, Calendar, Plus, AlertTriangle, CheckCircle2, Calculator, Save, Loader2, X } from 'lucide-react';
import { formatDateBr } from '../../lib/utils';
import { dataService } from '../../services/dataService';

interface StaffVacationTabProps {
  staff: Staff;
  onUpdateStaff: (updated: Staff) => void;
  onRefreshIncidents?: () => void; // Para atualizar a aba de prontuário se necessário
}

export const StaffVacationTab: React.FC<StaffVacationTabProps> = ({ staff, onUpdateStaff, onRefreshIncidents }) => {
  const { calculateVacationStatus } = useVacationLogic();
  const status = useMemo(() => calculateVacationStatus(staff), [staff]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [soldDays, setSoldDays] = useState(0);
  const [sellOption, setSellOption] = useState(false);

  // Computed Duration
  const duration = useMemo(() => {
      if (!startDate || !endDate) return 0;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia final
      return diffDays;
  }, [startDate, endDate]);

  const handleSave = async () => {
      if (!status || !startDate || !endDate) return;
      
      // Validações básicas
      if (duration + (sellOption ? soldDays : 0) > status.remainingDays) {
          if (!confirm("O período selecionado ultrapassa o saldo calculado. Deseja continuar mesmo assim?")) return;
      }

      setIsProcessing(true);

      try {
          // 1. Cria o registro de férias
          const newRecord: VacationRecord = {
              id: `vac-${Date.now()}`,
              periodStart: startDate,
              periodEnd: endDate,
              referencePeriodStart: status.referencePeriodLabel.split('-')[0] + '-01-01', // Aproximação ou usar lógica exata se disponível
              referencePeriodEnd: status.referencePeriodLabel.split('-')[1] + '-12-31',
              status: 'scheduled',
              soldDays: sellOption ? soldDays : 0
          };

          const updatedHistory = [...(staff.vacationHistory || []), newRecord];
          
          // 2. Atualiza o Funcionário
          const updatedStaff = { ...staff, vacationHistory: updatedHistory };
          onUpdateStaff(updatedStaff);

          // 3. MÁGICA: Cria automaticamente a Ocorrência (Incident)
          // Isso garante que apareça no calendário de faltas/ocorrências
          const incidentPayload: Omit<StaffIncident, 'id' | 'createdAt'> = {
              staffId: staff.id,
              type: 'ferias',
              date: startDate,
              description: `Férias agendadas de ${formatDateBr(startDate)} até ${formatDateBr(endDate)}. ${sellOption ? `(Abono: ${soldDays} dias)` : ''}`,
              financialImpact: 0 // O impacto financeiro é calculado na folha via VacationRecord, não aqui
          };
          
          await dataService.addStaffIncident(incidentPayload);
          if (onRefreshIncidents) onRefreshIncidents();

          // Reset e Fecha
          setIsModalOpen(false);
          setStartDate('');
          setEndDate('');
          setSellOption(false);
          setSoldDays(0);
          
          alert("Férias agendadas com sucesso!");

      } catch (error) {
          alert("Erro ao agendar férias.");
          console.error(error);
      } finally {
          setIsProcessing(false);
      }
  };

  if (!status) {
      return <div className="p-8 text-center text-gray-400">Dados de admissão insuficientes para cálculo.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
       
       {/* --- CARD RESUMO --- */}
       <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden
           ${status.isDue ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}
       `}>
           <div className="flex items-center gap-4 relative z-10">
               <div className={`p-4 rounded-xl shadow-sm ${status.isDue ? 'bg-white text-red-600' : 'bg-white text-blue-600'}`}>
                   <Palmtree className="w-8 h-8" />
               </div>
               <div>
                   <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Situação Atual</p>
                   <h2 className={`text-2xl font-bold ${status.isDue ? 'text-red-700' : 'text-gray-900'}`}>
                       {status.isDue ? 'Férias Vencidas' : status.isAccruing ? 'Em Aquisição' : 'Em Dia'}
                   </h2>
                   <p className="text-sm font-medium text-gray-600">
                       Período Aquisitivo: {status.referencePeriodLabel}
                   </p>
               </div>
           </div>

           <div className="flex gap-8 text-center relative z-10">
               <div>
                   <p className="text-xs font-bold uppercase text-gray-400 mb-1">Saldo</p>
                   <p className="text-3xl font-extrabold text-gray-800">{status.remainingDays} <span className="text-sm font-medium text-gray-500">dias</span></p>
               </div>
               {!status.isAccruing && (
                   <div>
                       <p className="text-xs font-bold uppercase text-gray-400 mb-1">Data Limite</p>
                       <p className={`text-lg font-bold mt-1 ${status.isDue ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                           {formatDateBr(status.deadline)}
                       </p>
                   </div>
               )}
           </div>

           <div className="relative z-10">
               <button 
                 onClick={() => setIsModalOpen(true)}
                 disabled={status.remainingDays <= 0 && !status.isDue}
                 className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
               >
                   <Plus className="w-5 h-5" /> Agendar Férias
               </button>
           </div>

           {/* Decorativo */}
           <Palmtree className="absolute -right-6 -bottom-6 w-48 h-48 text-gray-900/5 rotate-12 pointer-events-none" />
       </div>

       {/* --- HISTÓRICO --- */}
       <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-gray-400" /> Histórico de Concessões
               </h3>
           </div>
           
           {staff.vacationHistory && staff.vacationHistory.length > 0 ? (
               <table className="w-full text-left text-sm">
                   <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
                       <tr>
                           <th className="px-6 py-3">Período de Gozo</th>
                           <th className="px-6 py-3">Dias</th>
                           <th className="px-6 py-3">Abono (Venda)</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3">Ref. Aquisitiva</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                       {staff.vacationHistory.map((vac) => {
                           const start = new Date(vac.periodStart);
                           const end = new Date(vac.periodEnd);
                           const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                           
                           return (
                               <tr key={vac.id} className="hover:bg-gray-50">
                                   <td className="px-6 py-4 font-medium text-gray-900">
                                       {formatDateBr(vac.periodStart)} até {formatDateBr(vac.periodEnd)}
                                   </td>
                                   <td className="px-6 py-4">{days} dias</td>
                                   <td className="px-6 py-4 text-gray-500">{vac.soldDays ? `${vac.soldDays} dias` : '-'}</td>
                                   <td className="px-6 py-4">
                                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                           ${vac.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}
                                       `}>
                                           {vac.status === 'completed' ? 'Concluído' : 'Agendado'}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-gray-400 text-xs">
                                       {formatDateBr(vac.referencePeriodStart)} - {formatDateBr(vac.referencePeriodEnd)}
                                   </td>
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           ) : (
               <div className="p-10 text-center text-gray-400 italic">Nenhum histórico registrado.</div>
           )}
       </div>

       {/* --- MODAL DE AGENDAMENTO --- */}
       {isModalOpen && (
           <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
                   <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                       <div className="flex items-center gap-3">
                           <Calendar className="w-6 h-6" />
                           <h3 className="text-xl font-bold">Agendar Férias</h3>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="hover:bg-blue-500 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                   </div>

                   <div className="p-6 space-y-5">
                       <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-sm flex justify-between items-center">
                           <span className="font-bold">Saldo Disponível:</span>
                           <span className="text-lg font-extrabold">{status.remainingDays} dias</span>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Início</label>
                               <input type="date" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Término</label>
                               <input type="date" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                           </div>
                       </div>

                       {/* Abono Pecuniário */}
                       <div className="border rounded-xl p-4 bg-gray-50">
                           <div className="flex items-center gap-3 mb-3">
                               <input 
                                   type="checkbox" 
                                   id="sellDays" 
                                   className="w-5 h-5 text-blue-600 rounded"
                                   checked={sellOption}
                                   onChange={e => { setSellOption(e.target.checked); if(!e.target.checked) setSoldDays(0); }}
                               />
                               <label htmlFor="sellDays" className="text-sm font-bold text-gray-700 cursor-pointer">Vender dias (Abono)?</label>
                           </div>
                           
                           {sellOption && (
                               <div className="animate-in slide-in-from-top-2">
                                   <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Qtd. Dias (Máx 10)</label>
                                   <input 
                                       type="number" 
                                       max={10} 
                                       min={1} 
                                       className="w-full border rounded-lg p-2 outline-none bg-white"
                                       value={soldDays}
                                       onChange={e => setSoldDays(parseInt(e.target.value))}
                                   />
                               </div>
                           )}
                       </div>

                       {/* Resumo do Calculo */}
                       <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
                           <div className="flex items-center gap-2 text-gray-500">
                               <Calculator className="w-4 h-4" />
                               <span className="text-xs font-bold uppercase">Total Utilizado</span>
                           </div>
                           <span className={`text-xl font-bold ${duration + (sellOption ? soldDays : 0) > status.remainingDays ? 'text-red-600' : 'text-gray-900'}`}>
                               {duration + (sellOption ? soldDays : 0)} dias
                           </span>
                       </div>
                       
                       <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                           <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                           <p className="text-xs text-amber-800 leading-tight">
                               Ao confirmar, uma ocorrência de <strong>Férias</strong> será gerada automaticamente no prontuário do colaborador.
                           </p>
                       </div>
                   </div>

                   <div className="p-6 bg-gray-50 border-t flex gap-3">
                       <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">Cancelar</button>
                       <button 
                           onClick={handleSave}
                           disabled={isProcessing || !startDate || !endDate}
                           className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                           {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-4 h-4" /> Confirmar</>}
                       </button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
