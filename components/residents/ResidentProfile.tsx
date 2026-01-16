
import React, { useState, useEffect } from 'react';
import { Resident, Invoice, AuditLog, FeeConfig, Prescription, StockItem, Evolution, ResidentDocument } from '../../types';
import { BRANCHES } from '../../constants';
import { ArrowLeft, Activity, Pill, Package, FileText, AlertTriangle, Wallet, Edit, Save, X, Camera, Calendar as CalendarIcon, MapPin, User, Stethoscope, Plus, Droplets, FolderOpen, HeartPulse, Building2 } from 'lucide-react';
import { ClinicalTab } from './tabs/ClinicalTab';
import { PersonalDataTab } from './tabs/PersonalDataTab';
import { PrescriptionTab } from './tabs/PrescriptionTab';
import { StockTab } from './tabs/StockTab';
import { EvolutionTab } from './tabs/EvolutionTab';
import { FinancialTab } from './tabs/FinancialTab';
import { DocumentsTab } from './tabs/DocumentsTab';

interface ResidentProfileProps {
  resident: Resident;
  prescriptions: Prescription[];
  stock: StockItem[];
  evolutions: Evolution[];
  documents: ResidentDocument[];
  onBack: () => void;
  onUpdateResident: (updated: Resident) => void;
  onUpdatePrescriptions: (updated: Prescription[]) => void;
  onUpdateStock: (updated: StockItem[]) => void;
  onUpdateDocuments: (updated: ResidentDocument[]) => void;
  invoices: Invoice[];
  onLogAction?: (action: string, details: string, category: AuditLog['category'], residentId?: string) => void;
  onAddEvolution: (resId: string, content: string, type: Evolution['type']) => void;
  onUpdateFee?: (residentId: string, newFeeConfig: FeeConfig, updatePendingInvoices: boolean) => void;
}

export const ResidentProfile: React.FC<ResidentProfileProps> = (props) => {
  const { resident, prescriptions, stock, evolutions, documents, onBack, onUpdateResident, invoices, onLogAction, onAddEvolution, onUpdateFee } = props;
  
  const [section, setSection] = useState<'health' | 'admin'>('health');
  const [activeTab, setActiveTab] = useState<string>('clinical'); 

  useEffect(() => {
      if (section === 'health') setActiveTab('clinical');
      else setActiveTab('personal');
  }, [section]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [modalTab, setModalTab] = useState<'personal' | 'clinical'>('personal');
  const [editForm, setEditForm] = useState(resident);
  const [tagInput, setTagInput] = useState('');

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) { age--; }
    return age;
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase mb-1.5";

  const healthTabs = [
      { id: 'clinical', label: 'Resumo Clínico', icon: Activity },
      { id: 'meds', label: 'Prescrições', icon: Pill },
      { id: 'stock', label: 'Estoque', icon: Package },
      { id: 'evolution', label: 'Evolução', icon: FileText },
  ];

  const adminTabs = [
      { id: 'personal', label: 'Dados & Contatos', icon: User },
      { id: 'finance', label: 'Financeiro', icon: Wallet },
      { id: 'docs', label: 'Documentos', icon: FolderOpen },
  ];

  const currentTabs = section === 'health' ? healthTabs : adminTabs;

  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
         <div className="p-6">
             <div className="flex items-center gap-5 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ArrowLeft/></button>
                <div className="w-20 h-20 bg-slate-100 rounded-full border shadow-sm overflow-hidden flex-shrink-0">
                    {resident.photo ? <img src={resident.photo} className="w-full h-full object-cover"/> : <User className="w-10 h-10 m-5 text-slate-300"/>}
                </div>
                <div>
                   <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">{resident.name}</h2>
                      <button onClick={() => setIsEditingProfile(true)} className="p-1.5 text-gray-400 hover:text-blue-600 border rounded-lg hover:bg-blue-50"><Edit className="w-4 h-4"/></button>
                   </div>
                   <p className="text-sm text-gray-500">{BRANCHES.find(b => b.id === resident.branchId)?.name} • Grau {resident.careLevel}</p>
                </div>
             </div>

             <div className="flex bg-gray-100/80 p-1.5 rounded-xl w-fit mb-6">
                 <button onClick={() => setSection('health')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${section === 'health' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Área de Saúde</button>
                 <button onClick={() => setSection('admin')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${section === 'admin' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>Administrativo</button>
             </div>

             <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {currentTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold transition-all text-sm whitespace-nowrap outline-none ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}><tab.icon className="w-4 h-4" /> {tab.label}</button>
                ))}
             </div>
         </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-10">
         {activeTab === 'clinical' && <ClinicalTab resident={resident} onUpdateResident={onUpdateResident} />}
         {activeTab === 'meds' && <PrescriptionTab resident={resident} prescriptions={prescriptions} onUpdatePrescriptions={props.onUpdatePrescriptions} />}
         {activeTab === 'stock' && <StockTab resident={resident} stock={stock} onUpdateStock={props.onUpdateStock} />}
         {activeTab === 'evolution' && <EvolutionTab resident={resident} evolutions={evolutions} onAddEvolution={onAddEvolution} />}
         {activeTab === 'personal' && <PersonalDataTab resident={resident} />}
         {activeTab === 'finance' && <FinancialTab resident={resident} invoices={invoices} onUpdateResident={onUpdateResident} onUpdateFee={onUpdateFee} />}
         {activeTab === 'docs' && <DocumentsTab resident={resident} documents={documents} onUpdateDocuments={props.onUpdateDocuments} />}
      </div>

      {isEditingProfile && (
          <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                 <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl font-bold"><h3>Editar Cadastro</h3><button onClick={() => setIsEditingProfile(false)}><X/></button></div>
                 <div className="p-8 space-y-4">
                    <div><label className={labelStyle}>Nome Completo</label><input className={inputStyle} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelStyle}>Nascimento</label><input type="date" className={inputStyle} value={editForm.birthDate || ''} onChange={e => { const newD = e.target.value; setEditForm({...editForm, birthDate: newD, age: calculateAge(newD)}); }}/></div>
                        <div><label className={labelStyle}>Grau Dependência</label><select className={inputStyle} value={editForm.careLevel} onChange={e => setEditForm({...editForm, careLevel: parseInt(e.target.value) as 1|2|3})}><option value={1}>Grau 1</option><option value={2}>Grau 2</option><option value={3}>Grau 3</option></select></div>
                    </div>
                    <button onClick={() => { onUpdateResident(editForm); setIsEditingProfile(false); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg mt-4">Salvar Alterações</button>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};
