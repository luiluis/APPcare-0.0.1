
import React, { useState } from 'react';
import { Activity, Mail, Lock, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [view, setView] = useState<'login' | 'recovery'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    
    setRecoveryStatus('sending');
    
    // Simulação de envio
    setTimeout(() => {
        setRecoveryStatus('success');
    }, 1500);
  };

  const resetRecovery = () => {
      setView('login');
      setRecoveryStatus('idle');
      setRecoveryEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
         
         <div className="bg-blue-600 p-8 text-white text-center transition-all duration-300">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner">
               <Activity className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">AppCare ERP</h1>
            <p className="text-blue-100 mt-2 text-sm font-medium">Gestão Profissional para ILPIs</p>
         </div>
         
         <div className="p-8">
            {view === 'login' ? (
                <form className="space-y-6 animate-in slide-in-from-left duration-300" onSubmit={handleLoginSubmit}>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Corporativo</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input 
                                type="email" 
                                required
                                placeholder="ana.souza@appcare.com"
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input 
                                type="password" 
                                required
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Entrar no Sistema</>
                        )}
                    </button>

                    <button 
                        type="button"
                        onClick={() => setView('recovery')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors"
                    >
                        Primeiro Acesso ou Esqueci a Senha
                    </button>
                </form>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-900">Recuperação de Acesso</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Informe seu e-mail para receber o link de definição de senha.
                        </p>
                    </div>

                    {recoveryStatus === 'success' ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center animate-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-emerald-800 mb-1">E-mail Enviado!</h3>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Se o e-mail <strong>{recoveryEmail}</strong> estiver cadastrado, você receberá as instruções em instantes.
                            </p>
                            <button 
                                onClick={resetRecovery}
                                className="mt-4 text-xs font-bold text-emerald-700 hover:underline"
                            >
                                Voltar para Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRecoverySubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Cadastrado</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="seu.nome@appcare.com"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900 font-medium placeholder-gray-400"
                                        value={recoveryEmail}
                                        onChange={e => setRecoveryEmail(e.target.value)}
                                        disabled={recoveryStatus === 'sending'}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={recoveryStatus === 'sending' || !recoveryEmail}
                                className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {recoveryStatus === 'sending' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><Send className="w-4 h-4" /> Enviar Link</>
                                )}
                            </button>

                            <button 
                                type="button"
                                onClick={resetRecovery}
                                disabled={recoveryStatus === 'sending'}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-800 font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Voltar para Login
                            </button>
                        </form>
                    )}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
