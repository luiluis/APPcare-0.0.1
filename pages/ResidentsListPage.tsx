
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResidentList } from '../components/residents/ResidentList.tsx';
import { IncidentReportModal } from '../components/modals/IncidentReportModal.tsx';
import { useData } from '../contexts/DataContext.tsx';
import { BRANCHES } from '../constants.ts';
import { Resident } from '../types.ts';
import { Users, Search } from 'lucide-react';

export const ResidentsListPage: React.FC = () => {
  const navigate = useNavigate();
  // Agora usamos residents e incidents diretamente do Contexto global, já carregados pelo App
  const { residents, incidents, selectedBranchId, addIncident } = useData();

  // Estados de UI
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentTarget, setIncidentTarget] = useState<Resident | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  // Filtragem combinada (Unidade + Busca por Nome)
  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchBranch = selectedBranchId === 'all' || r.branchId === selectedBranchId;
      const matchSearch = r.name.toLowerCase().includes(localSearch.toLowerCase());
      return matchBranch && matchSearch;
    });
  }, [selectedBranchId, residents, localSearch]);

  const handleReportIncident = (res: Resident) => {
    setIncidentTarget(res);
    setIsIncidentModalOpen(true);
  };

  const handleSaveIncident = async (data: any) => {
    await addIncident(data);
    // Não precisamos recarregar manualmente, o Contexto atualiza o estado incidents
  };

  return (
    <div className="space-y-6">
      {/* Barra de Pesquisa Local */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por nome do residente..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder-gray-400"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 border-l text-gray-400">
          <Users className="w-5 h-5" />
          <span className="text-sm font-bold">{filteredResidents.length} encontrados</span>
        </div>
      </div>

      {residents.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-200">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400">Nenhum residente cadastrado</h3>
          <p className="text-sm text-gray-300">Comece adicionando seu primeiro residente ao sistema.</p>
        </div>
      ) : (
        <ResidentList 
          residents={filteredResidents} 
          branches={BRANCHES} 
          incidents={incidents}
          onSelect={(r) => navigate(`/residentes/${r.id}`)} 
          onReportIncident={handleReportIncident}
        />
      )}

      <IncidentReportModal 
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        resident={incidentTarget}
        onSave={handleSaveIncident}
      />
    </div>
  );
};
