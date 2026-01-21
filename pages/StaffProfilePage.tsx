
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService.ts';
import { Staff, StaffDocument, StaffIncident } from '../types.ts';
import { Loader2, ArrowLeft, UserCircle2, User, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import { StaffInfoTab } from '../components/staff/StaffInfoTab.tsx';
import { StaffDocumentsTab } from '../components/staff/StaffDocumentsTab.tsx';
import { StaffIncidentsTab } from '../components/staff/StaffIncidentsTab.tsx';

export const StaffProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'incidents'>('info');

  useEffect(() => {
    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [s, docs, incs] = await Promise.all([
                dataService.getStaffById(id),
                dataService.getStaffDocuments(id),
                dataService.getStaffIncidents(id)
            ]);
            setStaff(s);
            setDocuments(docs);
            setIncidents(incs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [id]);

  const handleUpdateStaff = (updatedStaff: Staff) => {
      // Em uma aplicação real, aqui chamaríamos o dataService.updateStaff(updatedStaff)
      // Como estamos usando mock local, atualizamos o estado local para refletir na UI imediatamente
      setStaff(updatedStaff);
      console.log("Colaborador atualizado:", updatedStaff);
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!staff) return <div className="text-center p-10">Colaborador não encontrado.</div>;

  return (
    <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-6">
                <div className="flex items-center gap-5 mb-6">
                    <button onClick={() => navigate('/rh')} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ArrowLeft/></button>
                    <div className="w-20 h-20 bg-slate-100 rounded-full border shadow-sm overflow-hidden flex-shrink-0">
                        {staff.photo ? <img src={staff.photo} className="w-full h-full object-cover" /> : <UserCircle2 className="w-full h-full text-slate-300 p-2"/>}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{staff.name}</h2>
                        <p className="text-sm text-gray-500">{staff.role}</p>
                        {!staff.active && <span className="inline-block px-2 py-0.5 mt-1 bg-red-100 text-red-600 rounded text-xs font-bold">Inativo</span>}
                    </div>
                </div>

                <div className="flex items-center gap-6 border-b border-gray-100 overflow-x-auto">
                    <button 
                      onClick={() => setActiveTab('info')}
                      className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <User className="w-4 h-4" /> Visão Geral
                    </button>
                    <button 
                      onClick={() => setActiveTab('incidents')}
                      className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'incidents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <ClipboardList className="w-4 h-4" /> Prontuário
                    </button>
                    <button 
                      onClick={() => setActiveTab('docs')}
                      className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText className="w-4 h-4" /> Documentos
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1">
            {activeTab === 'info' && <StaffInfoTab staff={staff} incidents={incidents} onUpdate={handleUpdateStaff} />}
            {activeTab === 'incidents' && <StaffIncidentsTab staff={staff} incidents={incidents} onUpdateIncidents={setIncidents} />}
            {activeTab === 'docs' && <StaffDocumentsTab staff={staff} documents={documents} onUpdateDocuments={setDocuments} />}
        </div>
    </div>
  );
};
