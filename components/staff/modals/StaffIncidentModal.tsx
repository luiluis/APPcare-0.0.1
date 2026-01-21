
import React, { useState, useRef } from 'react';
import { X, AlertCircle, Camera, Loader2, UploadCloud, DollarSign } from 'lucide-react';
import { Staff, StaffIncident, StaffIncidentType } from '../../../types';
import { storageService } from '../../../services/storageService';
import { generateStoragePath } from '../../../lib/utils';
import { BRANCHES } from '../../../constants';

interface StaffIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  onSave: (incidentData: Omit<StaffIncident, 'id' | 'createdAt'>) => Promise<void>;
}

export const StaffIncidentModal: React.FC<StaffIncidentModalProps> = ({ isOpen, onClose, staff, onSave }) => {
  const [type, setType] = useState<StaffIncidentType>('atestado');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [financialImpact, setFinancialImpact] = useState(''); // Estado para o valor financeiro
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!description || !selectedFile || isSaving) return;
    setIsSaving(true);
    try {
      // 1. Upload do Arquivo
      setIsUploading(true);
      const branchName = BRANCHES.find(b => b.id === staff.branchId)?.name || 'Geral';
      // Pasta: Filial/Enfermagem/Nome/Ocorrencias/Tipo
      const storagePath = generateStoragePath(branchName, staff.role, staff.name, `Ocorrencias/${type}`);
      
      const attachmentUrl = await storageService.uploadFile(selectedFile, 'staff-incidents', storagePath);
      setIsUploading(false);

      // 2. Salvar Registro
      await onSave({
        staffId: staff.id,
        type,
        date,
        description,
        attachmentUrl,
        financialImpact: financialImpact ? parseFloat(financialImpact) : undefined
      });
      
      onClose();
      // Reset
      setDescription('');
      setSelectedFile(null);
      setType('atestado');
      setFinancialImpact('');
    } catch (error) {
      alert("Erro ao salvar ocorrência.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const getTypeColor = (t: StaffIncidentType) => {
      switch (t) {
          case 'atestado': return 'bg-amber-100 text-amber-800';
          case 'advertencia': return 'bg-red-100 text-red-800';
          case 'suspensao': return 'bg-red-900 text-red-100';
          case 'ferias': return 'bg-emerald-100 text-emerald-800';
          case 'falta': return 'bg-gray-100 text-gray-800';
          default: return 'bg-blue-100 text-blue-800';
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
             <AlertCircle className="w-8 h-8 text-amber-400" />
             <div>
                <h3 className="text-xl font-bold">Nova Ocorrência</h3>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{staff.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full transition-colors"><X className="w-6 h-6"/></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tipo de Evento</label>
                <select 
                   className={`w-full border rounded-xl px-4 py-3 outline-none font-bold focus:ring-2 focus:ring-gray-500 capitalize ${getTypeColor(type)}`}
                   value={type}
                   onChange={e => setType(e.target.value as StaffIncidentType)}
                >
                   <option value="atestado">Atestado Médico</option>
                   <option value="ferias">Férias</option>
                   <option value="advertencia">Advertência</option>
                   <option value="suspensao">Suspensão</option>
                   <option value="falta">Falta Injustificada</option>
                   <option value="atraso">Atraso</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Data do Evento</label>
                <input 
                   type="date"
                   className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                   value={date}
                   onChange={e => setDate(e.target.value)}
                />
             </div>
          </div>

          {/* Campo de Impacto Financeiro */}
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Impacto Financeiro (R$)</label>
             <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                   type="number"
                   step="0.01"
                   placeholder="0.00"
                   className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                   value={financialImpact}
                   onChange={e => setFinancialImpact(e.target.value)}
                />
             </div>
             <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Use valores negativos para descontos (ex: -50.00) e positivos para bônus.
             </p>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Descrição</label>
             <textarea 
               className="w-full border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none bg-white text-gray-900"
               placeholder="Descreva o motivo, dias de afastamento ou detalhes..."
               value={description}
               onChange={e => setDescription(e.target.value)}
             ></textarea>
          </div>

          <div className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => fileInputRef.current?.click()}>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
             
             {selectedFile ? (
                 <div className="text-center">
                     <p className="text-emerald-700 font-bold text-sm mb-1">Arquivo Selecionado</p>
                     <p className="text-emerald-600 text-xs">{selectedFile.name}</p>
                 </div>
             ) : (
                 <div className="text-center text-gray-400">
                     <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                     <p className="font-bold text-sm">Anexo Obrigatório</p>
                     <p className="text-xs">Foto do atestado, documento ou advertência</p>
                 </div>
             )}
          </div>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
           <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-white border border-gray-200 rounded-xl transition-colors">Cancelar</button>
           <button 
             onClick={handleSubmit}
             disabled={!description || !selectedFile || isSaving}
             className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
           >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Registro'}
           </button>
        </div>

      </div>
    </div>
  );
};
