
import React from 'react';
import { ViewState, Delivery, Collaborator, EPI } from '../types';
import { 
  ArrowRight,
  ClipboardCheck,
  History,
  HardHat,
  Users,
  // Added User icon import to fix reference error on line 129
  User,
  Activity,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  stats?: {
    collaborators: number;
    epis: number;
    deliveries: number;
  };
  recentDeliveries?: Delivery[];
  allCollaborators?: Collaborator[];
  allEpis?: EPI[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  stats = { collaborators: 0, epis: 0, deliveries: 0 },
  recentDeliveries = [],
  allCollaborators = [],
  allEpis = []
}) => {
  const getColName = (id: string) => allCollaborators.find(c => c.id === id)?.name || '---';
  const getEpiName = (id: string) => allEpis.find(e => e.id === id)?.description || '---';

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-in fade-in duration-500">
      
      {/* Header Compacto com Stats unificadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
             <ShieldCheck className="text-white" size={28} />
           </div>
           <div>
             <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">COMMAND <span className="text-blue-500">CENTER</span></h1>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo Biométrico NR-06 v2.4</p>
           </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-around">
           <div className="text-center">
             <p className="text-[8px] font-black text-slate-500 uppercase">Equipe</p>
             <p className="text-xl font-black text-white">{stats.collaborators}</p>
           </div>
           <div className="w-px h-8 bg-slate-800"></div>
           <div className="text-center">
             <p className="text-[8px] font-black text-slate-500 uppercase">Estoque</p>
             <p className="text-xl font-black text-white">{stats.epis}</p>
           </div>
           <div className="w-px h-8 bg-slate-800"></div>
           <div className="text-center">
             <p className="text-[8px] font-black text-slate-500 uppercase">Registros</p>
             <p className="text-xl font-black text-blue-500">{stats.deliveries}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Painel de Controle Principal */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AÇÃO PRINCIPAL: Entrega Biométrica */}
          <button 
            onClick={() => onNavigate('new-delivery')}
            className="w-full relative group overflow-hidden bg-blue-600 rounded-[3rem] p-10 text-left transition-all hover:bg-blue-500 active:scale-[0.98] shadow-2xl shadow-blue-900/40"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-8 border border-white/20">
                <ClipboardCheck size={32} className="text-white" />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Checkout Facial</h2>
              <p className="text-blue-100 text-sm font-bold mt-3 opacity-90 uppercase tracking-widest">Iniciar Reconhecimento Automático</p>
              
              <div className="mt-10 inline-flex items-center gap-4 text-white font-black text-[11px] uppercase tracking-[0.3em] bg-black/20 px-6 py-3 rounded-full border border-white/10 hover:bg-black/30 transition-all">
                Acessar Terminal <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
            <ClipboardCheck size={220} className="absolute -right-12 -bottom-12 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </button>

          {/* Gestão Rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => onNavigate('new-collaborator')} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 hover:bg-slate-800 transition-all flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-800">
                  <UserPlus size={24} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase">Cadastrar Membro</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Inclusão Biométrica</p>
                </div>
             </button>
             <button onClick={() => onNavigate('new-epi')} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 hover:bg-slate-800 transition-all flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-orange-500 border border-slate-800">
                  <HardHat size={24} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase">Adicionar EPI</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Atualizar Catálogo</p>
                </div>
             </button>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <Activity size={18} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Fluxo de Operação</h3>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {recentDeliveries.slice(0, 8).map((d, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50 flex gap-4 animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    {/* Fixed error: Using User icon component after adding it to the imports */}
                    {d.photo ? <img src={d.photo} className="w-full h-full object-cover" /> : <User size={14} className="m-auto mt-2 text-slate-700" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-white uppercase truncate mb-0.5">{getColName(d.collaboratorId)}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{getEpiName(d.epiId)}</p>
                    <p className="text-[7px] text-blue-500 font-mono mt-1 opacity-50">{formatDateTime(d.date)}</p>
                  </div>
                </div>
              ))}
              {recentDeliveries.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <Activity size={40} />
                   <p className="text-[9px] font-black uppercase mt-4">Nenhum dado recente</p>
                </div>
              )}
            </div>

            <button onClick={() => onNavigate('deliveries')} className="mt-6 w-full py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
              Auditar Histórico <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
