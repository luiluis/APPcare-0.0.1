
import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Camera, Loader2, Image as ImageIcon, CheckCircle, ShieldAlert } from 'lucide-react';
import { Resident, IncidentType, IncidentSeverity } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  onSave: (incidentData: any) => Promise<void>;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ isOpen, onClose, resident, onSave }) => {
  const { user } = useAuth();
  const [type, setType] = useState<IncidentType>('queda');
  const [severity, setSeverity] = useState<IncidentSeverity>('média');
  const [description, setDescription] = useState('');
  const [familyNotified, setFamilyNotified] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !resident) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const url = await storageService.uploadFile(file, 'incidents');
        setPhotos(prev => [...prev, url]);
      } catch (error) {
        alert("Erro no upload da imagem.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemovePhoto = (url: string) => {
    setPhotos(prev => prev.filter(p => p !== url));
  };

  const isLesion = type === 'lesão';
  const canSave = description.length > 5 && (!isLesion || photos.length > 0);

  const handleSubmit = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({
        residentId: resident.id,
        type,
        severity,
        description,
        familyNotified,
        photos,
        date: new Date().toISOString(),
        author: user?.name || 'Sistema'
      });
      onClose();
      // Reset form
      setType('queda');
      setSeverity('média');
      setDescription('');
      setFamilyNotified(false);
      setPhotos([]);
    } catch (error) {
      alert("Erro ao salvar relatório.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
             <ShieldAlert className="w-8 h-8" />
             <div>
                <h3 className="text-xl font-bold">Relatar Incidente</h3>
                <p className="text-red-100 text-xs font-medium uppercase tracking-wider">{resident.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-red-500 p-2 rounded-full transition-colors"><X className="w-6 h-6"/></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tipo de Ocorrência</label>
                <select 
                   className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-gray-50 focus:ring-2 focus:ring-red-500"
                   value={type}
                   onChange={e => setType(e.target.value as IncidentType)}
                >
                   <option value="queda">Queda</option>
                   <option value="agressão">Agressão / Alteração</option>
                   <option value="lesão">Lesão Cutânea / Ferimento</option>
                   <option value="outro">Outro</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Gravidade</label>
                <select 
                   className={`w-full border rounded-xl px-4 py-3 outline-none font-bold focus:ring-2 focus:ring-red-500
                     ${severity === 'alta' ? 'bg-red-50 text-red-700 border-red-200' : 
                       severity === 'média' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}
                   `}
                   value={severity}
                   onChange={e => setSeverity(e.target.value as IncidentSeverity)}
                >
                   <option value="baixa">Baixa</option>
                   <option value="média">Média</option>
                   <option value="alta">Alta</option>
                </select>
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Descrição Detalhada</label>
             <textarea 
               className="w-full border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
               placeholder="Descreva exatamente o que aconteceu e as providências tomadas..."
               value={description}
               onChange={e => setDescription(e.target.value)}
             ></textarea>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="flex items-center gap-3">
                <CheckCircle className={`w-6 h-6 ${familyNotified ? 'text-emerald-500' : 'text-gray-300'}`} />
                <span className="text-sm font-bold text-gray-700">Família Notificada?</span>
             </div>
             <button 
               onClick={() => setFamilyNotified(!familyNotified)}
               className={`w-12 h-6 rounded-full transition-colors relative ${familyNotified ? 'bg-emerald-500' : 'bg-gray-300'}`}
             >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${familyNotified ? 'left-7' : 'left-1'}`}></div>
             </button>
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                   Evidência Fotográfica {isLesion && <span className="text-red-600 font-extrabold">(OBRIGATÓRIO)</span>}
                </label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700 text-sm font-bold flex items-center gap-1"
                >
                   {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4"/>} Adicionar Foto
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
             </div>

             <div className="flex flex-wrap gap-3">
                {photos.map(url => (
                  <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={url} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleRemovePhoto(url)}
                      className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {photos.length === 0 && (
                   <div className="w-full py-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium">Nenhuma evidência anexada</span>
                   </div>
                )}
             </div>
          </div>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
           <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-white border border-gray-200 rounded-xl transition-colors">Cancelar</button>
           <button 
             onClick={handleSubmit}
             disabled={!canSave || isSaving}
             className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
           >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><AlertTriangle className="w-5 h-5"/> Registrar Ocorrência</>}
           </button>
        </div>

      </div>
    </div>
  );
};
