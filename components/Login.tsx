
import React, { useState } from 'react';
import { ShieldCheck, UserPlus, ArrowRight, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onPublicRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onPublicRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Novas credenciais solicitadas
    if (username === 'Almox' && password === 'Shopee@2026') {
      onLogin();
    } else {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-900/50 mb-6 rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão de EPI</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Controle de Entregas & Biometria</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative space-y-8">
          
          {/* Public Registration Button - EM DESTAQUE */}
          <div className="bg-slate-950/50 p-2 rounded-3xl border border-slate-800">
             <button 
                onClick={onPublicRegister}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="bg-emerald-800/30 p-2 rounded-xl relative z-10">
                  <UserPlus size={20} className="text-white" />
                </div>
                <span className="text-sm relative z-10">Cadastrar Colaborador</span>
              </button>
              <p className="text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-3 mb-1">
                 Primeiro acesso? Clique acima
              </p>
          </div>

          <div className="w-full h-px bg-slate-800"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Acesso Almoxarifado</p>
               <div className="relative">
                  <User className="absolute left-5 top-4 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Usuário"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 focus:bg-slate-900"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
               </div>
               <div className="relative">
                  <Lock className="absolute left-5 top-4 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    placeholder="Senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 focus:bg-slate-900"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
               </div>
            </div>

            {error && <p className="text-red-500 text-xs font-black uppercase text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

            <button 
              type="submit" 
              className="w-full bg-slate-800 text-slate-300 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
            >
              Acessar Painel <ArrowRight size={14} />
            </button>
          </form>

        </div>
        
        <p className="text-center text-[10px] text-slate-600 mt-8 font-mono">System v2.5.1 • Secure Access</p>
      </div>
    </div>
  );
};
