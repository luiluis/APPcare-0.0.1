
import React, { useState, useEffect } from 'react';
import { Staff, Dependent } from '../../types';
import { 
  User, Briefcase, Wallet, ChevronDown, ChevronUp, 
  Save, Plus, Trash2, CheckCircle2, Building2
} from 'lucide-react';
import { formatCPF, formatPhone, stripSpecialChars } from '../../lib/utils';

interface StaffInfoTabProps {
  staff: Staff;
  onUpdate: (updatedStaff: Staff) => void;
}

// Estilos Padronizados
const inputClass = "w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500";
const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block";

// Função Utilitária Interna (Formatação R$)
const formatMoneyInput = (cents: number | undefined | null): string => {
  if (cents === undefined || cents === null || isNaN(cents)) return "0,00";
  const value = cents / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Componente de Input Monetário Robusto
const MoneyInput = ({ 
  label, 
  valueInCents, 
  onChange, 
  disabled = false,
  placeholder = "0,00",
  className = ""
}: { 
  label?: string, 
  valueInCents: number | undefined, 
  onChange: (cents: number) => void,
  disabled?: boolean,
  placeholder?: string,
  className?: string
}) => {
  
  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const cents = rawValue ? parseInt(rawValue, 10) : 0;
    onChange(cents);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && <label className={labelClass}>{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
        <input 
          type="text"
          disabled={disabled}
          maxLength={15}
          className={`w-full border border-gray-300 bg-white rounded-lg pl-10 pr-3 py-2.5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500`}
          value={formatMoneyInput(valueInCents)}
          onChange={handleMoneyChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export const StaffInfoTab: React.FC<StaffInfoTabProps> = ({ staff, onUpdate }) => {
  const [formData, setFormData] = useState<Staff>(staff);
  const [activeSection, setActiveSection] = useState<'personal' | 'contract' | 'finance'>('personal');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setFormData(staff);
  }, [staff]);

  // --- HANDLERS ---
  const handleChange = (section: keyof Staff, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as any,
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section: keyof Staff, parentField: string, nestedField: string, value: any) => {
    setFormData(prev => {
      const sectionData = prev[section] as any;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [parentField]: {
            ...sectionData[parentField],
            [nestedField]: value
          }
        }
      };
    });
  };

  const handleSave = () => {
    const cleaned = { ...formData };
    if (cleaned.personalInfo) {
      cleaned.personalInfo.cpf = stripSpecialChars(cleaned.personalInfo.cpf);
      cleaned.personalInfo.phone = stripSpecialChars(cleaned.personalInfo.phone);
    }
    onUpdate(cleaned);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // --- DEPENDENTES ---
  const addDependent = () => {
    const newDep: Dependent = { id: `new-${Date.now()}`, name: '', birthDate: '', relation: 'filho' };
    setFormData(prev => ({
      ...prev,
      dependents: [...(prev.dependents || []), newDep]
    }));
  };

  const updateDependent = (index: number, field: keyof Dependent, value: string) => {
    const newDeps = [...(formData.dependents || [])];
    newDeps[index] = { ...newDeps[index], [field]: value };
    setFormData(prev => ({ ...prev, dependents: newDeps }));
  };

  const removeDependent = (index: number) => {
    const newDeps = [...(formData.dependents || [])];
    newDeps.splice(index, 1);
    setFormData(prev => ({ ...prev, dependents: newDeps }));
  };

  // --- FINANCEIRO CUSTOMIZADO ---
  const addCustomDeduction = () => {
    const newDed = { id: `ded-${Date.now()}`, description: '', amount: 0 };
    const currentDeductions = formData.financialInfo?.customDeductions || [];
    setFormData(prev => ({
        ...prev,
        financialInfo: { ...prev.financialInfo!, customDeductions: [...currentDeductions, newDed] }
    }));
  };

  const updateCustomDeduction = (index: number, field: 'description' | 'amount', value: any) => {
    const currentDeductions = [...(formData.financialInfo?.customDeductions || [])];
    currentDeductions[index] = { ...currentDeductions[index], [field]: value };
    setFormData(prev => ({
        ...prev,
        financialInfo: { ...prev.financialInfo!, customDeductions: currentDeductions }
    }));
  };

  const removeCustomDeduction = (index: number) => {
    const currentDeductions = [...(formData.financialInfo?.customDeductions || [])];
    currentDeductions.splice(index, 1);
    setFormData(prev => ({
        ...prev,
        financialInfo: { ...prev.financialInfo!, customDeductions: currentDeductions }
    }));
  };

  // --- UI COMPONENTS ---
  const AccordionHeader = ({ id, title, icon: Icon, isOpen }: any) => (
    <div 
      onClick={() => setActiveSection(activeSection === id ? 'personal' : id)}
      className={`flex items-center justify-between p-5 cursor-pointer transition-colors border-b select-none ${isOpen ? 'bg-blue-50/60 border-blue-100' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl shadow-sm ${isOpen ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className={`font-bold text-base ${isOpen ? 'text-blue-900' : 'text-gray-700'}`}>{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300 relative mb-10">
      
      {showSuccess && (
        <div className="absolute top-4 right-4 z-10 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-right fade-in">
          <CheckCircle2 className="w-5 h-5" /> Alterações salvas!
        </div>
      )}

      {/* --- SEÇÃO 1: DADOS PESSOAIS --- */}
      <div className="border-b border-gray-100">
        <AccordionHeader id="personal" title="Dados Pessoais" icon={User} isOpen={activeSection === 'personal'} />
        
        {activeSection === 'personal' && (
          <div className="p-6 bg-white space-y-6 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Nome Completo</label>
                <input className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className={labelClass}>CPF</label>
                    <input className={inputClass} value={formatCPF(formData.personalInfo?.cpf || '')} onChange={e => handleChange('personalInfo', 'cpf', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className={labelClass}>RG</label>
                    <input className={inputClass} value={formData.personalInfo?.rg || ''} onChange={e => handleChange('personalInfo', 'rg', e.target.value)} />
                  </div>
              </div>

              <div>
                <label className={labelClass}>Data de Nascimento</label>
                <input type="date" className={inputClass} value={formData.personalInfo?.birthDate || ''} onChange={e => handleChange('personalInfo', 'birthDate', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Estado Civil</label>
                <select className={inputClass} value={formData.personalInfo?.maritalStatus || 'solteiro'} onChange={e => handleChange('personalInfo', 'maritalStatus', e.target.value)}>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                  <option value="uniao_estavel">União Estável</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Endereço Completo</label>
                <input className={inputClass} value={formData.personalInfo?.address || ''} onChange={e => handleChange('personalInfo', 'address', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className={labelClass}>Telefone / Celular</label>
                    <input className={inputClass} value={formatPhone(formData.personalInfo?.phone || '')} onChange={e => handleChange('personalInfo', 'phone', e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Pessoal</label>
                    <input type="email" className={inputClass} value={formData.personalInfo?.email || ''} onChange={e => handleChange('personalInfo', 'email', e.target.value)} />
                  </div>
              </div>
            </div>

            {/* Dependentes */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dependentes ({formData.dependents?.length || 0})</label>
                <button onClick={addDependent} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-50 transition-colors shadow-sm"><Plus className="w-3 h-3"/> Adicionar</button>
              </div>
              
              <div className="space-y-3">
                {formData.dependents?.map((dep, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <input className={`${inputClass} sm:flex-[2] border-0 bg-gray-50 focus:bg-white focus:ring-1`} placeholder="Nome" value={dep.name} onChange={e => updateDependent(idx, 'name', e.target.value)} />
                    <select className={`${inputClass} sm:flex-1 border-0 bg-gray-50 focus:bg-white focus:ring-1`} value={dep.relation} onChange={e => updateDependent(idx, 'relation', e.target.value)}>
                      <option value="filho">Filho(a)</option>
                      <option value="conjuge">Cônjuge</option>
                      <option value="outro">Outro</option>
                    </select>
                    <input type="date" className={`${inputClass} sm:flex-1 border-0 bg-gray-50 focus:bg-white focus:ring-1`} value={dep.birthDate} onChange={e => updateDependent(idx, 'birthDate', e.target.value)} />
                    <button onClick={() => removeDependent(idx)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
                {(!formData.dependents || formData.dependents.length === 0) && (
                  <p className="text-sm text-gray-400 italic text-center py-2">Nenhum dependente cadastrado.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SEÇÃO 2: CONTRATO & OCUPAÇÃO --- */}
      <div className="border-b border-gray-100">
        <AccordionHeader id="contract" title="Contrato & Ocupação" icon={Briefcase} isOpen={activeSection === 'contract'} />
        
        {activeSection === 'contract' && (
          <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-2">
             <div className="md:col-span-2">
                <label className={labelClass}>Cargo / Função na Carteira</label>
                <input className={inputClass} value={formData.contractInfo?.jobTitle || ''} onChange={e => handleChange('contractInfo', 'jobTitle', e.target.value)} />
             </div>

             <div>
                <label className={labelClass}>Departamento</label>
                <select className={inputClass} value={formData.contractInfo?.department || 'enfermagem'} onChange={e => handleChange('contractInfo', 'department', e.target.value)}>
                  <option value="enfermagem">Enfermagem</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="limpeza">Limpeza</option>
                  <option value="cozinha">Cozinha</option>
                  <option value="manutencao">Manutenção</option>
                </select>
             </div>

             <div>
                <label className={labelClass}>Data de Admissão</label>
                <input type="date" className={inputClass} value={formData.contractInfo?.admissionDate || ''} onChange={e => handleChange('contractInfo', 'admissionDate', e.target.value)} />
             </div>

             <div>
                <label className={labelClass}>Escala</label>
                <select className={inputClass} value={formData.contractInfo?.scale || '12x36'} onChange={e => handleChange('contractInfo', 'scale', e.target.value)}>
                  <option value="12x36">12x36</option>
                  <option value="6x1">6x1</option>
                  <option value="5x2">5x2</option>
                  <option value="outra">Outra</option>
                </select>
             </div>

             <div>
                <label className={labelClass}>Turno</label>
                <select className={inputClass} value={formData.contractInfo?.workShift || 'diurno'} onChange={e => handleChange('contractInfo', 'workShift', e.target.value)}>
                  <option value="diurno">Diurno</option>
                  <option value="noturno">Noturno</option>
                </select>
             </div>

             <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-xl mt-2 flex gap-4">
                <div className="flex-1">
                   <label className="text-[10px] font-bold text-blue-600 mb-1 block uppercase">Registro Profissional (Nº)</label>
                   <input className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none" value={formData.professionalInfo?.corenNumber || ''} onChange={e => handleChange('professionalInfo', 'corenNumber', e.target.value)} placeholder="Ex: 123456" />
                </div>
                <div className="w-24">
                   <label className="text-[10px] font-bold text-blue-600 mb-1 block uppercase">UF</label>
                   <input className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none uppercase" value={formData.professionalInfo?.corenState || ''} onChange={e => handleChange('professionalInfo', 'corenState', e.target.value)} maxLength={2} placeholder="SP" />
                </div>
             </div>
          </div>
        )}
      </div>

      {/* --- SEÇÃO 3: FINANCEIRO --- */}
      <div className="border-b border-gray-100">
        <AccordionHeader id="finance" title="Financeiro & Benefícios" icon={Wallet} isOpen={activeSection === 'finance'} />
        
        {activeSection === 'finance' && (
          <div className="p-6 bg-white space-y-6 animate-in slide-in-from-top-2">
             
             {/* Salário em Destaque */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <div className="md:col-span-2">
                    <MoneyInput 
                      label="Salário Base (R$)"
                      valueInCents={formData.financialInfo?.baseSalary}
                      onChange={(cents) => handleChange('financialInfo', 'baseSalary', cents)}
                      className="text-lg"
                    />
                </div>
                <div>
                  <label className={labelClass}>Insalubridade</label>
                  <select 
                    className={inputClass}
                    value={formData.financialInfo?.insalubridadeLevel || 0}
                    onChange={e => handleChange('financialInfo', 'insalubridadeLevel', parseInt(e.target.value))}
                  >
                    <option value={0}>0% - Não Recebe</option>
                    <option value={20}>20% - Grau Médio</option>
                    <option value={40}>40% - Grau Máximo</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                    <span className="text-xs text-gray-400 font-medium">
                        * Adicional calculado sobre o salário mínimo vigente.
                    </span>
                </div>
             </div>

             {/* Descontos Fixos */}
             <div>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Descontos Fixos</h4>
                    <button 
                        onClick={addCustomDeduction}
                        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Adicionar
                    </button>
                </div>

                <div className="space-y-3">
                    {formData.financialInfo?.customDeductions?.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                            <input 
                                className={`${inputClass} flex-grow`}
                                placeholder="Descrição (Ex: Plano de Saúde)"
                                value={item.description} 
                                onChange={e => updateCustomDeduction(idx, 'description', e.target.value)} 
                            />
                            <div className="w-32">
                                <MoneyInput 
                                    valueInCents={item.amount}
                                    onChange={(cents) => updateCustomDeduction(idx, 'amount', cents)}
                                    placeholder="0,00"
                                />
                            </div>
                            <button 
                                onClick={() => removeCustomDeduction(idx)}
                                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                    {(!formData.financialInfo?.customDeductions || formData.financialInfo.customDeductions.length === 0) && (
                        <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">Nenhum desconto ou adicional fixo cadastrado.</p>
                    )}
                </div>
             </div>

             <div className="h-px bg-gray-100"></div>

             {/* Benefícios (Toggles) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center gap-3 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => handleChange('benefits', 'receivesTransportVoucher', !formData.benefits?.receivesTransportVoucher)}>
                    <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                    checked={formData.benefits?.receivesTransportVoucher || false}
                    readOnly
                    />
                    <label className="text-sm font-bold text-gray-700 cursor-pointer">Vale Transporte</label>
                </div>

                <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center gap-3 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => handleChange('benefits', 'receivesMealVoucher', !formData.benefits?.receivesMealVoucher)}>
                    <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                    checked={formData.benefits?.receivesMealVoucher || false}
                    readOnly
                    />
                    <label className="text-sm font-bold text-gray-700 cursor-pointer">Vale Refeição</label>
                </div>
             </div>

             <div className="h-px bg-gray-100"></div>

             {/* Dados Bancários */}
             <div>
                <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Dados Bancários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="md:col-span-1">
                      <label className={labelClass}>Banco</label>
                      <input className={inputClass} placeholder="Ex: Itaú (341)" value={formData.financialInfo?.bankInfo.banco || ''} onChange={e => handleNestedChange('financialInfo', 'bankInfo', 'banco', e.target.value)} />
                   </div>
                   <div>
                      <label className={labelClass}>Agência</label>
                      <input className={inputClass} placeholder="0000" value={formData.financialInfo?.bankInfo.agencia || ''} onChange={e => handleNestedChange('financialInfo', 'bankInfo', 'agencia', e.target.value)} />
                   </div>
                   <div>
                      <label className={labelClass}>Conta</label>
                      <input className={inputClass} placeholder="00000-0" value={formData.financialInfo?.bankInfo.conta || ''} onChange={e => handleNestedChange('financialInfo', 'bankInfo', 'conta', e.target.value)} />
                   </div>
                   
                   <div className="md:col-span-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                          <label className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5 block">Tipo Chave Pix</label>
                          <select className={`${inputClass} border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500`} value={formData.financialInfo?.bankInfo.pixKeyType || 'cpf'} onChange={e => handleNestedChange('financialInfo', 'bankInfo', 'pixKeyType', e.target.value)}>
                             <option value="cpf">CPF</option>
                             <option value="email">Email</option>
                             <option value="telefone">Telefone</option>
                             <option value="aleatoria">Aleatória</option>
                          </select>
                       </div>
                       <div className="md:col-span-2">
                          <label className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5 block">Chave Pix</label>
                          <input className={`${inputClass} border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500`} value={formData.financialInfo?.bankInfo.pixKey || ''} onChange={e => handleNestedChange('financialInfo', 'bankInfo', 'pixKey', e.target.value)} placeholder="Chave Pix" />
                       </div>
                   </div>
                </div>
             </div>

          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
         <button 
           onClick={handleSave}
           className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 hover:-translate-y-0.5"
         >
            <Save className="w-5 h-5" /> Salvar
         </button>
      </div>

    </div>
  );
};
