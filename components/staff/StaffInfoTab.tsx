
import React, { useState, useEffect, useMemo } from 'react';
import { Staff, Dependent, StaffIncident } from '../../types';
import { User, Phone, MapPin, Calendar, Briefcase, CreditCard, Building, Edit2, Check, AlertOctagon, Power, RefreshCw, Palmtree, CheckCircle2, Zap, Landmark, Copy, Bus, Utensils, Baby, Trash2, Plus, Shield, Lock, Key, AlertCircle, X, AlertTriangle, Calculator, Send, CheckCircle, Banknote, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { formatCPF, formatPhone, stripSpecialChars, formatDateTime, formatCurrency } from '../../lib/utils';
import { usePayrollLogic } from '../../hooks/usePayrollLogic';

interface StaffInfoTabProps {
  staff: Staff;
  incidents?: StaffIncident[]; // Opcional para manter compatibilidade se não passado, mas idealmente obrigatório
  onUpdate: (updatedStaff: Staff) => void;
}

export const StaffInfoTab: React.FC<StaffInfoTabProps> = ({ staff, incidents = [], onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Staff>(staff);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const { calculateEstimatedSalary } = usePayrollLogic();

  // State temporário para novo dependente
  const [newDependent, setNewDependent] = useState<Partial<Dependent>>({ name: '', relation: 'filho', birthDate: '' });
  const [isAddingDependent, setIsAddingDependent] = useState(false);

  // Sincroniza o form se a prop staff mudar externamente
  useEffect(() => {
    setFormData(staff);
  }, [staff]);

  // --- CÁLCULO DE FOLHA (MÊS ATUAL) ---
  const payrollPreview = useMemo(() => {
      const today = new Date();
      return calculateEstimatedSalary(staff, incidents, today.getMonth() + 1, today.getFullYear());
  }, [staff, incidents]);

  const hasHighDiscounts = payrollPreview.totalDiscounts > ((payrollPreview.base + payrollPreview.insalubrity) * 0.1);

  const handleInputChange = (section: keyof Staff, field: string, value: any, nestedField?: string) => {
    let formattedValue = value;

    // Aplicar máscaras automaticamente
    if (field === 'cpf') formattedValue = formatCPF(value);
    if (field === 'phone') formattedValue = formatPhone(value);

    // Lógica Inteligente para Pix (UX Bônus - Auto-preenchimento ao mudar o tipo)
    if (nestedField === 'pixKeyType') {
        let suggestedKey = '';
        const personal = formData.personalInfo;
        
        if (value === 'cpf' && personal?.cpf) suggestedKey = personal.cpf;
        else if (value === 'telefone' && personal?.phone) suggestedKey = personal.phone;
        else if (value === 'email' && personal?.email) suggestedKey = personal.email;

        // Se encontrou uma sugestão, atualiza o tipo E a chave ao mesmo tempo
        if (suggestedKey) {
            setFormData(prev => ({
                ...prev,
                financialInfo: {
                    ...prev.financialInfo!,
                    bankInfo: {
                        ...prev.financialInfo!.bankInfo,
                        pixKeyType: value,
                        pixKey: suggestedKey
                    }
                }
            }));
            return; // Interrompe fluxo padrão para evitar dupla atualização
        }
    }

    setFormData(prev => {
      const sectionData = prev[section] as any;
      
      // Caso especial para objetos aninhados (bankInfo ou benefits ou systemAccess)
      if (nestedField && typeof sectionData[field] === 'object') {
          return {
              ...prev,
              [section]: {
                  ...sectionData,
                  [field]: {
                      ...sectionData[field],
                      [nestedField]: formattedValue
                  }
              }
          };
      }
      
      // Caso direto no objeto da section (ex: benefits.receivesTransportVoucher ou systemAccess.allowed)
      if (typeof sectionData === 'object' && field in sectionData) {
          return {
            ...prev,
            [section]: {
              ...sectionData,
              [field]: formattedValue
            }
          };
      }

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: formattedValue
        }
      };
    });
  };

  // Handler específico para Benefícios
  const handleBenefitsChange = (field: string, value: any) => {
      setFormData(prev => ({
          ...prev,
          benefits: {
              ...prev.benefits!,
              [field]: value
          }
      }));
  };

  // Handler específico para System Access (na raiz)
  const handleSystemAccessChange = (field: string, value: any) => {
      setFormData(prev => {
          let updates: any = { [field]: value };
          
          // Auto-fill email logic
          if (field === 'allowed' && value === true) {
              if (!prev.systemAccess?.loginEmail && prev.personalInfo?.email) {
                  updates.loginEmail = prev.personalInfo.email;
              }
          }

          return {
              ...prev,
              systemAccess: {
                  ...(prev.systemAccess || { allowed: false, accessLevel: 'basico', loginEmail: '' }),
                  ...updates
              }
          };
      });
  };

  // Resend Invite Handler
  const handleResendInvite = () => {
      alert(`Convite reenviado para ${formData.systemAccess?.loginEmail}!`);
  };

  // Handlers para Dependentes
  const handleAddDependent = () => {
      if (!newDependent.name || !newDependent.birthDate) return;
      const dep: Dependent = {
          id: `dep-${Date.now()}`,
          name: newDependent.name,
          birthDate: newDependent.birthDate,
          relation: newDependent.relation as any
      };
      setFormData(prev => ({
          ...prev,
          dependents: [...(prev.dependents || []), dep]
      }));
      setNewDependent({ name: '', relation: 'filho', birthDate: '' });
      setIsAddingDependent(false);
  };

  const handleRemoveDependent = (id: string) => {
      setFormData(prev => ({
          ...prev,
          dependents: prev.dependents?.filter(d => d.id !== id) || []
      }));
  };

  // Botão Manual "Copiar do Cadastro"
  const handleCopyPixKey = () => {
      const type = formData.financialInfo?.bankInfo.pixKeyType;
      const personal = formData.personalInfo;
      let keyToCopy = '';

      if (type === 'cpf' && personal?.cpf) keyToCopy = personal.cpf;
      else if (type === 'telefone' && personal?.phone) keyToCopy = personal.phone;
      else if (type === 'email' && personal?.email) keyToCopy = personal.email;

      if (keyToCopy) {
          handleInputChange('financialInfo', 'bankInfo', keyToCopy, 'pixKey');
      } else {
          alert('Não foi possível encontrar um dado correspondente no cadastro pessoal.');
      }
  };

  const handleSave = () => {
    // Cria uma cópia limpa dos dados antes de salvar
    const cleanedData = { ...formData };

    // Limpeza de campos pessoais
    if (cleanedData.personalInfo) {
        cleanedData.personalInfo = {
            ...cleanedData.personalInfo,
            cpf: stripSpecialChars(cleanedData.personalInfo.cpf),
            rg: stripSpecialChars(cleanedData.personalInfo.rg),
            phone: stripSpecialChars(cleanedData.personalInfo.phone)
        };
    }

    // Limpeza condicional da Chave Pix
    if (cleanedData.financialInfo?.bankInfo?.pixKey) {
        const type = cleanedData.financialInfo.bankInfo.pixKeyType?.toLowerCase();
        if (type === 'cpf' || type === 'telefone') {
            cleanedData.financialInfo.bankInfo = {
                ...cleanedData.financialInfo.bankInfo,
                pixKey: stripSpecialChars(cleanedData.financialInfo.bankInfo.pixKey)
            };
        }
    }

    // --- REGRA DE BLOQUEIO FINANCEIRO ---
    const bankInfo = cleanedData.financialInfo?.bankInfo;
    const hasPix = !!bankInfo?.pixKey;
    const hasBankAccount = !!(bankInfo?.banco && bankInfo?.agencia && bankInfo?.conta);

    if (!hasPix && !hasBankAccount) {
        alert('Erro: É obrigatório cadastrar ao menos uma forma de pagamento (Pix ou Conta Bancária Completa).');
        return;
    }

    onUpdate(cleanedData);
    setIsEditing(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleCancel = () => {
    setFormData(staff);
    setIsEditing(false);
    setIsAddingDependent(false);
  };

  const handleToggleStatus = () => {
      const updatedStaff = { ...staff, active: !staff.active };
      onUpdate(updatedStaff);
      setShowDeactivateConfirm(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Helper Idade
  const calculateAge = (dateString: string) => {
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  };

  // Cálculo de Férias e Salário Família
  const getVacationStatus = () => {
      if (!staff.contractInfo?.admissionDate) return null;
      const admission = new Date(staff.contractInfo.admissionDate);
      const today = new Date();
      const diffMonths = (today.getFullYear() - admission.getFullYear()) * 12 + (today.getMonth() - admission.getMonth());
      const currentCycleMonth = diffMonths % 12;
      const completedCycles = Math.floor(diffMonths / 12);
      const monthsSinceVesting = diffMonths - 12;
      const isVested = completedCycles >= 1;
      const progress = (currentCycleMonth / 12) * 100;
      
      let status = 'normal';
      let message = `${12 - currentCycleMonth} meses para adquirir férias.`;
      
      if (isVested) {
          if (monthsSinceVesting >= 10) {
              status = 'critical'; 
              message = 'Risco iminente de dobra (multa). Agendar urgente!';
          } else {
              status = 'warning';
              message = 'Direito adquirido. Planeje as férias.';
          }
      }
      return { progress, status, message, currentCycleMonth, isVested };
  };

  const vacationData = getVacationStatus();

  // Contagem de Cotas Salário Família (Filhos < 14 anos)
  const salarioFamiliaCount = (formData.dependents || []).reduce((acc, dep) => {
      const age = calculateAge(dep.birthDate);
      if (dep.relation === 'filho' && age < 14) return acc + 1;
      return acc;
  }, 0);

  // Helper para verificar divergência de CPF no Pix
  const checkPixMismatch = () => {
      const bankInfo = formData.financialInfo?.bankInfo;
      const personalInfo = formData.personalInfo;
      
      if (bankInfo?.pixKeyType === 'cpf' && bankInfo.pixKey && personalInfo?.cpf) {
          const cleanPix = stripSpecialChars(bankInfo.pixKey);
          const cleanCpf = stripSpecialChars(personalInfo.cpf);
          // Verifica se são diferentes E se a chave pix não está vazia
          return cleanPix !== cleanCpf && cleanPix.length > 0;
      }
      return false;
  };

  const isPixMismatch = checkPixMismatch();

  // Helper de Status de Acesso
  const getAccessStatus = () => {
      if (!formData.systemAccess?.allowed) return 'inactive';
      if (formData.systemAccess.lastLogin) return 'active';
      return 'pending';
  };

  const accessStatus = getAccessStatus();

  // Componente Auxiliar para Linhas Editáveis
  const EditableRow = ({ 
    icon: Icon, 
    label, 
    value, 
    section, 
    field, 
    nestedField, 
    type = 'text', 
    options = [] 
  }: any) => {
    const currentValue = nestedField 
        ? (formData[section as keyof Staff] as any)?.[field]?.[nestedField] 
        : (formData[section as keyof Staff] as any)?.[field];

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 min-h-[48px]">
        <span className="text-gray-500 text-sm flex items-center gap-2 w-1/3">
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0"/> {label}
        </span>
        
        <div className="w-2/3 text-right">
            {isEditing ? (
                type === 'select' ? (
                    <select
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentValue || ''}
                        onChange={(e) => handleInputChange(section, field, e.target.value, nestedField)}
                    >
                        {options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <input 
                        type={type}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                        value={type === 'date' && currentValue ? currentValue.split('T')[0] : currentValue || ''}
                        onChange={(e) => handleInputChange(section, field, e.target.value, nestedField)}
                    />
                )
            ) : (
                <span className="font-semibold text-gray-900 text-sm break-all">
                    {type === 'date' && value ? new Date(value).toLocaleDateString('pt-BR') : (value || '-')}
                </span>
            )}
        </div>
      </div>
    );
  };

  if (!formData.personalInfo || !formData.contractInfo) return <div className="p-6 text-gray-500">Informações incompletas.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 relative pb-10">
        
        {/* Toast Flutuante */}
        {showSuccessToast && (
            <div className="absolute top-0 right-0 left-0 flex justify-center z-50 pointer-events-none">
                <div className="bg-emerald-600 text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Dados atualizados com sucesso</span>
                </div>
            </div>
        )}

        {/* Header de Ações Flutuante */}
        <div className="lg:col-span-2 flex justify-end mb-2">
            {!isEditing ? (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" /> Editar Informações
                </button>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" /> Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
                    >
                        <Check className="w-4 h-4" /> Salvar Alterações
                    </button>
                </div>
            )}
        </div>

        {/* CARD DE PRÉVIA FINANCEIRA (NOVO) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start justify-between">
               
               <div className="flex-1">
                   <h3 className="font-bold text-lg flex items-center gap-2 mb-1">
                       <Banknote className="w-5 h-5 text-emerald-400" /> Prévia da Folha
                   </h3>
                   <p className="text-slate-400 text-xs">Estimativa para {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
               </div>

               <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                   <div className="flex justify-between text-slate-300">
                       <span>Salário Base</span>
                       <span className="font-medium text-white">{formatCurrency(payrollPreview.base)}</span>
                   </div>
                   <div className="flex justify-between text-slate-300">
                       <span>Insalubridade</span>
                       <span className="font-medium text-white">{formatCurrency(payrollPreview.insalubrity)}</span>
                   </div>
                   
                   {payrollPreview.totalAdditions > 0 && (
                       <div className="flex justify-between text-emerald-300">
                           <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Adicionais</span>
                           <span className="font-bold">+ {formatCurrency(payrollPreview.totalAdditions)}</span>
                       </div>
                   )}

                   {payrollPreview.totalDiscounts > 0 && (
                       <div className="flex justify-between text-rose-300">
                           <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Descontos</span>
                           <span className="font-bold">- {formatCurrency(payrollPreview.totalDiscounts)}</span>
                       </div>
                   )}
               </div>

               <div className="bg-white/10 p-3 rounded-lg min-w-[160px] text-right border border-white/10">
                   <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wide">Estimativa Líquida</p>
                   <p className="text-2xl font-bold text-emerald-400">{formatCurrency(payrollPreview.finalEstimate)}</p>
               </div>
            </div>

            {hasHighDiscounts && (
                <div className="mt-4 bg-rose-500/20 border border-rose-500/30 rounded-lg p-2 text-xs text-rose-200 flex items-center gap-2 relative z-10 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Atenção: Os descontos deste mês ultrapassam 10% da remuneração bruta.</span>
                </div>
            )}

            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <DollarSign className="w-40 h-40 text-white" />
            </div>
        </div>

        {/* Dados Pessoais */}
        <div className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-blue-300 ring-4 ring-blue-50/50' : 'border-gray-100'}`}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="w-5 h-5 text-blue-500" /> Dados Pessoais
            </h3>
            <EditableRow icon={CreditCard} label="CPF" value={formData.personalInfo.cpf} section="personalInfo" field="cpf" />
            <EditableRow icon={CreditCard} label="RG" value={formData.personalInfo.rg} section="personalInfo" field="rg" />
            <EditableRow icon={Calendar} label="Nascimento" value={formData.personalInfo.birthDate} section="personalInfo" field="birthDate" type="date" />
            <EditableRow icon={Phone} label="Telefone" value={formData.personalInfo.phone} section="personalInfo" field="phone" />
            <EditableRow icon={MapPin} label="Endereço" value={formData.personalInfo.address} section="personalInfo" field="address" />
            <EditableRow 
                icon={User} 
                label="Estado Civil" 
                value={formData.personalInfo.maritalStatus} 
                section="personalInfo" 
                field="maritalStatus" 
                type="select" 
                options={['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']}
            />
        </div>

        {/* Coluna Direita (Topo) - Contrato e Cargo */}
        <div className={`bg-white border rounded-xl p-6 shadow-sm transition-all h-fit ${isEditing ? 'border-purple-300 ring-4 ring-purple-50/50' : 'border-gray-100'}`}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Briefcase className="w-5 h-5 text-purple-500" /> Contrato & Cargo
            </h3>
            <EditableRow icon={Briefcase} label="Cargo" value={formData.contractInfo.jobTitle} section="contractInfo" field="jobTitle" />
            <EditableRow icon={Calendar} label="Admissão" value={formData.contractInfo.admissionDate} section="contractInfo" field="admissionDate" type="date" />
            <EditableRow 
                icon={Briefcase} 
                label="Departamento" 
                value={formData.contractInfo.department} 
                section="contractInfo" 
                field="department" 
                type="select" 
                options={['enfermagem', 'limpeza', 'cozinha', 'administrativo', 'manutencao']}
            />
            <EditableRow 
                icon={Building} 
                label="Escala" 
                value={formData.contractInfo.scale} 
                section="contractInfo" 
                field="scale" 
                type="select" 
                options={['12x36', '6x1', '5x2', 'outra']}
            />

            {/* --- NOVO: Widget Credenciais de Acesso (Card Style) --- */}
            <div className={`mt-4 pt-4 border-t border-gray-100 bg-indigo-50/30 -mx-6 px-6 pb-4`}>
                <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm mb-3">
                    <Shield className="w-4 h-4 text-indigo-600" /> Credenciais de Sistema
                </h4>

                <div className={`p-4 rounded-xl border transition-all ${
                    accessStatus !== 'inactive' 
                        ? 'bg-white border-emerald-200 shadow-sm' 
                        : 'bg-gray-50 border-gray-200 dashed'
                }`}>
                    {/* Header do Card */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            {/* Visual Logic: Active (Green), Pending (Yellow), Inactive (Gray) */}
                            {accessStatus === 'active' && (
                                <>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-sm font-bold text-emerald-700">Acesso Ativo</span>
                                </>
                            )}
                            {accessStatus === 'pending' && (
                                <>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                    <span className="text-sm font-bold text-amber-700">Pendente (Convite Enviado)</span>
                                </>
                            )}
                            {accessStatus === 'inactive' && (
                                <>
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                    <span className="text-sm font-bold text-gray-500">Sem Acesso</span>
                                </>
                            )}
                        </div>
                        
                        {/* Toggle Logic via Buttons */}
                        {isEditing && (
                            formData.systemAccess?.allowed ? (
                                <button 
                                    onClick={() => handleSystemAccessChange('allowed', false)}
                                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1.5 rounded border border-red-200 bg-white font-bold flex items-center gap-1 transition-colors shadow-sm"
                                    title="O funcionário não poderá mais logar, mas o cadastro de RH permanece."
                                >
                                    <Lock className="w-3 h-3" /> Revogar Acesso
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleSystemAccessChange('allowed', true)}
                                    className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded border border-indigo-200 bg-white font-bold flex items-center gap-1 transition-colors shadow-sm"
                                >
                                    <Key className="w-3 h-3" /> Conceder Acesso
                                </button>
                            )
                        )}
                    </div>

                    {/* Form Fields */}
                    {formData.systemAccess?.allowed && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">E-mail de Login</label>
                                        {/* Botão de Reenviar Convite se Pendente */}
                                        {accessStatus === 'pending' && !isEditing && (
                                            <button 
                                                onClick={handleResendInvite}
                                                className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 flex items-center gap-1 font-bold"
                                            >
                                                <Send className="w-3 h-3" /> Reenviar Convite
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isEditing ? (
                                        <input 
                                            className="w-full text-sm p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.systemAccess.loginEmail}
                                            onChange={(e) => handleSystemAccessChange('loginEmail', e.target.value)}
                                            placeholder="email@appcare.com"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-900">{formData.systemAccess.loginEmail}</span>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Nível de Permissão</label>
                                    {isEditing ? (
                                        <select 
                                            className="w-full text-sm p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            value={formData.systemAccess.accessLevel}
                                            onChange={(e) => handleSystemAccessChange('accessLevel', e.target.value)}
                                        >
                                            <option value="admin">Administrador (Total)</option>
                                            <option value="financeiro">Financeiro</option>
                                            <option value="enfermagem">Enfermagem</option>
                                            <option value="basico">Básico / Visualização</option>
                                        </select>
                                    ) : (
                                        <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-1 rounded w-fit capitalize border border-indigo-100">
                                            {formData.systemAccess.accessLevel}
                                        </span>
                                    )}
                                </div>

                                {/* Last Login Info */}
                                {accessStatus === 'active' && !isEditing && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        Último acesso: {formData.systemAccess.lastLogin ? formatDateTime(formData.systemAccess.lastLogin) : '-'}
                                    </div>
                                )}
                            </div>
                            
                            {isEditing && (
                                <div className="mt-2 text-[10px] text-gray-400 flex items-start gap-1">
                                    <AlertCircle className="w-3 h-3 mt-0.5" />
                                    O usuário deverá utilizar a opção "Esqueci a Senha" caso precise redefinir suas credenciais.
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!formData.systemAccess?.allowed && (
                        <p className="text-xs text-gray-400 italic">
                            Este colaborador está registrado apenas para fins de RH e escala. Não possui login no ERP.
                        </p>
                    )}
                </div>
            </div>

            {/* Widget de Férias */}
            {vacationData && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Palmtree className="w-3 h-3" /> Controle de Férias
                        </span>
                        <span className={`text-xs font-bold ${vacationData.status === 'critical' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {vacationData.message}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                vacationData.status === 'critical' ? 'bg-red-500' : 
                                vacationData.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${vacationData.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                        {vacationData.currentCycleMonth} / 12 meses do ciclo atual
                    </p>
                </div>
            )}
        </div>

        {/* --- NOVO BLOCO: Benefícios e Transporte --- */}
        <div className={`lg:col-span-1 bg-white border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-orange-300 ring-4 ring-orange-50/50' : 'border-gray-100'}`}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Bus className="w-5 h-5 text-orange-500" /> Benefícios e Transporte
            </h3>
            
            {/* VT Toggle */}
            <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Bus className="w-4 h-4 text-gray-400" /> Recebe Vale Transporte?
                </span>
                {isEditing ? (
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                        checked={formData.benefits?.receivesTransportVoucher || false}
                        onChange={(e) => handleBenefitsChange('receivesTransportVoucher', e.target.checked)}
                    />
                ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${formData.benefits?.receivesTransportVoucher ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {formData.benefits?.receivesTransportVoucher ? 'SIM' : 'NÃO'}
                    </span>
                )}
            </div>

            {/* VT Fields Conditional */}
            {formData.benefits?.receivesTransportVoucher && (
                <div className="bg-orange-50/50 p-3 rounded-lg mt-2 mb-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                    <div>
                        <label className="text-xs font-bold text-orange-800 uppercase block mb-1">Qtd. Diária</label>
                        {isEditing ? (
                            <input 
                                type="number" 
                                className="w-full border border-orange-200 rounded px-2 py-1 text-sm bg-white"
                                value={formData.benefits.transportVoucherDailyQty || 2}
                                onChange={(e) => handleBenefitsChange('transportVoucherDailyQty', parseFloat(e.target.value))}
                            />
                        ) : (
                            <span className="text-sm font-bold text-gray-700">{formData.benefits.transportVoucherDailyQty || '-'} passagens</span>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-orange-800 uppercase block mb-1">Valor Unit.</label>
                        {isEditing ? (
                            <input 
                                type="number" 
                                className="w-full border border-orange-200 rounded px-2 py-1 text-sm bg-white"
                                step="0.05"
                                value={formData.benefits.transportVoucherUnitValue || 0}
                                onChange={(e) => handleBenefitsChange('transportVoucherUnitValue', parseFloat(e.target.value))}
                            />
                        ) : (
                            <span className="text-sm font-bold text-gray-700">R$ {formData.benefits.transportVoucherUnitValue?.toFixed(2) || '-'}</span>
                        )}
                    </div>
                </div>
            )}

            {/* VR Toggle */}
            <div className="flex justify-between items-center py-2 border-t border-gray-100 mt-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-gray-400" /> Recebe Vale Refeição?
                </span>
                {isEditing ? (
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                        checked={formData.benefits?.receivesMealVoucher || false}
                        onChange={(e) => handleBenefitsChange('receivesMealVoucher', e.target.checked)}
                    />
                ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${formData.benefits?.receivesMealVoucher ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {formData.benefits?.receivesMealVoucher ? 'SIM' : 'NÃO'}
                    </span>
                )}
            </div>
        </div>

        {/* --- NOVO BLOCO: Dependentes --- */}
        <div className={`lg:col-span-1 bg-white border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-pink-300 ring-4 ring-pink-50/50' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-pink-500" /> Dependentes
                </h3>
                {isEditing && (
                    <button 
                        onClick={() => setIsAddingDependent(!isAddingDependent)}
                        className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded font-bold hover:bg-pink-100 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3"/> Adicionar
                    </button>
                )}
            </div>

            {/* Form de Adição */}
            {isAddingDependent && isEditing && (
                <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200 animate-in fade-in">
                    <input 
                        className="w-full mb-2 p-1.5 text-sm border rounded" 
                        placeholder="Nome do Dependente"
                        value={newDependent.name}
                        onChange={e => setNewDependent({...newDependent, name: e.target.value})}
                    />
                    <div className="flex gap-2 mb-2">
                        <select 
                            className="w-1/2 p-1.5 text-sm border rounded bg-white"
                            value={newDependent.relation}
                            onChange={e => setNewDependent({...newDependent, relation: e.target.value as any})}
                        >
                            <option value="filho">Filho(a)</option>
                            <option value="conjuge">Cônjuge</option>
                            <option value="outro">Outro</option>
                        </select>
                        <input 
                            type="date"
                            className="w-1/2 p-1.5 text-sm border rounded"
                            value={newDependent.birthDate}
                            onChange={e => setNewDependent({...newDependent, birthDate: e.target.value})}
                        />
                    </div>
                    <button 
                        onClick={handleAddDependent}
                        className="w-full bg-pink-600 text-white text-xs font-bold py-1.5 rounded hover:bg-pink-700"
                    >
                        Salvar Dependente
                    </button>
                </div>
            )}

            {/* Lista de Dependentes */}
            <div className="space-y-3">
                {formData.dependents && formData.dependents.length > 0 ? formData.dependents.map(dep => {
                    const age = calculateAge(dep.birthDate);
                    // Regra visual de Salário Família (Filho < 14 anos)
                    const isSalarioFamilia = dep.relation === 'filho' && age < 14;
                    
                    return (
                        <div key={dep.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-800">{dep.name}</p>
                                    {isSalarioFamilia && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200" title="Elegível para Salário Família">
                                            $ Família
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500 capitalize">{dep.relation} • {age} anos</span>
                                </div>
                            </div>
                            {isEditing && (
                                <button onClick={() => handleRemoveDependent(dep.id)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                }) : (
                    <p className="text-sm text-gray-400 italic">Nenhum dependente cadastrado.</p>
                )}

                {/* Resumo de Cotas */}
                {formData.dependents && formData.dependents.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">Cotas Salário Família:</span>
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                            <Calculator className="w-3 h-3" />
                            {salarioFamiliaCount} {salarioFamiliaCount === 1 ? 'cota' : 'cotas'}
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* Seção Bancária (Full Width no Grid, mas internamente dividido) */}
        {formData.financialInfo && (
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3">
                
                {/* Coluna Pix */}
                <div className={`bg-emerald-50/50 border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-emerald-100'}`}>
                    <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 border-b border-emerald-100 pb-2">
                        <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" /> Pagamento via Pix
                    </h3>
                    <div className="space-y-1">
                        <EditableRow 
                            icon={Zap} 
                            label="Tipo de Chave" 
                            value={formData.financialInfo.bankInfo.pixKeyType} 
                            section="financialInfo" 
                            field="bankInfo" 
                            nestedField="pixKeyType"
                            type="select"
                            options={['cpf', 'telefone', 'email', 'aleatoria', 'outra']}
                        />
                        
                        {/* Linha Customizada para Chave Pix com Botão de Copiar */}
                        <div className="flex items-center justify-between py-3 border-b border-emerald-100 last:border-0 min-h-[48px]">
                            <span className="text-gray-500 text-sm flex items-center gap-2 w-1/3">
                                <Check className="w-4 h-4 text-gray-400 flex-shrink-0"/> Chave Pix
                            </span>
                            <div className="w-2/3 flex items-center gap-2 justify-end">
                                {isEditing ? (
                                    <>
                                        <input
                                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                            value={formData.financialInfo?.bankInfo?.pixKey || ''}
                                            onChange={(e) => handleInputChange('financialInfo', 'bankInfo', e.target.value, 'pixKey')}
                                        />
                                        <button
                                            onClick={handleCopyPixKey}
                                            type="button"
                                            title="Copiar do Cadastro"
                                            className="p-2 bg-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-300 transition-colors shadow-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <span className="font-semibold text-gray-900 text-sm break-all flex-1 text-right">
                                        {formData.financialInfo?.bankInfo?.pixKey || '-'}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Alerta de Divergência de Titularidade */}
                        {isPixMismatch && isEditing && (
                            <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-start gap-1.5 leading-tight animate-in fade-in">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span><strong>Atenção:</strong> Esta chave Pix não pertence ao CPF do titular do cadastro.</span>
                            </div>
                        )}

                    </div>
                </div>

                {/* Coluna Banco Tradicional */}
                <div className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Landmark className="w-5 h-5 text-blue-600" /> Transferência Tradicional
                    </h3>
                    <div className="space-y-1">
                        <EditableRow icon={Building} label="Banco" value={formData.financialInfo.bankInfo.banco} section="financialInfo" field="bankInfo" nestedField="banco" />
                        <EditableRow icon={CreditCard} label="Agência" value={formData.financialInfo.bankInfo.agencia} section="financialInfo" field="bankInfo" nestedField="agencia" />
                        <EditableRow icon={CreditCard} label="Conta" value={formData.financialInfo.bankInfo.conta} section="financialInfo" field="bankInfo" nestedField="conta" />
                    </div>
                </div>

            </div>
        )}

        {/* Zona de Perigo */}
        <div className="lg:col-span-2 mt-2 border border-red-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-900">Ações Administrativas</h3>
            </div>
            <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p className="font-bold text-gray-900 text-sm">
                        {staff.active ? 'Desativar acesso do colaborador' : 'Reativar acesso do colaborador'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-lg">
                        {staff.active 
                            ? 'Isso impedirá o acesso ao sistema e ocultará o colaborador das escalas. Para segurança jurídica, o sistema não permite a exclusão definitiva de colaboradores que possuam histórico de ocorrências ou documentos.' 
                            : 'Isso permitirá que o colaborador acesse o sistema novamente.'}
                    </p>
                </div>
                <button 
                    onClick={() => setShowDeactivateConfirm(true)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 shadow-sm whitespace-nowrap
                        ${staff.active 
                            ? 'border-red-200 text-red-700 hover:bg-red-50' 
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                >
                    {staff.active ? <><Power className="w-4 h-4"/> Desativar</> : <><RefreshCw className="w-4 h-4"/> Reativar</>}
                </button>
            </div>
        </div>

        <ConfirmDialog 
            isOpen={showDeactivateConfirm}
            title={staff.active ? "Desativar Colaborador?" : "Reativar Colaborador?"}
            message={staff.active 
                ? "Tem certeza que deseja desativar este colaborador? Ele perderá acesso imediato ao sistema." 
                : "Deseja reativar este colaborador? Ele voltará a ter acesso ao sistema."}
            confirmText={staff.active ? "Sim, desativar" : "Sim, reativar"}
            onConfirm={handleToggleStatus}
            onCancel={() => setShowDeactivateConfirm(false)}
            isDestructive={staff.active}
        />

    </div>
  );
};
