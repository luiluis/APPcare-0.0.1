
import React, { useState, useRef } from 'react';
import { Resident, Evolution } from '../../../types';
import { FileText, UserCircle2, CheckCircle2, Filter, Camera, Image as ImageIcon, X, Sparkles, AlertCircle } from 'lucide-react';

interface EvolutionTabProps {
  resident: Resident;
  onAddEvolution: (resId: string, content: string, type: Evolution['type'], isHandoverRelevant?: boolean) => void;
}

export const EvolutionTab: React.FC<EvolutionTabProps> = ({ resident, onAddEvolution }) => {
  const { evolutions } = (resident as any); // Assumindo injeção de estado
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<'all' | 'nursing' | 'medical' | 'nutrition'>('all');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isHandoverRelevant, setIsHandoverRelevant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickChecks = [
    'Aceitou Dieta', 'Banho Realizado', 'Evacuou', 'Dormiu Bem', 'Mudança de Decúbito', 'Hidratado'
  ];

  const handleQuickCheck = (item: string) => {
    setText(prev => (prev ? prev + '. ' : '') + item);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          setAttachments(prev => [...prev, ...newFiles]);
      }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!text) return;
    onAddEvolution(resident.id, text, 'nursing', isHandoverRelevant);
    setText('');
    setIsHandoverRelevant(false);
    setAttachments([]);
  };

  const filteredEvolutions = evolutions?.filter((ev: Evolution) => filter === 'all' || ev.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
       
       <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Checklist Rápido</p>
          <div className="flex flex-wrap gap-2 mb-4">
             {quickChecks.map(check => (
               <button 
                 key={check}
                 onClick={() => handleQuickCheck(check)}
                 className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1.5"
               >
                 <CheckCircle2 className="w-3.5 h-3.5" />
                 {check}
               </button>
             ))}
          </div>

          <textarea 
            className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-400 resize-none h-32 bg-white"
            placeholder="Descreva intercorrências ou detalhes adicionais..."
            value={text}
            onChange={e => setText(e.target.value)}
          ></textarea>
          
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-50 mt-3 gap-4">
             <div className="flex items-center gap-4">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
                 >
                     <Camera className="w-4 h-4" /> Foto
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                 
                 {/* Toggle Plantão Inteligente */}
                 <button 
                    onClick={() => setIsHandoverRelevant(!isHandoverRelevant)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${isHandoverRelevant ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                 >
                    <Sparkles className={`w-4 h-4 ${isHandoverRelevant ? 'text-indigo-600' : 'text-gray-400'}`} />
                    Relevante p/ Plantão
                 </button>
             </div>
             
             <button 
               onClick={handleSubmit}
               className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
               disabled={!text}
             >
               Salvar Evolução
             </button>
          </div>
       </div>

       <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-400 mr-2" />
          {['all', 'nursing', 'medical', 'nutrition'].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
             >
               {f === 'all' ? 'Todos' : f === 'nursing' ? 'Enfermagem' : f === 'medical' ? 'Médico' : 'Nutrição'}
             </button>
          ))}
       </div>

       <div className="space-y-4">
         {filteredEvolutions?.map((ev: Evolution) => (
           <div key={ev.id} className="bg-white p-5 rounded-xl border border-gray-100 flex gap-4 transition-all hover:shadow-sm">
              <div className="flex-shrink-0">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                    ${ev.type === 'medical' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                    <UserCircle2 className="w-6 h-6" />
                 </div>
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                       <h4 className="font-bold text-gray-900 text-sm">{ev.author}</h4>
                       <p className="text-[10px] text-gray-400 uppercase tracking-widest">{ev.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {ev.isHandoverRelevant && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                <Sparkles className="w-3 h-3" /> PLANTÃO
                            </span>
                        )}
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded 
                          ${ev.type === 'medical' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ev.type}
                        </span>
                    </div>
                 </div>
                 <p className="text-gray-700 text-sm leading-relaxed">
                   {ev.content}
                 </p>
              </div>
           </div>
         ))}
       </div>

    </div>
  );
};
