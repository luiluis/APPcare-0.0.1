
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.tsx';
import { BRANCHES } from '../constants.ts';
import { Users, Search, Building2, ChevronRight, UserCircle2, CheckCircle2 } from 'lucide-react';
import { CreateStaffModal } from '../components/staff/modals/CreateStaffModal.tsx';

export const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const { staff, selectedBranchId, addStaff } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchBranch = selectedBranchId === 'all' || s.branchId === selectedBranchId;
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.role.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBranch && matchSearch;
    });
  }, [staff, selectedBranchId, searchTerm]);

  const handleCreateStaff = async (data: any) => {
      await addStaff(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* Toast de Sucesso */}
      {showSuccess && (
          <div className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right fade-in">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                  <p className="font-bold text-sm">Sucesso!</p>
                  <p className="text-xs text-emerald-100">Colaborador cadastrado.</p>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h2>
            <p className="text-gray-500 text-sm">Controle de colaboradores, escalas e documentação.</p>
         </div>
         <button 
           onClick={() => setIsCreateModalOpen(true)}
           className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2"
         >
            + Novo Colaborador
         </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por nome ou cargo..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 border-l text-gray-400">
          <Users className="w-5 h-5" />
          <span className="text-sm font-bold">{filteredStaff.length} ativos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredStaff.map(s => (
             <div 
               key={s.id} 
               onClick={() => navigate(`/rh/${s.id}`)}
               className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
             >
                <div className="flex items-start justify-between mb-4">
                   <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                      {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <UserCircle2 className="w-full h-full text-slate-300 p-2"/>}
                   </div>
                   <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'Ativo' : 'Inativo'}
                   </span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{s.name}</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">{s.role}</p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Building2 className="w-3.5 h-3.5" />
                        {BRANCHES.find(b => b.id === s.branchId)?.name}
                    </div>
                    {s.contractInfo?.scale && (
                        <div className="inline-block px-2 py-1 bg-gray-50 rounded text-xs font-semibold text-gray-600">
                            Escala: {s.contractInfo.scale}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-50 pt-4 flex justify-between items-center text-sm font-bold text-blue-600">
                    <span>Ver Perfil</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
             </div>
         ))}
      </div>

      {filteredStaff.length === 0 && (
         <div className="text-center py-20 text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="font-medium">Nenhum colaborador encontrado.</p>
         </div>
      )}

      <CreateStaffModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateStaff}
      />

    </div>
  );
};
