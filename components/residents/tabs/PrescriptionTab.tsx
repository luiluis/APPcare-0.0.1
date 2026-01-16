
import React, { useState } from 'react';
import { Resident, Prescription } from '../../../types';
import { CheckSquare, Clock, AlertCircle, Pill, XCircle, Plus, Trash2, Edit2, X, AlertOctagon, ShieldCheck, Loader2 } from 'lucide-react';
import { SecurityPinModal } from '../../modals/SecurityPinModal';
import { dataService } from '../../../services/dataService';

interface PrescriptionTabProps {
  resident: Resident;
  prescriptions: Prescription[];
  onUpdatePrescriptions: (updated: Prescription[]) => void;
}

export const PrescriptionTab: React.FC<PrescriptionTabProps> = ({ resident, prescriptions, onUpdatePrescriptions }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, {status: 'checked' | 'missed', reason?: string}>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // States para Modais
  const [exceptionModal, setExceptionModal] = useState<{isOpen: boolean, itemId: string | null}>({isOpen: false, itemId: null});
  const [exceptionReason, setExceptionReason] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Prescription | null>(null);

  // Security Modal State
  const [pinModal, setPinModal] = useState<{isOpen: boolean, pendingItem: any | null}>({isOpen: false, pendingItem: null});

  // Form State
  const initialFormState: Omit<Prescription, 'id'> = { 
    residentId: resident.id, 
    medication: '', 
    dosage: '', 
    times: [], 
    instructions: '', 
    active: true, 
    isHighAlert: false 
  };
  
  const [form, setForm] = useState<Omit<Prescription, 'id'>>(initialFormState);
  const [formTimesString, setFormTimesString] = useState('');

  // --- CRUD LOGIC (ASYNC) ---

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm(initialFormState);
    setFormTimesString('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: Prescription) => {
    setEditingItem(item);
    setForm({
        residentId: item.residentId,
        medication: item.medication,
        dosage: item.dosage,
        times: item.times,
        instructions: item.instructions,
        active: item.active,
        isHighAlert: item.isHighAlert
    });
    setFormTimesString(item.times.join(', '));
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (isProcessing) return;
    if (confirm('Tem certeza que deseja remover esta prescrição?')) {
       setIsProcessing(true);
       try {
          await dataService.deletePrescription(id);
          const updated = prescriptions.filter(p => p.id !== id);
          onUpdatePrescriptions(updated);
       } catch (error: any) {
          alert(error.message || "Erro ao deletar prescrição.");
       } finally {
          setIsProcessing(false);
       }
    }
  };

  const handleSavePrescription = async () => {
    if (isProcessing) return;
    
    const timesArray = formTimesString.split(',')
      .map(t => t.trim())
      .filter(t => /^([01]\d|2[0-3]):?([0-5]\d)$/.test(t));

    if (timesArray.length === 0) {
      alert("Por favor, insira pelo menos um horário válido (HH:MM).");
      return;
    }

    setIsProcessing(true);
    try {
        if (editingItem) {
            const updated = await dataService.updatePrescription(editingItem.id, {
                ...form,
                times: timesArray
            });
            onUpdatePrescriptions(prescriptions.map(p => p.id === updated.id ? updated : p));
        } else {
            const created = await dataService.addPrescription({
                ...form,
                times: timesArray
            });
            onUpdatePrescriptions([...prescriptions, created]);
        }
        setIsEditModalOpen(false);
    } catch (error: any) {
        alert(error.message || "Erro ao salvar prescrição.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- CHECK LOGIC ---

  const handleClickCheck = (item: any) => {
    if (item.isHighAlert) {
        setPinModal({ isOpen: true, pendingItem: item });
    } else {
        processCheck(item);
    }
  };

  const processCheck = (item: any) => {
      setCheckedItems(prev => ({ ...prev, [item.uniqueId]: { status: 'checked' } }));
  };

  const openException = (id: string) => {
    setExceptionModal({ isOpen: true, itemId: id });
    setExceptionReason('');
  };

  const confirmException = () => {
    if (exceptionModal.itemId && exceptionReason) {
      setCheckedItems(prev => ({ 
        ...prev, 
        [exceptionModal.itemId!]: { status: 'missed', reason: exceptionReason } 
      }));
      setExceptionModal({ isOpen: false, itemId: null });
      setExceptionReason('');
    }
  };

  // Organizar por horário
  const timelineEvents = (prescriptions || []).flatMap(p => 
    p.times.map(time => ({
      ...p,
      uniqueId: `${p.id}-${time}`,
      scheduledTime: time
    }))
  ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all disabled:bg-gray-50";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 relative pb-20">
      
      {/* Header da Aba */}
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
         <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-blue-900">Mapa de Prescrição (Hoje)</h3>
              <p className="text-sm text-blue-700">Acompanhe a administração em tempo real.</p>
            </div>
         </div>
         <button 
           onClick={handleOpenAdd}
           disabled={isProcessing}
           className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
         >
           <Plus className="w-4 h-4" /> Adicionar Remédio
         </button>
      </div>

      {prescriptions.length === 0 && !isProcessing && (
        <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma prescrição cadastrada.</p>
        </div>
      )}

      {/* Timeline */}
      <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 py-2">
        {timelineEvents.map((item) => {
          const state = checkedItems[item.uniqueId];
          const isChecked = state?.status === 'checked';
          const isMissed = state?.status === 'missed';

          return (
            <div key={item.uniqueId} className="relative pl-8 group">
              <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 
                ${isChecked ? 'bg-emerald-500 border-emerald-500' : 
                  isMissed ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>
              </div>

              <div className={`p-5 rounded-xl border transition-all duration-200 flex flex-col lg:flex-row gap-4 lg:items-center justify-between group
                ${isChecked ? 'bg-emerald-50 border-emerald-200 opacity-70' : 
                  isMissed ? 'bg-red-50 border-red-200' : 
                  'bg-white border-gray-200 shadow-sm hover:shadow-md'}
              `}>
                
                <div className="flex items-start gap-4 flex-1">
                   <div className={`p-3 rounded-lg font-bold text-lg text-center min-w-[80px] 
                     ${isChecked ? 'bg-emerald-100 text-emerald-700' : 
                       isMissed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.scheduledTime}
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                {item.medication}
                                {item.isHighAlert && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] uppercase font-bold rounded-full border border-red-200 flex items-center gap-1">
                                        <AlertOctagon className="w-3 h-3"/> Alto Risco
                                    </span>
                                )}
                            </h4>
                            <p className="text-gray-600 font-medium">{item.dosage}</p>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleOpenEdit(item)} disabled={isProcessing} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => handleDelete(item.id)} disabled={isProcessing} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                         </div>
                      </div>

                      {item.instructions && (
                        <p className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block mt-1 font-semibold border border-orange-100">
                          ⚠ {item.instructions}
                        </p>
                      )}
                      {isMissed && (
                        <p className="text-xs text-red-700 mt-2 font-bold">
                           Motivo: {state.reason}
                        </p>
                      )}
                   </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   {!state ? (
                     <div className="flex gap-2">
                       <button 
                         onClick={() => openException(item.uniqueId)}
                         disabled={isProcessing}
                         className="px-4 py-3 rounded-xl font-bold text-red-600 border border-red-200 hover:bg-red-50 text-sm transition-colors disabled:opacity-50"
                       >
                         <XCircle className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => handleClickCheck(item)}
                         disabled={isProcessing}
                         className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all 
                           ${item.isHighAlert ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                       >
                         {item.isHighAlert && <ShieldCheck className="w-4 h-4"/>} Confirmar Dose
                       </button>
                     </div>
                   ) : isChecked ? (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold px-4 py-2 bg-emerald-100 rounded-lg">
                        <CheckSquare className="w-5 h-5" /> Administrado
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-red-600 font-bold px-4 py-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-5 h-5" /> Não Administrado
                     </div>
                   )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL EDIT/ADD --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Editar Prescrição' : 'Nova Prescrição'}</h3>
                 <button onClick={() => !isProcessing && setIsEditModalOpen(false)} disabled={isProcessing}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className={labelStyle}>Medicamento</label>
                    <input 
                      className={inputStyle} 
                      placeholder="Ex: Losartana"
                      disabled={isProcessing}
                      value={form.medication}
                      onChange={e => setForm({...form, medication: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyle}>Dosagem</label>
                        <input 
                            className={inputStyle} 
                            placeholder="Ex: 50mg"
                            disabled={isProcessing}
                            value={form.dosage}
                            onChange={e => setForm({...form, dosage: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Horários (08:00, 20:00)</label>
                        <input 
                            className={inputStyle} 
                            placeholder="HH:MM, HH:MM"
                            disabled={isProcessing}
                            value={formTimesString}
                            onChange={e => setFormTimesString(e.target.value)}
                        />
                    </div>
                 </div>
                 
                 <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-3">
                     <input 
                        type="checkbox" 
                        id="highAlert" 
                        disabled={isProcessing}
                        className="w-5 h-5 text-red-600 rounded" 
                        checked={form.isHighAlert || false}
                        onChange={e => setForm({...form, isHighAlert: e.target.checked})}
                     />
                     <label htmlFor="highAlert" className="text-sm font-bold text-red-800 cursor-pointer flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4"/> Medicamento de Alto Risco
                     </label>
                 </div>

                 <div>
                    <label className={labelStyle}>Instruções Especiais</label>
                    <textarea 
                      className={inputStyle} 
                      placeholder="Ex: Após refeição..."
                      rows={3}
                      disabled={isProcessing}
                      value={form.instructions || ''}
                      onChange={e => setForm({...form, instructions: e.target.value})}
                    />
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} disabled={isProcessing} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                    <button 
                      onClick={handleSavePrescription}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                       {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Exceção */}
      {exceptionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Justificativa</h3>
              <div className="space-y-2 mb-4">
                 {['Paciente Recusou', 'Paciente Dormindo', 'Paciente Ausente', 'Suspensão Médica'].map(r => (
                   <button 
                    key={r}
                    onClick={() => setExceptionReason(r)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${exceptionReason === r ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}
                   >
                     {r}
                   </button>
                 ))}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setExceptionModal({isOpen: false, itemId: null})} className="flex-1 py-2 text-gray-600 font-bold">Voltar</button>
                 <button onClick={confirmException} disabled={!exceptionReason} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      <SecurityPinModal 
        isOpen={pinModal.isOpen}
        onClose={() => setPinModal({...pinModal, isOpen: false})}
        onConfirm={() => processCheck(pinModal.pendingItem)}
      />
    </div>
  );
};
