
import React, { useMemo } from 'react';
import { DailyRoutineDashboard } from '../components/DailyRoutineDashboard';
import { useData } from '../contexts/DataContext';

export const RoutinePage: React.FC = () => {
  const { residents, selectedBranchId, updateResident, logAction, addEvolution } = useData();

  const filteredResidents = useMemo(() => {
    return selectedBranchId === 'all' ? residents : residents.filter(r => r.branchId === selectedBranchId);
  }, [selectedBranchId, residents]);

  return (
    <DailyRoutineDashboard 
      residents={filteredResidents} 
      onLogAction={logAction} 
      onAddEvolution={addEvolution}
      onUpdateResident={updateResident}
    />
  );
};
