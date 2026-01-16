
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResidentList } from '../components/residents/ResidentList';
import { IncidentReportModal } from '../components/modals/IncidentReportModal';
import { useData } from '../contexts/DataContext';
import { BRANCHES } from '../constants';
import { Resident } from '../types';

export const ResidentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { residents, selectedBranchId, incidents, addIncident } = useData();
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentTarget, setIncidentTarget] = useState<Resident | null>(null);

  const filteredResidents = useMemo(() => {
    return selectedBranchId === 'all' ? residents : residents.filter(r => r.branchId === selectedBranchId);
  }, [selectedBranchId, residents]);

  const handleReportIncident = (res: Resident) => {
    setIncidentTarget(res);
    setIsIncidentModalOpen(true);
  };

  return (
    <>
      <ResidentList 
        residents={filteredResidents} 
        branches={BRANCHES} 
        incidents={incidents}
        onSelect={(r) => navigate(`/residentes/${r.id}`)} 
        onReportIncident={handleReportIncident}
      />

      <IncidentReportModal 
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        resident={incidentTarget}
        onSave={addIncident}
      />
    </>
  );
};
