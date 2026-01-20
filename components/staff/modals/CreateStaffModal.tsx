
import React, { useState } from 'react';
import { X, UserPlus, Building2, Briefcase, CreditCard, User, Loader2, Shield, Mail, AlertCircle, Lock } from 'lucide-react';
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
  
  // States para Controle de Acesso
  const [enableSystemAccess, setEnableSystemAccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('basico');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validações Básicas
    if (!formData.name || !formData.role || !formData.cpf) {
        setError("Preencha os campos obrigatórios (*).");
        return;
    }

    // Validação de Acesso
    if (enableSystemAccess && !loginEmail) {
        setError("Para liberar acesso, o e-mail de login é obrigatório.");
        return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onSave({
        name: formData.name,
        role: formData.role,
        branchId: formData.branchId,
        active: true,
        // Configuração de Acesso (Mapeando para a estrutura systemAccess)
        systemAccess: {
            allowed: enableSystemAccess,
            loginEmail: enableSystemAccess ? loginEmail : '',
            accessLevel: enableSystemAccess ? accessLevel as any : 'basico'
        },
        // Inicializa objetos obrigatórios para não quebrar a visualização
        personalInfo: {
            cpf: formData.cpf,
            rg: '',
            birthDate: '',
            phone: '',
            email: enableSystemAccess ? loginEmail : '', // Se tiver login, sugerimos como email pessoal também
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
      setEnableSystemAccess(false);
      setLoginEmail('');
      setAccessLevel('basico');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                 <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Novo Colaborador</h3>
           </div>
           <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
           
           {error && (
               <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 font-medium">
                   <AlertCircle className="w-4 h-4"/> {error}
               </div>
           )}

           {/* Dados Básicos */}
           <div>
              <label className={labelStyle}>Nome Completo <span className="text-red-500">*</span></label>
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
                 <label className={labelStyle}>Cargo / Função <span className="text-red-500">*</span></label>
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
                 <label className={labelStyle}>CPF <span className="text-red-500">*</span></label>
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

           {/* SEÇÃO: Acesso ao Sistema */}
           <div className={`mt-6 p-4 rounded-xl border transition-all ${enableSystemAccess ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${enableSystemAccess ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${enableSystemAccess ? 'text-indigo-900' : 'text-gray-500'}`}>Acesso ao AppCare</p>
                            <p className="text-[10px] text-gray-400">Liberar login para este colaborador?</p>
                        </div>
                    </div>
                    
                    {/* Custom Toggle */}
                    <div 
                        onClick={() => setEnableSystemAccess(!enableSystemAccess)}
                        className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors shadow-inner ${enableSystemAccess ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableSystemAccess ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {enableSystemAccess && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="border-t border-indigo-100 pt-4">
                            <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1.5">E-mail de Login <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                <input 
                                    type="email"
                                    className="w-full pl-10 pr-4 py-2.5 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-900 font-medium bg-white"
                                    placeholder="nome.sobrenome@appcare.com"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                />
                            </div>
                            <div className="mt-2 flex items-start gap-2 text-indigo-600 text-[11px] bg-indigo-100/50 p-2.5 rounded-lg leading-tight">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <p>O colaborador deverá usar a opção <strong>"Primeiro Acesso"</strong> na tela de login para definir sua senha.</p>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1.5">Nível de Permissão</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                <select 
                                    className="w-full pl-10 pr-4 py-2.5 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-900 font-medium bg-white appearance-none cursor-pointer"
                                    value={accessLevel}
                                    onChange={e => setAccessLevel(e.target.value)}
                                >
                                    <option value="basico">Básico (Visualização)</option>
                                    <option value="enfermagem">Enfermagem (Prontuário)</option>
                                    <option value="financeiro">Financeiro</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
           </div>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-white border border-gray-200 rounded-xl transition-colors">Cancelar</button>
           <button 
             onClick={handleSubmit}
             disabled={isProcessing}
             className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
           >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cadastrar Colaborador'}
           </button>
        </div>

      </div>
    </div>
  );
};
