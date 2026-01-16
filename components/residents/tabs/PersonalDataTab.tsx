
import React from 'react';
import { Resident } from '../../../types';
import { Phone, User, Calendar, MapPin, Ambulance, Info } from 'lucide-react';
import { BRANCHES } from '../../../constants';

interface PersonalDataTabProps {
  resident: Resident;
}

export const PersonalDataTab: React.FC<PersonalDataTabProps> = ({ resident }) => {
  const { medicalRecord } = resident;
  const emergencyContacts = medicalRecord?.contacts.filter(c => c.isEmergencyContact) || [];
  const otherContacts = medicalRecord?.contacts.filter(c => !c.isEmergencyContact) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Coluna 1: Dados Pessoais */}
      <div className="space-y-6">
         <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" /> Dados do Residente
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Nome Completo</span>
                <span className="font-bold text-gray-900">{resident.name}</span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Nascimento</span>
                <div className="text-right">
                    <span className="font-medium text-gray-900 block">{resident.birthDate ? new Date(resident.birthDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    <span className="text-xs text-gray-500">({resident.age} anos)</span>
                </div>
              </li>
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                 <span className="text-gray-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> Unidade</span>
                 <span className="font-medium text-gray-900">{BRANCHES.find(b => b.id === resident.branchId)?.name}</span>
              </li>
              <li className="flex items-center justify-between border-b border-gray-50 pb-2">
                 <span className="text-gray-500 flex items-center gap-2"><Info className="w-4 h-4" /> Data Admissão</span>
                 <span className="font-medium text-gray-900">{new Date(resident.admissionDate).toLocaleDateString('pt-BR')}</span>
              </li>
              <li className="flex items-center justify-between pt-2">
                 <span className="text-gray-500 flex items-center gap-2">Grau de Dependência</span>
                 <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Grau {resident.careLevel}</span>
              </li>
            </ul>
         </div>
      </div>

      {/* Coluna 2: Contatos */}
      <div className="space-y-6">
         <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-400" /> Rede de Apoio & Contatos
            </h3>
            
            {/* Emergência */}
            {emergencyContacts.length > 0 ? (
                <div className="mb-6">
                    <p className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-1.5">
                        <Ambulance className="w-3.5 h-3.5"/> Em caso de Emergência
                    </p>
                    <ul className="space-y-3">
                        {emergencyContacts.map((contact, idx) => (
                            <li key={idx} className="bg-red-50 border border-red-100 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-red-900 text-sm">{contact.name}</p>
                                    <p className="text-xs text-red-700 font-medium">{contact.relation}</p>
                                </div>
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-white text-red-700 rounded-lg border border-red-200 text-sm font-bold hover:bg-red-50 transition-colors">
                                    <Phone className="w-3.5 h-3.5" /> Ligar
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl mb-4 border border-red-100">
                    ⚠️ Nenhum contato de emergência cadastrado.
                </div>
            )}

            {/* Outros Contatos */}
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Outros Familiares</p>
                <ul className="space-y-2">
                    {otherContacts.length > 0 ? otherContacts.map((contact, idx) => (
                        <li key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{contact.name}</p>
                                <p className="text-xs text-gray-500">{contact.relation}</p>
                            </div>
                            <a href={`tel:${contact.phone}`} className="text-xs text-blue-600 font-bold hover:underline bg-white px-2 py-1 rounded border border-gray-200">
                                {contact.phone}
                            </a>
                        </li>
                    )) : <li className="text-gray-400 text-sm italic py-2">Nenhum outro contato registrado.</li>}
                </ul>
            </div>
         </div>
      </div>

    </div>
  );
};
