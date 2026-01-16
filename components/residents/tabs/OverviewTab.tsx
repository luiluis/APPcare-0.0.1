
import React, { useState } from 'react';
import { Resident, MedicalRecord } from '../../../types';
import { Activity, Phone, User, Calendar, Droplets, Heart, TrendingUp, TrendingDown, Minus, Plus, X, AlertTriangle, Scale, Ruler, Ambulance } from 'lucide-react';

interface OverviewTabProps {
  resident: Resident;
  onUpdateResident: (updated: Resident) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ resident, onUpdateResident }) => {
  const { medicalRecord } = resident;

  // State for Vitals/Measurements Modal
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ 
      pressure: '', 
      glucose: '', 
      heartRate: '',
      weight: '',
      height: ''
  });

  if (!medicalRecord) {
    return <div className="p-8 text-center text-gray-400">Dados clínicos não cadastrados.</div>;
  }

  // --- LOGIC HELPERS ---
  const parseBP = (bp: string) => {
      const parts = bp.split('/');
      if (parts.length !== 2) return { sys: 0, dia: 0 };
      return { sys: parseInt(parts[0]), dia: parseInt(parts[1]) };
  };

  const getBPStatus = (bp: string) => {
      const { sys, dia } = parseBP(bp);
      if (sys === 0) return 'normal';
      if (sys > 140 || sys < 90 || dia > 90 || dia < 60) return 'alert';
      if (sys > 130 || dia > 85) return 'warning';
      return 'normal';
  };

  const getGlucoseStatus = (gl: string) => {
      const val = parseInt(gl);
      if (isNaN(val)) return 'normal';
      if (val < 70 || val > 180) return 'alert';
      if (val > 140) return 'warning';
      return 'normal';
  };

  const calculateBMI = (w: number, h: number) => {
      if (!w || !h) return 0;
      return parseFloat((w / (h * h)).toFixed(1));
  };

  // --- HANDLERS ---

  const handleOpenVitals = () => {
    setVitalsForm({
      pressure: '', 
      glucose: '', 
      heartRate: '',
      weight: medicalRecord.weight?.toString() || '',
      height: medicalRecord.height?.toString() || ''
    });
    setIsVitalsModalOpen(true);
  };

  const handleSaveVitals = () => {
    // Trend logic basic
    const { sys: oldSys } = parseBP(medicalRecord.lastVitals.pressure);
    const { sys: newSys } = parseBP(vitalsForm.pressure);
    const pTrend = newSys > oldSys ? 'up' : newSys < oldSys ? 'down' : 'stable';

    const today = new Date();
    const dateString = `${today.getDate()}/${today.getMonth()+1} ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    // Numeric conversions
    const w = parseFloat(vitalsForm.weight);
    const h = parseFloat(vitalsForm.height);

    onUpdateResident({
      ...resident,
      medicalRecord: {
        ...medicalRecord,
        weight: !isNaN(w) ? w : medicalRecord.weight,
        height: !isNaN(h) ? h : medicalRecord.height,
        bmi: !isNaN(w) && !isNaN(h) ? calculateBMI(w, h) : medicalRecord.bmi,
        lastVitals: {
          pressure: vitalsForm.pressure || medicalRecord.lastVitals.pressure,
          pressureTrend: vitalsForm.pressure ? pTrend : medicalRecord.lastVitals.pressureTrend,
          glucose: vitalsForm.glucose ? vitalsForm.glucose : medicalRecord.lastVitals.glucose, // keeping just number string or adding unit later
          glucoseTrend: 'stable', // simplified
          heartRate: parseInt(vitalsForm.heartRate) || medicalRecord.lastVitals.heartRate,
          heartRateTrend: 'stable',
          date: dateString
        }
      }
    });
    setIsVitalsModalOpen(false);
  };

  const renderTrend = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5";

  // Status Styles
  const cardStyles = {
      normal: "bg-white border-gray-100",
      warning: "bg-amber-50 border-amber-200",
      alert: "bg-red-50 border-red-200 animate-pulse" // Subtle pulse for alert
  };

  const textStyles = {
      normal: "text-gray-900",
      warning: "text-amber-800",
      alert: "text-red-700 font-extrabold"
  };

  const bpStatus = getBPStatus(medicalRecord.lastVitals.pressure);
  const glStatus = getGlucoseStatus(medicalRecord.lastVitals.glucose);

  // --- CONTACTS SPLIT ---
  const emergencyContacts = medicalRecord.contacts.filter(c => c.isEmergencyContact);
  const otherContacts = medicalRecord.contacts.filter(c => !c.isEmergencyContact);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Coluna Principal: Comorbidades, Vitals e Nutrição */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Comorbidades (Read Only) */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm relative group">
          <div className="flex justify-between items-start mb-4">
             <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Diagnósticos / Comorbidades
             </h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {medicalRecord.comorbidities.length > 0 ? medicalRecord.comorbidities.map(item => (
              <span key={item} className="px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm border border-gray-200">
                {item}
              </span>
            )) : <span className="text-gray-400 text-sm italic">Nenhuma comorbidade registrada.</span>}
          </div>

          {/* Mini seção de alergias */}
          <div className="mt-6 pt-4 border-t border-gray-50">
             <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Alergias</h4>
             <div className="flex flex-wrap gap-2">
                {medicalRecord.allergies.length > 0 ? medicalRecord.allergies.map(item => (
                  <span key={item} className="px-2 py-1 bg-red-50 text-red-700 font-bold rounded-md text-xs border border-red-100">
                    {item}
                  </span>
                )) : <span className="text-gray-400 text-xs italic">Nenhuma alergia conhecida.</span>}
             </div>
          </div>
        </div>

        {/* Sinais Vitais Recentes (Alert Logic) */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" /> Sinais Vitais
              </h3>
              <div className="flex items-center gap-3">
                 <span className="text-xs text-gray-400">{medicalRecord.lastVitals.date}</span>
                 <button onClick={handleOpenVitals} className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors">
                   <Plus className="w-3 h-3" /> Aferir
                 </button>
              </div>
           </div>
           
           <div className="grid grid-cols-3 gap-4">
             {/* PA Card */}
             <div className={`p-4 rounded-xl text-center border ${cardStyles[bpStatus]}`}>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Pressão (PA)</p>
                <div className="flex items-center justify-center gap-2">
                   <p className={`text-2xl font-bold ${textStyles[bpStatus]}`}>{medicalRecord.lastVitals.pressure}</p>
                   {renderTrend(medicalRecord.lastVitals.pressureTrend)}
                </div>
                {bpStatus === 'alert' && <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ ATENÇÃO</p>}
             </div>

             {/* Glicemia Card */}
             <div className={`p-4 rounded-xl text-center border ${cardStyles[glStatus]}`}>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Glicemia</p>
                <div className="flex items-center justify-center gap-2">
                   <p className={`text-2xl font-bold ${textStyles[glStatus]}`}>{medicalRecord.lastVitals.glucose}</p>
                </div>
                <p className="text-[10px] text-gray-400">mg/dL</p>
             </div>

             {/* FC Card */}
             <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Freq. Cardíaca</p>
                <div className="flex items-center justify-center gap-2">
                   <p className="text-2xl font-bold text-gray-900">{medicalRecord.lastVitals.heartRate}</p>
                </div>
                <p className="text-[10px] text-gray-400">bpm</p>
             </div>
           </div>
        </div>

        {/* Nutrition Card (NEW) */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
           <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" /> Acompanhamento Nutricional
           </h3>
           <div className="grid grid-cols-3 gap-6 divide-x divide-gray-100">
               <div className="text-center px-2">
                   <p className="text-xs text-gray-400 uppercase font-bold mb-1">Peso Atual</p>
                   <p className="text-xl font-bold text-gray-900">{medicalRecord.weight ? `${medicalRecord.weight} kg` : '-'}</p>
               </div>
               <div className="text-center px-2">
                   <p className="text-xs text-gray-400 uppercase font-bold mb-1">Altura</p>
                   <p className="text-xl font-bold text-gray-900">{medicalRecord.height ? `${medicalRecord.height} m` : '-'}</p>
               </div>
               <div className="text-center px-2">
                   <p className="text-xs text-gray-400 uppercase font-bold mb-1">IMC</p>
                   <p className={`text-xl font-bold ${
                       !medicalRecord.bmi ? 'text-gray-300' :
                       medicalRecord.bmi < 18.5 ? 'text-amber-500' : 
                       medicalRecord.bmi > 25 ? 'text-amber-500' : 'text-emerald-500'
                   }`}>
                       {medicalRecord.bmi || '-'}
                   </p>
                   {medicalRecord.bmi && medicalRecord.bmi < 18.5 && <p className="text-[10px] text-amber-600 font-bold">Baixo Peso</p>}
               </div>
           </div>
        </div>
      </div>

      {/* Coluna Lateral: Dados Gerais e Rede de Apoio */}
      <div className="space-y-6">
         <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Dados Básicos</h3>
            </div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 flex items-center gap-2"><Droplets className="w-4 h-4" /> Tipo Sanguíneo</span>
                <span className="font-bold text-gray-900">{medicalRecord.bloodType || '-'}</span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Idade</span>
                <span className="font-medium text-gray-900">{resident.age} anos</span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                 <span className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4" /> Grau Dep.</span>
                 <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">Grau {resident.careLevel}</span>
              </li>
            </ul>
         </div>

         {/* Nova Seção de Contatos Dividida */}
         <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-400" /> Rede de Apoio
            </h3>
            
            {/* Emergência */}
            {emergencyContacts.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
                        <Ambulance className="w-3 h-3"/> Emergência
                    </p>
                    <ul className="space-y-2">
                        {emergencyContacts.map((contact, idx) => (
                            <li key={idx} className="bg-red-50 border border-red-100 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-red-900 text-sm">{contact.name}</p>
                                    <p className="text-xs text-red-700">{contact.relation}</p>
                                </div>
                                <a href={`tel:${contact.phone}`} className="p-2 bg-red-200 text-red-800 rounded-lg hover:bg-red-300">
                                    <Phone className="w-4 h-4" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Outros Contatos */}
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Outros Contatos</p>
                <ul className="space-y-2">
                    {otherContacts.length > 0 ? otherContacts.map((contact, idx) => (
                        <li key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{contact.name}</p>
                                <p className="text-xs text-gray-500">{contact.relation}</p>
                            </div>
                            <a href={`tel:${contact.phone}`} className="text-xs text-blue-600 font-bold hover:underline">{contact.phone}</a>
                        </li>
                    )) : <li className="text-gray-400 text-sm italic">Nenhum outro contato.</li>}
                </ul>
            </div>
         </div>
      </div>

      {/* --- MODAL SINAIS VITAIS & ANTROPOMETRIA --- */}
      {isVitalsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-900">Nova Aferição</h3>
                 <button onClick={() => setIsVitalsModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              
              <div className="space-y-4">
                 <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                     <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Sinais Vitais</h4>
                     <div className="space-y-3">
                        <div>
                            <label className={labelStyle}>PA (mmHg)</label>
                            <input className={inputStyle} placeholder="120/80" value={vitalsForm.pressure} onChange={e => setVitalsForm({...vitalsForm, pressure: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelStyle}>HGT (mg/dL)</label>
                                <input type="number" className={inputStyle} placeholder="90" value={vitalsForm.glucose} onChange={e => setVitalsForm({...vitalsForm, glucose: e.target.value})}/>
                            </div>
                            <div>
                                <label className={labelStyle}>FC (bpm)</label>
                                <input type="number" className={inputStyle} placeholder="75" value={vitalsForm.heartRate} onChange={e => setVitalsForm({...vitalsForm, heartRate: e.target.value})}/>
                            </div>
                        </div>
                     </div>
                 </div>

                 <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-3">Antropometria (Opcional)</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelStyle}>Peso (kg)</label>
                            <input type="number" className={inputStyle} placeholder="70.5" value={vitalsForm.weight} onChange={e => setVitalsForm({...vitalsForm, weight: e.target.value})}/>
                        </div>
                        <div>
                            <label className={labelStyle}>Altura (m)</label>
                            <input type="number" className={inputStyle} placeholder="1.70" value={vitalsForm.height} onChange={e => setVitalsForm({...vitalsForm, height: e.target.value})}/>
                        </div>
                    </div>
                 </div>

                 <button onClick={handleSaveVitals} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md mt-2">
                   Salvar Dados
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
