
import React, { useState } from 'react';
import { X, UserPlus, Building2, Briefcase, CreditCard, User, Loader2 } from 'lucide-react';
import { BRANCHES } from '../../../constants';
import { Staff } from '../../../types';
import { formatCPF } from '../../../lib/utils';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: Partial<Staff>) => Promise<void>;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    branchId: BRANCHES[0].id,
    cpf: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name || !formData.role || !formData.cpf) return;
    setIsProcessing(true);
    try {
      await onSave({
        name: formData.name,
        role: formData.role,
        branchId: formData.branchId,
        active: true,
        // Inicializa objetos obrigatórios para não quebrar a visualização
        personalInfo: {
            cpf: formData.cpf,
            rg: '',
            birthDate: '',
            phone: '',
            email: '',
            address: '',
            maritalStatus: 'solteiro',
            childrenCount: 0
        },
        contractInfo: {
            admissionDate: new Date().toISOString().split('T')[0],
            jobTitle: formData.role,
            department: 'enfermagem', // Valor default seguro
            scale: '12x36',
            workShift: 'diurno'
        },
        financialInfo: {
            baseSalary: 0,
            insalubridadeLevel: 0,
            bankInfo: { banco: '', agencia: '', conta: '' }
        }
      });
      onClose();
      // Reset form
      setFormData({ name: '', role: '', branchId: BRANCHES[0].id, cpf: '' });
    } catch (error) {
      alert("Erro ao criar colaborador.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cores explícitas (bg-white text-gray-900) para evitar problemas de contraste
  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900";
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                 <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Novo Colaborador</h3>
           </div>
           <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
        </div>

        <div className="p-6 space-y-5">
           <div>
              <label className={labelStyle}>Nome Completo</label>
              <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                   className={`${inputStyle} pl-10`}
                   placeholder="Ex: João da Silva"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className={labelStyle}>Cargo / Função</label>
                 <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      className={`${inputStyle} pl-10`}
                      placeholder="Ex: Cuidador"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    />
                 </div>
              </div>
              <div>
                 <label className={labelStyle}>CPF</label>
                 <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      className={`${inputStyle} pl-10`}
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      maxLength={14}
                      onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                    />
                 </div>
              </div>
           </div>

           <div>
              <label className={labelStyle}>Unidade de Lotação</label>
              <div className="relative">
                 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <select 
                   className={`${inputStyle} pl-10`}
                   value={formData.branchId}
                   onChange={e => setFormData({...formData, branchId: e.target.value})}
                 >
                    {BRANCHES.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                 </select>
              </div>
           </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-white border border-gray-200 rounded-xl transition-colors">Cancelar</button>
           <button 
             onClick={handleSubmit}
             disabled={!formData.name || !formData.role || !formData.cpf || isProcessing}
             className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
           >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cadastrar'}
           </button>
        </div>

      </div>
    </div>
  );
};
