
import React, { useState, useEffect } from 'react';
import { Staff } from '../../types';
import { User, Phone, MapPin, Calendar, Briefcase, CreditCard, Building, Edit2, Save, X, Check, AlertOctagon, Power, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface StaffInfoTabProps {
  staff: Staff;
  onUpdate: (updatedStaff: Staff) => void;
}

export const StaffInfoTab: React.FC<StaffInfoTabProps> = ({ staff, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Staff>(staff);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Sincroniza o form se a prop staff mudar externamente
  useEffect(() => {
    setFormData(staff);
  }, [staff]);

  const handleInputChange = (section: keyof Staff, field: string, value: any, nestedField?: string) => {
    setFormData(prev => {
      const sectionData = prev[section] as any;
      
      // Caso especial para bankInfo que é aninhado dentro de financialInfo
      if (nestedField && typeof sectionData[field] === 'object') {
          return {
              ...prev,
              [section]: {
                  ...sectionData,
                  [field]: {
                      ...sectionData[field],
                      [nestedField]: value
                  }
              }
          };
      }

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value
        }
      };
    });
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(staff);
    setIsEditing(false);
  };

  const handleToggleStatus = () => {
      const updatedStaff = { ...staff, active: !staff.active };
      onUpdate(updatedStaff);
      setShowDeactivateConfirm(false);
  };

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
      <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 min-h-[48px]">
        <span className="text-gray-500 text-sm flex items-center gap-2 w-1/3">
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0"/> {label}
        </span>
        
        <div className="w-2/3 text-right">
            {isEditing ? (
                type === 'select' ? (
                    <select
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right"
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
        
        {/* Header de Ações Flutuante (Apenas mobile ou se quiser destaque) */}
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

        <div className="space-y-6">
            {/* Contrato e Cargo */}
            <div className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-purple-300 ring-4 ring-purple-50/50' : 'border-gray-100'}`}>
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
            </div>

            {/* Dados Bancários */}
            {formData.financialInfo && (
                <div className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${isEditing ? 'border-emerald-300 ring-4 ring-emerald-50/50' : 'border-gray-100'}`}>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Building className="w-5 h-5 text-emerald-500" /> Dados Bancários
                    </h3>
                    <EditableRow icon={Building} label="Banco" value={formData.financialInfo.bankInfo.banco} section="financialInfo" field="bankInfo" nestedField="banco" />
                    <EditableRow icon={CreditCard} label="Agência" value={formData.financialInfo.bankInfo.agencia} section="financialInfo" field="bankInfo" nestedField="agencia" />
                    <EditableRow icon={CreditCard} label="Conta" value={formData.financialInfo.bankInfo.conta} section="financialInfo" field="bankInfo" nestedField="conta" />
                    <EditableRow icon={CreditCard} label="Chave Pix" value={formData.financialInfo.bankInfo.pix} section="financialInfo" field="bankInfo" nestedField="pix" />
                </div>
            )}
        </div>

        {/* Zona de Perigo */}
        <div className="lg:col-span-2 mt-4 border border-red-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-900">Ações Administrativas</h3>
            </div>
            <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p className="font-bold text-gray-900 text-sm">
                        {staff.active ? 'Desativar acesso do colaborador' : 'Reativar acesso do colaborador'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {staff.active 
                            ? 'Isso impedirá o acesso ao sistema e ocultará o colaborador das escalas operacionais.' 
                            : 'Isso permitirá que o colaborador acesse o sistema novamente.'}
                    </p>
                </div>
                <button 
                    onClick={() => setShowDeactivateConfirm(true)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 shadow-sm
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
                ? "Tem certeza que deseja desativar este colaborador? Ele perderá acesso imediato ao sistema e não aparecerá nas opções de escala." 
                : "Deseja reativar este colaborador? Ele voltará a ter acesso ao sistema."}
            confirmText={staff.active ? "Sim, desativar" : "Sim, reativar"}
            onConfirm={handleToggleStatus}
            onCancel={() => setShowDeactivateConfirm(false)}
            isDestructive={staff.active}
        />

    </div>
  );
};
