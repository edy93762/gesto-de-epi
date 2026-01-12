
import React from 'react';
import { ViewState, Delivery, Collaborator, EPI } from '../types';
import { 
  Plus, 
  ArrowRight,
  ClipboardCheck,
  History,
  HardHat,
  Users,
  Activity,
  ShieldCheck
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
      
      {/* Header Compacto */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">Operação <span className="text-blue-500">Logística</span></h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Controle NR-06 Ativo</p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entregas Totais</p>
            <p className="text-xl font-black text-blue-500">{stats.deliveries}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Menu Principal - Sem Repetições */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Destaque: Entrega */}
          <button 
            onClick={() => onNavigate('new-delivery')}
            className="md:col-span-2 relative group overflow-hidden bg-blue-600 rounded-[2.5rem] p-8 text-left transition-all hover:bg-blue-500 active:scale-[0.98] shadow-2xl shadow-blue-900/30"
          >
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[160px]">
              <div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                  <ClipboardCheck size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Registrar Nova Entrega</h2>
                <p className="text-blue-100 text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">Reconhecimento Facial Gemini v2</p>
              </div>
              <div className="flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-[0.2em] mt-8 bg-black/10 w-fit px-4 py-2 rounded-full border border-white/10">
                Iniciar Protocolo <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <ClipboardCheck size={180} className="absolute -right-8 -bottom-8 text-white/10 rotate-12" />
          </button>

          {/* Atalhos de Gestão */}
          <button onClick={() => onNavigate('collaborators')} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-left hover:bg-slate-800 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-800">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase">Equipe</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">{stats.collaborators} Cadastrados</p>
              </div>
            </div>
            <Plus size={16} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
          </button>

          <button onClick={() => onNavigate('epis')} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-left hover:bg-slate-800 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-orange-500 border border-slate-800">
                <HardHat size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase">Inventário</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">{stats.epis} EPIs Ativos</p>
              </div>
            </div>
            <Plus size={16} className="text-slate-700 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>

        {/* Sidebar Activity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 h-full min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <Activity size={18} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Últimas Movimentações</h3>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {recentDeliveries.slice(0, 6).map((d, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50 flex gap-4 hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    {d.photo ? <img src={d.photo} className="w-full h-full object-cover grayscale" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><Plus size={12}/></div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-white uppercase truncate leading-none mb-1">{getColName(d.collaboratorId)}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{getEpiName(d.epiId)}</p>
                    <p className="text-[8px] text-blue-500/50 font-mono mt-2 tracking-widest">{formatDateTime(d.date)}</p>
                  </div>
                </div>
              ))}
              {recentDeliveries.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                   <Plus size={32} />
                   <p className="text-[10px] font-black uppercase mt-4">Nenhuma atividade registrada</p>
                </div>
              )}
            </div>

            <button onClick={() => onNavigate('deliveries')} className="mt-6 w-full py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              Ver Histórico Completo <History size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
