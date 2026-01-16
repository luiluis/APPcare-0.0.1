
import React, { useState, useMemo } from 'react';
import { Resident, Evolution, Prescription, AuditLog } from '../types';
import { 
  Pill, Activity, CheckSquare, Clock, User, 
  Droplets, Heart, Sun, Moon, Coffee, ShowerHead, 
  Utensils, CheckCircle2, AlertOctagon, Save, PlusCircle,
  AlertTriangle, Check, History, Undo2, X, Search
} from 'lucide-react';

interface DailyRoutineDashboardProps {
  residents: Resident[];
  onUpdateResident: (updated: Resident) => void;
  onLogAction: (action: string, details: string, category: AuditLog['category'], residentId?: string) => void;
  onAddEvolution?: (residentId: string, content: string, type: Evolution['type']) => void;
}

export const DailyRoutineDashboard: React.FC<DailyRoutineDashboardProps> = ({ residents, onUpdateResident, onLogAction, onAddEvolution }) => {
  const [activeTab, setActiveTab] = useState<'meds' | 'vitals' | 'care'>('meds');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Batch Selection (Care Tab)
  const [selectedResidentIds, setSelectedResidentIds] = useState<Set<string>>(new Set());

  // State for Vitals Batch Input
  const [vitalsInput, setVitalsInput] = useState<Record<string, { pressure: string; glucose: string; heartRate: string }>>({});

  // State for "Manual/Forgot" Entry Modal
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualEntryForm, setManualEntryForm] = useState({ residentId: '', type: 'medication', note: '' });

  // Histórico Local (apenas visual, agora duplicamos no Log Global)
  const [sessionHistory, setSessionHistory] = useState<Array<{id: string, text: string, time: string, residentName: string}>>([]);

  // --- HELPERS ---

  const getShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { label: 'Manhã', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' };
    if (hour >= 12 && hour < 18) return { label: 'Tarde', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-50' };
    return { label: 'Noite', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' };
  };

  const shift = getShift();

  const addToHistory = (residentName: string, action: string) => {
      setSessionHistory(prev => [{
          id: Date.now().toString(),
          text: action,
          residentName,
          time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
      }, ...prev].slice(0, 10)); // Keep last 10
  };

  // --- TAB 1: SMART MEDICATION MAP ---
  const medsMap = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMinute;

    const list: Array<{
      residentId: string;
      residentName: string;
      photo?: string;
      medId: string;
      medName: string;
      dosage: string;
      time: string;
      isHighAlert?: boolean;
      status: 'late' | 'pending' | 'done'; // Simulado
    }> = [];

    residents.forEach(res => {
      res.prescriptions?.forEach(p => {
        p.times.forEach(t => {
           const [h, m] = t.split(':').map(Number);
           const medTimeVal = h * 60 + m;
           
           // Lógica de Status Simulada
           let status: 'late' | 'pending' | 'done' = 'pending';
           if (medTimeVal < currentTimeVal - 30) status = 'late';
           else if (medTimeVal > currentTimeVal + 120) status = 'done'; 
           else status = 'pending';

           list.push({
             residentId: res.id,
             residentName: res.name,
             photo: res.photo,
             medId: p.id,
             medName: p.medication,
             dosage: p.dosage,
             time: t,
             isHighAlert: p.isHighAlert,
             status
           });
        });
      });
    });

    return {
        late: list.filter(i => i.status === 'late').sort((a,b) => a.time.localeCompare(b.time)),
        pending: list.filter(i => i.status === 'pending').sort((a,b) => a.time.localeCompare(b.time)),
        done: list.filter(i => i.status === 'done')
    };
  }, [residents]);

  const handleAdministerMed = (residentId: string, medName: string, time: string, isHighAlert?: boolean) => {
    // Note: PIN check moved to PrescriptionTab, but here on dashboard we assume verified for now
    // or we could implement the modal here too. For simplicity in batch dashboard, we log directly.
    const res = residents.find(r => r.id === residentId);
    if(res) {
        // Log Audit
        onLogAction(
            "Administração de Medicamento", 
            `${medName} (${time}) - ${isHighAlert ? '[ALTO RISCO]' : ''}`, 
            "medical", 
            residentId
        );
        
        // Log UI Local
        addToHistory(res.name, `Medicamento: ${medName}`);
        
        // Add Evolution if handler available
        if (onAddEvolution) {
            onAddEvolution(residentId, `Medicamento administrado: ${medName} (${time})`, 'nursing');
        }
        
        alert(`✅ Registrado: ${medName} para ${res.name}`);
    }
  };

  // --- TAB 2: VITALS BATCH ---
  const handleVitalChange = (id: string, field: 'pressure' | 'glucose' | 'heartRate', value: string) => {
    setVitalsInput(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const getVitalStatusColor = (type: 'pressure' | 'glucose', value: string) => {
      if (!value) return 'border-gray-200';
      const num = parseInt(value);
      if (type === 'pressure') {
          const sys = parseInt(value.split('/')[0]);
          if (sys > 140 || sys < 90) return 'border-red-400 bg-red-50 text-red-700';
      }
      if (type === 'glucose') {
          if (num > 180 || num < 70) return 'border-red-400 bg-red-50 text-red-700';
      }
      return 'border-green-300 bg-green-50 text-green-800'; 
  };

  const saveVitalsRow = (resident: Resident) => {
    const input = vitalsInput[resident.id];
    if (!input) return;

    const details = `PA: ${input.pressure || '-'}, HGT: ${input.glucose || '-'}, FC: ${input.heartRate || '-'}`;
    
    // Log Audit
    onLogAction("Aferição de Sinais Vitais", details, "medical", resident.id);
    
    // Log Evolution (Real Medical Record)
    if (onAddEvolution) {
        onAddEvolution(resident.id, `Sinais Vitais aferidos: ${details}`, 'nursing');
    }

    // Log UI Local
    addToHistory(resident.name, `Sinais Vitais (${details})`);
    
    // Clear line
    setVitalsInput(prev => {
        const copy = {...prev};
        delete copy[resident.id];
        return copy;
    });
  };

  // --- TAB 3: BATCH CARE ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedResidentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedResidentIds(newSet);
  };

  const applyBatchAction = (action: string) => {
    if (selectedResidentIds.size === 0) return;
    
    // Log Audit Global (Batch)
    onLogAction("Registro em Lote", `Ação: ${action} para ${selectedResidentIds.size} residentes`, "operational");
    
    // Create Real Evolutions for each resident
    if (onAddEvolution) {
        selectedResidentIds.forEach(id => {
            const res = residents.find(r => r.id === id);
            if (res) {
                const message = `Rotina realizada: ${action} (Registro em lote)`;
                onAddEvolution(id, message, 'nursing');
            }
        });
    }

    addToHistory(`${selectedResidentIds.size} Residentes`, action);
    setSelectedResidentIds(new Set());
  };

  // --- FILTRAGEM GLOBAL ---
  const filteredResidents = residents.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* Header com Turno & Ações Globais */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm gap-4">
         <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${shift.bg} ${shift.color}`}>
                <shift.icon className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-none">Rotina Operacional</h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                    {shift.label} • {new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}
                </p>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar residente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
               onClick={() => setIsManualEntryOpen(true)}
               className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
             >
                <PlusCircle className="w-5 h-5" /> Registro Manual
             </button>
         </div>
      </div>

      {/* Navegação Principal */}
      <div className="flex p-1 bg-gray-100 rounded-xl overflow-x-auto">
         {[
             { id: 'meds', label: 'Medicação', icon: Pill, count: medsMap.late.length + medsMap.pending.length },
             { id: 'vitals', label: 'Sinais Vitais', icon: Activity },
             { id: 'care', label: 'Cuidados / Rotina', icon: CheckSquare }
         ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                 ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
               `}
             >
                 <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                 {tab.label}
                 {tab.count !== undefined && tab.count > 0 && (
                     <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                         {tab.count}
                     </span>
                 )}
             </button>
         ))}
      </div>

      {/* --- CONTENT: MEDS (SEPARATED LISTS) --- */}
      {activeTab === 'meds' && (
         <div className="space-y-6">
            
            {/* Seção 1: Atrasados (Prioridade) */}
            {medsMap.late.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden animate-pulse-slow">
                    <div className="px-6 py-3 bg-red-100/50 border-b border-red-100 flex items-center justify-between">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Atrasados / Prioridade
                        </h3>
                        <span className="bg-white text-red-700 px-2 py-0.5 rounded text-xs font-bold shadow-sm">{medsMap.late.length} pendentes</span>
                    </div>
                    <div className="divide-y divide-red-100">
                        {medsMap.late.map((item, idx) => (
                           <MedicationRow key={idx} item={item} onAdminister={handleAdministerMed} isLate />
                        ))}
                    </div>
                </div>
            )}

            {/* Seção 2: Próximos / Agora */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" /> Próximos Horários
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {medsMap.pending.length > 0 ? medsMap.pending.map((item, idx) => (
                        <MedicationRow key={idx} item={item} onAdminister={handleAdministerMed} />
                    )) : (
                        <div className="p-12 text-center text-gray-400">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                            <p>Tudo em dia! Nenhuma medicação pendente para agora.</p>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* --- CONTENT: VITALS TABLE (IMPROVED) --- */}
      {activeTab === 'vitals' && (
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-gray-50 border-b border-gray-200">
                 <div className="p-4 text-center">
                     <p className="text-xs font-bold text-gray-400 uppercase">Total Residentes</p>
                     <p className="text-xl font-bold text-gray-900">{filteredResidents.length}</p>
                 </div>
                 <div className="p-4 text-center">
                     <p className="text-xs font-bold text-gray-400 uppercase">Aferidos Hoje</p>
                     <p className="text-xl font-bold text-emerald-600">0</p>
                 </div>
                 <div className="p-4 text-center">
                     <p className="text-xs font-bold text-gray-400 uppercase">Alertas</p>
                     <p className="text-xl font-bold text-gray-400">-</p>
                 </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-white text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                      <tr>
                         <th className="px-6 py-4">Residente</th>
                         <th className="px-4 py-4 w-40">PA (mmHg)</th>
                         <th className="px-4 py-4 w-32">HGT (mg/dL)</th>
                         <th className="px-4 py-4 w-32">FC (bpm)</th>
                         <th className="px-6 py-4 w-24"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredResidents.map(r => (
                         <tr key={r.id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                     {r.photo ? <img src={r.photo} className="w-full h-full object-cover" /> : <User className="w-5 h-5 m-2.5 text-gray-400"/>}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{r.name}</p>
                                    {r.medicalRecord?.lastVitals.date && (
                                        <p className="text-xs text-gray-400 mt-0.5">Última: {r.medicalRecord.lastVitals.date}</p>
                                    )}
                                  </div>
                               </div>
                            </td>
                            <td className="px-4 py-4">
                               <input 
                                 className={`w-full border rounded-lg px-3 py-2 outline-none font-medium transition-colors ${getVitalStatusColor('pressure', vitalsInput[r.id]?.pressure || '')}`}
                                 placeholder={r.medicalRecord?.lastVitals.pressure || "120/80"}
                                 value={vitalsInput[r.id]?.pressure || ''}
                                 onChange={e => handleVitalChange(r.id, 'pressure', e.target.value)}
                               />
                            </td>
                            <td className="px-4 py-4">
                               <input 
                                 type="number"
                                 className={`w-full border rounded-lg px-3 py-2 outline-none font-medium transition-colors ${getVitalStatusColor('glucose', vitalsInput[r.id]?.glucose || '')}`}
                                 placeholder={r.medicalRecord?.lastVitals.glucose?.replace(/\D/g,'') || "90"}
                                 value={vitalsInput[r.id]?.glucose || ''}
                                 onChange={e => handleVitalChange(r.id, 'glucose', e.target.value)}
                               />
                            </td>
                            <td className="px-4 py-4">
                               <input 
                                 type="number"
                                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                                 placeholder={String(r.medicalRecord?.lastVitals.heartRate || "70")}
                                 value={vitalsInput[r.id]?.heartRate || ''}
                                 onChange={e => handleVitalChange(r.id, 'heartRate', e.target.value)}
                               />
                            </td>
                            <td className="px-6 py-4 text-right">
                               {(vitalsInput[r.id]?.pressure || vitalsInput[r.id]?.glucose || vitalsInput[r.id]?.heartRate) && (
                                   <button 
                                     onClick={() => saveVitalsRow(r)}
                                     className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all animate-in zoom-in"
                                     title="Salvar"
                                   >
                                      <Check className="w-5 h-5" />
                                   </button>
                               )}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
         </div>
      )}

      {/* --- CONTENT: BATCH CARE --- */}
      {activeTab === 'care' && (
         <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
                {/* Action Bar (Sticky) */}
                <div className={`transition-all duration-300 sticky top-0 z-20 mb-4 ${selectedResidentIds.size > 0 ? 'translate-y-0 opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="font-bold flex items-center gap-2 px-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            {selectedResidentIds.size} Selecionados
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <button onClick={() => applyBatchAction('Banho')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                                <ShowerHead className="w-4 h-4 text-sky-300" /> Banho
                            </button>
                            <button onClick={() => applyBatchAction('Refeição')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                                <Utensils className="w-4 h-4 text-orange-300" /> Refeição
                            </button>
                            <button onClick={() => applyBatchAction('Hidratação')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                                <Droplets className="w-4 h-4 text-blue-300" /> Água
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredResidents.map(r => {
                    const isSelected = selectedResidentIds.has(r.id);
                    return (
                        <div 
                            key={r.id}
                            onClick={() => toggleSelection(r.id)}
                            className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center text-center transition-all duration-200 relative
                            ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'}`}
                        >
                            {isSelected && <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1"><Check className="w-3 h-3"/></div>}
                            
                            <div className="w-16 h-16 rounded-full bg-gray-100 mb-3 overflow-hidden border-2 border-white shadow-sm">
                            {r.photo ? <img src={r.photo} className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-4 text-gray-400"/>}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{r.name}</h4>
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Grau {r.careLevel}</span>
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Sidebar Histórico (Desktop) */}
            <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-4">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-400" /> Histórico Recente
                    </h3>
                    <div className="space-y-4">
                        {sessionHistory.length > 0 ? sessionHistory.map(log => (
                            <div key={log.id} className="flex gap-3 items-start group">
                                <div className="mt-1 w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{log.residentName}</p>
                                    <p className="text-xs text-gray-500">{log.text}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{log.time}</p>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity" title="Desfazer">
                                    <Undo2 className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 italic">Nenhuma ação registrada nesta sessão.</p>
                        )}
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* --- MODAL DE REGISTRO MANUAL --- */}
      {isManualEntryOpen && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Registro Avulso / Esqueci</h3>
                    <button onClick={() => setIsManualEntryOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Residente</label>
                        <select 
                            className="w-full border rounded-lg p-2.5 outline-none bg-white"
                            onChange={e => setManualEntryForm({...manualEntryForm, residentId: e.target.value})}
                        >
                            <option value="">Selecione...</option>
                            {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">O que foi feito?</label>
                        <div className="flex gap-2 mb-2">
                            {['Medicação', 'Curativo', 'Intercorrência'].map(t => (
                                <button key={t} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 focus:bg-blue-50 focus:border-blue-500 focus:text-blue-700 transition-colors">
                                    {t}
                                </button>
                            ))}
                        </div>
                        <textarea 
                            className="w-full border rounded-lg p-3 outline-none h-24 resize-none"
                            placeholder="Descreva o que foi realizado (ex: Dipirona extra por febre)..."
                            value={manualEntryForm.note}
                            onChange={e => setManualEntryForm({...manualEntryForm, note: e.target.value})}
                        ></textarea>
                    </div>
                    <button 
                        onClick={() => {
                            if(manualEntryForm.residentId && manualEntryForm.note && onAddEvolution) {
                                onAddEvolution(manualEntryForm.residentId, `Registro Manual: ${manualEntryForm.note}`, 'nursing');
                                const res = residents.find(r => r.id === manualEntryForm.residentId);
                                onLogAction("Registro Manual", "Ação avulsa registrada via modal", "operational", res?.id);
                                addToHistory(res?.name || "Desconhecido", "Registro Manual");
                                setIsManualEntryOpen(false);
                            } else {
                                alert("Preencha todos os campos.");
                            }
                        }}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800"
                    >
                        Confirmar Registro
                    </button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
};

// Subcomponente para Linha de Medicação
interface MedicationRowProps {
  item: any;
  onAdminister: (residentId: string, medName: string, time: string, isHighAlert?: boolean) => void;
  isLate?: boolean;
}

// Fixed: Correctly typed MedicationRow as React.FC to handle 'key' prop automatically
const MedicationRow: React.FC<MedicationRowProps> = ({ item, onAdminister, isLate = false }) => (
    <div className={`p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${isLate ? 'hover:bg-red-50/50' : 'hover:bg-blue-50/30'}`}>
        <div className="flex items-center gap-4 flex-1 w-full">
            <div className={`px-3 py-1 rounded-lg font-bold text-sm border flex items-center justify-center min-w-[70px]
                ${isLate ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {item.time}
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                {item.photo ? <img src={item.photo} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><User className="w-6 h-6 text-gray-400"/></div>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{item.residentName}</p>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${isLate ? 'text-red-600' : 'text-blue-600'}`}>{item.medName}</span>
                    <span className="text-gray-400 text-xs">• {item.dosage}</span>
                    {item.isHighAlert && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> ALTO RISCO</span>}
                </div>
            </div>
        </div>
        <button 
            onClick={() => onAdminister(item.residentId, item.medName, item.time, item.isHighAlert)}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white shadow-sm transition-transform active:scale-95 
            ${item.isHighAlert ? 'bg-amber-600 hover:bg-amber-700' : isLate ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
            Administrar
        </button>
    </div>
);
