
import React, { useState } from 'react';
import { Activity, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
         <div className="bg-blue-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
               <Activity className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">AppCare ERP</h1>
            <p className="text-blue-100 mt-2">Gestão Profissional para ILPIs</p>
         </div>
         
         <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Corporativo</label>
               <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="email" 
                    required
                    placeholder="ana.souza@appcare.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
               </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Entrar no Sistema</>
              )}
            </button>
         </form>
      </div>
    </div>
  );
};
