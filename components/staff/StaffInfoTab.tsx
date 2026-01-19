
import React from 'react';
import { Staff } from '../../types';
import { User, Phone, MapPin, Calendar, Briefcase, CreditCard, Building } from 'lucide-react';

export const StaffInfoTab: React.FC<{ staff: Staff }> = ({ staff }) => {
  const { personalInfo, contractInfo, financialInfo } = staff;

  if (!personalInfo || !contractInfo) return <div className="p-6 text-gray-500">Informações incompletas.</div>;

  const DetailRow = ({ icon: Icon, label, value }: any) => (
      <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
          <span className="text-gray-500 text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-gray-400"/> {label}</span>
          <span className="font-semibold text-gray-900 text-sm">{value || '-'}</span>
      </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="w-5 h-5 text-blue-500" /> Dados Pessoais
            </h3>
            <DetailRow icon={CreditCard} label="CPF" value={personalInfo.cpf} />
            <DetailRow icon={CreditCard} label="RG" value={personalInfo.rg} />
            <DetailRow icon={Calendar} label="Nascimento" value={new Date(personalInfo.birthDate).toLocaleDateString('pt-BR')} />
            <DetailRow icon={Phone} label="Telefone" value={personalInfo.phone} />
            <DetailRow icon={MapPin} label="Endereço" value={personalInfo.address} />
            <DetailRow icon={User} label="Estado Civil" value={personalInfo.maritalStatus} />
        </div>

        <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Briefcase className="w-5 h-5 text-purple-500" /> Contrato & Cargo
                </h3>
                <DetailRow icon={Briefcase} label="Cargo" value={contractInfo.jobTitle} />
                <DetailRow icon={Calendar} label="Admissão" value={new Date(contractInfo.admissionDate).toLocaleDateString('pt-BR')} />
                <DetailRow icon={Briefcase} label="Departamento" value={contractInfo.department} />
                <DetailRow icon={Building} label="Escala" value={contractInfo.scale} />
            </div>

            {financialInfo && (
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Building className="w-5 h-5 text-emerald-500" /> Dados Bancários
                    </h3>
                    <DetailRow icon={Building} label="Banco" value={financialInfo.bankInfo.banco} />
                    <DetailRow icon={CreditCard} label="Agência" value={financialInfo.bankInfo.agencia} />
                    <DetailRow icon={CreditCard} label="Conta" value={financialInfo.bankInfo.conta} />
                    <DetailRow icon={CreditCard} label="Chave Pix" value={financialInfo.bankInfo.pix} />
                </div>
            )}
        </div>
    </div>
  );
};
