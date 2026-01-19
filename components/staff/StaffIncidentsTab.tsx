
import React, { useState } from 'react';
import { Staff, StaffIncident, StaffIncidentType } from '../../types';
import { AlertTriangle, FilePlus, CalendarCheck, Clock, AlertOctagon, XCircle, Plus, Paperclip, ExternalLink } from 'lucide-react';
import { StaffIncidentModal } from './modals/StaffIncidentModal';
import { dataService } from '../../services/dataService';

interface StaffIncidentsTabProps {
  staff: Staff;
  incidents: StaffIncident[];
  onUpdateIncidents: (incidents: StaffIncident[]) => void;
}

export const StaffIncidentsTab: React.FC<StaffIncidentsTabProps> = ({ staff, incidents, onUpdateIncidents }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (data: Omit<StaffIncident, 'id' | 'createdAt'>) => {
      const newIncident = await dataService.addStaffIncident(data);
      onUpdateIncidents([...incidents, newIncident]);
  };

  const getIncidentConfig = (type: StaffIncidentType) => {
      switch (type) {
          case 'atestado':
              return { icon: FilePlus, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', title: 'Atestado Médico' };
          case 'advertencia':
              return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', title: 'Advertência' };
          case 'suspensao':
              return { icon: XCircle, color: 'text-red-800', bg: 'bg-red-200', border: 'border-red-300', title: 'Suspensão' };
          case 'ferias':
              return { icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', title: 'Férias' };
          case 'falta':
              return { icon: AlertOctagon, color: 'text-gray-700', bg: 'bg-gray-200', border: 'border-gray-300', title: 'Falta Injustificada' };
          case 'atraso':
              return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', title: 'Atraso' };
          default:
              return { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', title: 'Ocorrência' };
      }
  };

  // Ordenar cronologicamente decrescente
  const sortedIncidents = [...incidents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
       
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
           <div>
               <h3 className="font-bold text-gray-800">Prontuário e Ocorrências</h3>
               <p className="text-sm text-gray-500">Histórico de atestados, férias e advertências.</p>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-100"
           >
               <Plus className="w-4 h-4" /> Registrar Ocorrência
           </button>
       </div>

       <div className="relative pl-4 sm:pl-8 border-l-2 border-gray-100 space-y-8 py-2">
           {sortedIncidents.map(inc => {
               const config = getIncidentConfig(inc.type);
               const Icon = config.icon;
               return (
                   <div key={inc.id} className="relative group">
                       {/* Dot */}
                       <div className={`absolute -left-[25px] sm:-left-[41px] top-4 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${config.bg} ${config.color}`}>
                           <div className="w-2 h-2 rounded-full bg-current"></div>
                       </div>

                       <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${config.border}`}>
                           <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2">
                                   <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${config.bg} ${config.color}`}>
                                       <Icon className="w-3.5 h-3.5" /> {config.title}
                                   </span>
                                   <span className="text-gray-400 text-xs font-medium border-l border-gray-200 pl-2">
                                       {new Date(inc.date).toLocaleDateString('pt-BR')}
                                   </span>
                               </div>
                               {inc.attachmentUrl && (
                                   <a 
                                     href={inc.attachmentUrl} 
                                     target="_blank" 
                                     rel="noreferrer" 
                                     className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                                     title="Ver Anexo"
                                   >
                                       <Paperclip className="w-4 h-4" />
                                   </a>
                               )}
                           </div>
                           
                           <p className="text-gray-700 text-sm leading-relaxed">{inc.description}</p>
                           
                           <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider">
                               <span>Registrado em {new Date(inc.createdAt).toLocaleDateString('pt-BR')}</span>
                           </div>
                       </div>
                   </div>
               );
           })}

           {sortedIncidents.length === 0 && (
               <div className="pl-4 text-gray-400 text-sm italic">
                   Nenhuma ocorrência registrada no histórico deste colaborador.
               </div>
           )}
       </div>

       <StaffIncidentModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         staff={staff}
         onSave={handleSave}
       />

    </div>
  );
};
