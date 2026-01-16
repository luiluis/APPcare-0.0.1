
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResidentProfile } from '../components/residents/ResidentProfile';
import { useData } from '../contexts/DataContext';

export const ResidentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    residents, prescriptions, stockItems, evolutions, 
    documents, invoices, updateResident, addEvolution, 
    logAction, setPrescriptions, setStockItems, setDocuments 
  } = useData();

  const resident = residents.find(r => r.id === id);

  if (!resident) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 font-bold mb-4">Residente não encontrado.</p>
        <button onClick={() => navigate('/residentes')} className="text-blue-600 font-bold hover:underline">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <ResidentProfile 
      resident={resident} 
      prescriptions={prescriptions.filter(p => p.residentId === id)}
      stock={stockItems.filter(s => s.residentId === id)}
      evolutions={evolutions.filter(e => e.residentId === id)}
      documents={documents.filter(d => d.residentId === id)}
      onBack={() => navigate('/residentes')} 
      onUpdateResident={updateResident} 
      onUpdatePrescriptions={(updated) => setPrescriptions(prev => [...prev.filter(p => p.residentId !== id), ...updated])}
      onUpdateStock={(updated) => setStockItems(prev => [...prev.filter(s => s.residentId !== id), ...updated])}
      onUpdateDocuments={(updated) => setDocuments(prev => [...prev.filter(d => d.residentId !== id), ...updated])}
      invoices={invoices} 
      onLogAction={logAction}
      onAddEvolution={addEvolution}
    />
  );
};
