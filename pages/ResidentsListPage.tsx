
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResidentList } from '../components/residents/ResidentList.tsx';
import { IncidentReportModal } from '../components/modals/IncidentReportModal.tsx';
import { dataService } from '../services/dataService.ts';
import { useData } from '../contexts/DataContext.tsx';
import { BRANCHES } from '../constants.ts';
import { Resident, IncidentReport } from '../types.ts';
import { Loader2, AlertCircle, Users, Search } from 'lucide-react';

export const ResidentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranchId, addIncident } = useData();

  // Estados Locais de Dados
  const [residents, setResidents] = useState<Resident[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentTarget, setIncidentTarget] = useState<Resident | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca paralela de residentes e incidentes para performance
      const [resData, incData] = await Promise.all([
        dataService.getResidents(),
        dataService.getIncidents()
      ]);
      setResidents(resData);
      setIncidents(incData);
    } catch (err: any) {
      console.error("Erro ao carregar lista de residentes:", err);
      setError(err.message || "Não foi possível carregar a lista de residentes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    // Recarrega incidentes para atualizar os alertas na lista imediatamente
    const updatedIncidents = await dataService.getIncidents();
    setIncidents(updatedIncidents);
  };

  if (loading && residents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium">Carregando lista de residentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center shadow-sm max-w-lg mx-auto mt-10">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button 
          onClick={loadData}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de Pesquisa Local */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por nome do residente..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
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
