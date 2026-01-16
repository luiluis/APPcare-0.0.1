
import React, { useState } from 'react';
import { Resident, Branch } from '../../types';
import { User, ChevronRight, LayoutGrid, List } from 'lucide-react';

interface ResidentListProps {
  residents: Resident[];
  branches: Branch[];
  onSelect: (resident: Resident) => void;
}

export const ResidentList: React.FC<ResidentListProps> = ({ residents, branches, onSelect }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header com Toggle de Visualização */}
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-gray-800">Listagem de Residentes</h2>
         <div className="flex gap-3">
             <div className="bg-white border border-gray-200 p-1 rounded-lg flex">
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                   title="Visualizar em Lista"
                 >
                   <List className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                   title="Visualizar em Grade"
                 >
                   <LayoutGrid className="w-5 h-5" />
                 </button>
             </div>
             <button className="text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200">
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {residents.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => onSelect(r)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden border border-gray-100">
                          {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-gray-900 text-base">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{branches.find(b => b.id === r.branchId)?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${r.careLevel === 3 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                      Grau {r.careLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 ${r.status === 'Hospitalizado' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                      {r.status === 'Hospitalizado' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-gray-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {residents.map(r => (
            <div 
              key={r.id} 
              onClick={() => onSelect(r)}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center group"
            >
               <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md mb-4 overflow-hidden relative group-hover:border-blue-50 transition-colors">
                   {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" /> : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-10 h-10" />
                     </div>
                   )}
               </div>
               
               <h3 className="text-lg font-bold text-gray-900 mb-1">{r.name}</h3>
               <p className="text-sm text-gray-500 mb-3">{r.age} anos</p>

               <div className="flex gap-2 mb-4">
                 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${r.careLevel === 3 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                      Grau {r.careLevel}
                 </span>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${r.status === 'Ativo' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {r.status}
                 </span>
               </div>
               
               <p className="text-xs text-gray-400 mb-4">{branches.find(b => b.id === r.branchId)?.name}</p>

               <button className="w-full py-2 rounded-xl bg-gray-50 text-gray-600 font-semibold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                 Ver Perfil
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
