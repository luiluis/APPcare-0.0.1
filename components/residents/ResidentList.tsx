
import React, { useState, useMemo } from 'react';
import { Resident, Branch, IncidentReport } from '../../types';
import { User, ChevronRight, LayoutGrid, List, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ResidentListProps {
  residents: Resident[];
  branches: Branch[];
  incidents?: IncidentReport[];
  onSelect: (resident: Resident) => void;
  onReportIncident?: (resident: Resident) => void;
}

export const ResidentList: React.FC<ResidentListProps> = ({ residents, branches, incidents = [], onSelect, onReportIncident }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Verifica se o residente teve incidente grave nas ultimas 48h
  const getResidentAlertStatus = (residentId: string) => {
    const fortyEightHoursAgo = new Date().getTime() - (48 * 60 * 60 * 1000);
    return incidents.some(inc => 
      inc.residentId === residentId && 
      inc.severity === 'alta' && 
      new Date(inc.date).getTime() > fortyEightHoursAgo
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-gray-800">Listagem de Residentes</h2>
         <div className="flex gap-3">
             <div className="bg-white border border-gray-200 p-1 rounded-lg flex">
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   <List className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   <LayoutGrid className="w-5 h-5" />
                 </button>
             </div>
             <button className="text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-sm">
              + Adicionar Novo
             </button>
         </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-medium uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4">Grau Dep.</th>
                <th className="px-6 py-4">Alertas</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {residents.map(r => {
                const hasCriticalAlert = getResidentAlertStatus(r.id);
                return (
                  <tr key={r.id} className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${hasCriticalAlert ? 'bg-red-50/20' : ''}`} onClick={() => onSelect(r)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${hasCriticalAlert ? 'border-red-500' : 'border-gray-100'}`}>
                            {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-300" />}
                        </div>
                        <span className="font-bold text-gray-900 text-base">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{branches.find(b => b.id === r.branchId)?.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${r.careLevel === 3 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        Grau {r.careLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hasCriticalAlert && (
                        <div className="flex items-center gap-1.5 text-red-600 font-extrabold animate-pulse">
                          <ShieldAlert className="w-4 h-4" /> CRÍTICO 48h
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); onReportIncident?.(r); }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Relatar Incidente"
                         >
                            <AlertTriangle className="w-5 h-5" />
                         </button>
                         <button className="p-2 text-gray-300 group-hover:text-blue-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {residents.map(r => {
            const hasCriticalAlert = getResidentAlertStatus(r.id);
            return (
              <div 
                key={r.id} 
                onClick={() => onSelect(r)}
                className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center group relative
                   ${hasCriticalAlert ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}
                `}
              >
                 {hasCriticalAlert && (
                   <div className="absolute top-4 right-4 text-red-600 animate-bounce">
                      <ShieldAlert className="w-6 h-6" />
                   </div>
                 )}

                 <div className={`w-24 h-24 rounded-full border-4 shadow-md mb-4 overflow-hidden relative group-hover:scale-105 transition-transform
                    ${hasCriticalAlert ? 'border-red-500' : 'border-white'}
                 `}>
                     {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" /> : (
                       <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <User className="w-10 h-10" />
                       </div>
                     )}
                 </div>
                 
                 <h3 className="text-lg font-bold text-gray-900 mb-1">{r.name}</h3>
                 <p className="text-xs text-gray-400 mb-4">{branches.find(b => b.id === r.branchId)?.name}</p>

                 <div className="flex gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase">Grau {r.careLevel}</span>
                    <button 
                       onClick={(e) => { e.stopPropagation(); onReportIncident?.(r); }}
                       className="px-2.5 py-1 bg-red-100 rounded-lg text-[10px] font-bold text-red-700 uppercase hover:bg-red-200"
                    >
                       Relatar Incidente
                    </button>
                 </div>
                 
                 <button className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm transition-colors group-hover:bg-blue-600">
                   Ver Perfil
                 </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
