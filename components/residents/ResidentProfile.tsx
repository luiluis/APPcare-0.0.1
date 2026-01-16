
import React, { useState, useEffect } from 'react';
import { Resident, Invoice, BranchType, AuditLog, FeeConfig } from '../../types';
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
  onBack: () => void;
  onUpdateResident: (updated: Resident) => void;
  invoices: Invoice[];
  onLogAction?: (action: string, details: string, category: AuditLog['category'], residentId?: string) => void;
  onUpdateFee?: (residentId: string, newFeeConfig: FeeConfig, updatePendingInvoices: boolean) => void;
}

export const ResidentProfile: React.FC<ResidentProfileProps> = ({ resident, onBack, onUpdateResident, invoices, onLogAction, onUpdateFee }) => {
  // State for Navigation Mode (Split)
  const [section, setSection] = useState<'health' | 'admin'>('health');
  
  // Tab state within section
  const [activeTab, setActiveTab] = useState<string>('clinical'); 

  // Reset active tab when section changes
  useEffect(() => {
      if (section === 'health') setActiveTab('clinical');
      else setActiveTab('personal');
  }, [section]);
  
  // Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [modalTab, setModalTab] = useState<'personal' | 'clinical'>('personal');
  const [editForm, setEditForm] = useState(resident);
  
  // Tag Inputs State (Local to Modal)
  const [tagInput, setTagInput] = useState('');

  // Sync state when modal opens
  useEffect(() => {
    if (isEditingProfile) {
      setEditForm(resident);
      setTagInput('');
    }
  }, [isEditingProfile, resident]);

  const hasAllergies = resident.medicalRecord?.allergies && resident.medicalRecord.allergies.length > 0;

  // Helper to Calculate Age
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handleSaveProfile = () => {
    onUpdateResident(editForm);
    if(onLogAction) onLogAction("Edição de Perfil", `Atualizou dados cadastrais de ${resident.name}`, "system", resident.id);
    setIsEditingProfile(false);
  };

  // --- Tag Helpers for Modal ---
  const handleAddTag = (type: 'comorbidity' | 'allergy') => {
    if (!tagInput.trim()) return;
    
    const currentRecord = editForm.medicalRecord || { 
      bloodType: '', allergies: [], comorbidities: [], contacts: [], lastVitals: { pressure: '', glucose: '', heartRate: 0, date: '' } 
    };

    if (type === 'comorbidity') {
      setEditForm({
        ...editForm,
        medicalRecord: {
          ...currentRecord,
          comorbidities: [...currentRecord.comorbidities, tagInput.trim()]
        }
      });
    } else {
      setEditForm({
        ...editForm,
        medicalRecord: {
          ...currentRecord,
          allergies: [...currentRecord.allergies, tagInput.trim()]
        }
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (type: 'comorbidity' | 'allergy', index: number) => {
    const currentRecord = editForm.medicalRecord!;
    if (type === 'comorbidity') {
      setEditForm({
        ...editForm,
        medicalRecord: {
          ...currentRecord,
          comorbidities: currentRecord.comorbidities.filter((_, i) => i !== index)
        }
      });
    } else {
      setEditForm({
        ...editForm,
        medicalRecord: {
          ...currentRecord,
          allergies: currentRecord.allergies.filter((_, i) => i !== index)
        }
      });
    }
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all text-sm";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5";

  // --- TABS CONFIG ---
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
    <div className="flex flex-col h-full bg-transparent">
      
      {/* Header Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
         {/* Faixa de Alerta de Alergia */}
         {hasAllergies && (
           <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-wide animate-pulse">
              <AlertTriangle className="w-5 h-5" />
              <span>Atenção: Alérgico a {resident.medicalRecord?.allergies.join(', ')}</span>
           </div>
         )}

         <div className="p-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-5">
                   <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                     <ArrowLeft className="w-6 h-6" />
                   </button>
                   
                   {/* Foto Real Maior */}
                   <div className="w-24 h-24 bg-slate-200 rounded-full border-4 border-white shadow-md flex-shrink-0 overflow-hidden relative group">
                      {resident.photo ? (
                        <img src={resident.photo} alt={resident.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl font-bold bg-slate-100">
                           {resident.name.charAt(0)}
                        </div>
                      )}
                   </div>

                   <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{resident.name}</h2>
                        <button 
                           onClick={() => { setIsEditingProfile(true); setModalTab('personal'); }}
                           className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white transition-all text-sm font-bold shadow-sm group"
                        >
                            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" /> Editar
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm mt-2 items-center text-gray-600">
                         <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <span className={`w-2 h-2 rounded-full ${resident.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="font-medium">{resident.status}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span>Adm: {resident.admissionDate}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{BRANCHES.find(b => b.id === resident.branchId)?.name}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* MAIN SECTION SWITCHER */}
             <div className="flex bg-gray-100/80 p-1.5 rounded-xl w-full max-w-md mb-6">
                 <button 
                   onClick={() => setSection('health')}
                   className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${section === 'health' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <HeartPulse className="w-4 h-4" /> Área de Saúde
                 </button>
                 <button 
                   onClick={() => setSection('admin')}
                   className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${section === 'admin' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <Building2 className="w-4 h-4" /> Administrativo
                 </button>
             </div>

             {/* Dynamic Sub-Tabs */}
             <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {currentTabs.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold transition-all whitespace-nowrap outline-none text-sm
                      ${activeTab === tab.id 
                        ? (section === 'health' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-purple-600 text-purple-600 bg-purple-50/50') 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
             </div>
         </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-10">
         {/* HEALTH TABS */}
         {section === 'health' && activeTab === 'clinical' && <ClinicalTab resident={resident} onUpdateResident={onUpdateResident} />}
         {section === 'health' && activeTab === 'meds' && <PrescriptionTab resident={resident} onUpdateResident={onUpdateResident} />}
         {section === 'health' && activeTab === 'stock' && <StockTab resident={resident} onUpdateResident={onUpdateResident} />}
         {section === 'health' && activeTab === 'evolution' && <EvolutionTab resident={resident} />}

         {/* ADMIN TABS */}
         {section === 'admin' && activeTab === 'personal' && <PersonalDataTab resident={resident} />}
         {section === 'admin' && activeTab === 'finance' && <FinancialTab resident={resident} invoices={invoices} onUpdateResident={onUpdateResident} onUpdateFee={onUpdateFee} />}
         {section === 'admin' && activeTab === 'docs' && <DocumentsTab resident={resident} onUpdateResident={onUpdateResident} />}
      </div>

      {/* ================= MODAL DE EDIÇÃO COMPLETO ================= */}
      {isEditingProfile && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                 
                 {/* Header Modal */}
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                     <div>
                       <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                         <Edit className="w-5 h-5 text-blue-600" /> Editar Residente
                       </h3>
                       <p className="text-sm text-gray-500 mt-1">Atualize os dados cadastrais e clínicos.</p>
                     </div>
                     <button onClick={() => setIsEditingProfile(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                 </div>
                 
                 {/* Tabs Internas do Modal */}
                 <div className="flex border-b border-gray-100 px-6">
                    <button 
                      onClick={() => setModalTab('personal')}
                      className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      <span className="flex items-center gap-2"><User className="w-4 h-4" /> Dados Pessoais</span>
                    </button>
                    <button 
                      onClick={() => setModalTab('clinical')}
                      className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'clinical' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                       <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Dados Clínicos</span>
                    </button>
                 </div>

                 {/* Corpo do Form */}
                 <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                     
                     {/* --- ABA PESSOAL --- */}
                     {modalTab === 'personal' && (
                       <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                          <div>
                              <label className={labelStyle}>URL da Foto</label>
                              <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
                                  {editForm.photo ? <img src={editForm.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera className="w-5 h-5 text-gray-300"/></div>}
                                </div>
                                <input 
                                    type="text" 
                                    className={inputStyle}
                                    placeholder="https://..."
                                    value={editForm.photo || ''}
                                    onChange={e => setEditForm({...editForm, photo: e.target.value})}
                                />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="col-span-2">
                                <label className={labelStyle}>Nome Completo</label>
                                <input 
                                    type="text" 
                                    className={inputStyle}
                                    value={editForm.name}
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                />
                              </div>

                              <div>
                                  <label className={labelStyle}>Data de Nascimento</label>
                                  <input 
                                      type="date" 
                                      className={inputStyle}
                                      value={editForm.birthDate || ''}
                                      onChange={e => {
                                          const newDate = e.target.value;
                                          const newAge = calculateAge(newDate);
                                          setEditForm({
                                              ...editForm, 
                                              birthDate: newDate,
                                              age: newAge
                                          });
                                      }}
                                  />
                                  <p className="text-xs text-gray-500 mt-1 text-right">Idade Calculada: <strong>{editForm.age} anos</strong></p>
                              </div>
                              
                              <div>
                                  <label className={labelStyle}>Admissão</label>
                                  <input 
                                      type="date" 
                                      className={inputStyle}
                                      value={editForm.admissionDate}
                                      onChange={e => setEditForm({...editForm, admissionDate: e.target.value})}
                                  />
                              </div>

                              <div>
                                  <label className={labelStyle}>Grau de Dependência</label>
                                  <select 
                                      className={inputStyle}
                                      value={editForm.careLevel}
                                      onChange={e => setEditForm({...editForm, careLevel: parseInt(e.target.value) as 1|2|3})}
                                  >
                                      <option value={1}>Grau 1 - Independente</option>
                                      <option value={2}>Grau 2 - Parcial</option>
                                      <option value={3}>Grau 3 - Total</option>
                                  </select>
                              </div>

                              <div>
                                  <label className={labelStyle}>Unidade</label>
                                  <select 
                                      className={inputStyle}
                                      value={editForm.branchId}
                                      onChange={e => setEditForm({...editForm, branchId: e.target.value})}
                                  >
                                      {BRANCHES.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                      ))}
                                  </select>
                              </div>

                              <div>
                                  <label className={labelStyle}>Status</label>
                                  <select 
                                      className={inputStyle}
                                      value={editForm.status}
                                      onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                                  >
                                      <option value="Ativo">Ativo</option>
                                      <option value="Hospitalizado">Hospitalizado</option>
                                      <option value="Inativo">Inativo</option>
                                  </select>
                              </div>

                              <div>
                                  <label className={labelStyle}>Mensalidade Base (R$)</label>
                                  <input 
                                      type="number" 
                                      className={inputStyle}
                                      value={editForm.benefitValue}
                                      onChange={e => setEditForm({...editForm, benefitValue: parseFloat(e.target.value) || 0})}
                                  />
                              </div>
                          </div>
                       </div>
                     )}

                     {/* --- ABA CLÍNICO --- */}
                     {modalTab === 'clinical' && (
                       <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                          
                          {/* Tipo Sanguíneo */}
                          <div>
                              <label className={labelStyle}>Tipo Sanguíneo</label>
                              <div className="relative">
                                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                <select 
                                    className={`${inputStyle} pl-10`}
                                    value={editForm.medicalRecord?.bloodType || ''}
                                    onChange={e => setEditForm({
                                      ...editForm,
                                      medicalRecord: { ...editForm.medicalRecord!, bloodType: e.target.value }
                                    })}
                                >
                                    <option value="">Selecione...</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                              </div>
                          </div>

                          {/* Diagnósticos (Tags) */}
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                             <label className="block text-sm font-bold text-blue-900 mb-2">Diagnósticos / Comorbidades</label>
                             <div className="flex gap-2 mb-3">
                                <input 
                                  className={inputStyle}
                                  placeholder="Ex: Diabetes, Hipertensão..."
                                  value={tagInput}
                                  onChange={e => setTagInput(e.target.value)}
                                  onKeyDown={e => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag('comorbidity');
                                    }
                                  }}
                                />
                                <button 
                                  onClick={() => handleAddTag('comorbidity')}
                                  className="px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {editForm.medicalRecord?.comorbidities.map((item, idx) => (
                                  <span key={idx} className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                                    {item}
                                    <button onClick={() => handleRemoveTag('comorbidity', idx)} className="text-blue-300 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
                                  </span>
                                ))}
                                {(!editForm.medicalRecord?.comorbidities.length) && <span className="text-gray-400 text-sm italic">Nenhum diagnóstico registrado.</span>}
                             </div>
                          </div>

                          {/* Alergias (Tags) */}
                          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                             <label className="block text-sm font-bold text-red-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Alergias</label>
                             <div className="flex gap-2 mb-3">
                                <input 
                                  className={inputStyle}
                                  placeholder="Ex: Dipirona, Sulfa..."
                                  value={tagInput} // Reusing same input state, assumes user saves before switching context or clears
                                  onChange={e => setTagInput(e.target.value)}
                                   onKeyDown={e => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag('allergy');
                                    }
                                  }}
                                />
                                <button 
                                  onClick={() => handleAddTag('allergy')}
                                  className="px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {editForm.medicalRecord?.allergies.map((item, idx) => (
                                  <span key={idx} className="px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                                    {item}
                                    <button onClick={() => handleRemoveTag('allergy', idx)} className="text-red-300 hover:text-red-600 transition-colors"><X className="w-3 h-3"/></button>
                                  </span>
                                ))}
                                {(!editForm.medicalRecord?.allergies.length) && <span className="text-gray-400 text-sm italic">Nenhuma alergia registrada.</span>}
                             </div>
                          </div>
                       </div>
                     )}
                 </div>

                 {/* Footer */}
                 <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                    <button 
                       onClick={handleSaveProfile}
                       className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all hover:-translate-y-0.5"
                    >
                       Salvar Alterações
                    </button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};
