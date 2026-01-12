
import React from 'react';
import { ViewState, Delivery, Collaborator, EPI } from '../types';
import { 
  Plus, 
  ArrowRight,
  ClipboardCheck,
  UserPlus,
  History,
  HardHat,
  Users,
  Box,
  LayoutGrid,
  Activity,
  Cloud
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
    <div className="max-w-6xl mx-auto space-y-4 py-2 animate-in fade-in duration-500">
      
      {/* Header e Stats em Linha Única */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-[2rem] border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
            COMMAND <span className="text-blue-500">CENTER</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Cloud size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Database Sync: Ativo</span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          {[
            { label: 'Equipe', val: stats.collaborators, color: 'text-white' },
            { label: 'Itens', val: stats.epis, color: 'text-white' },
            { label: 'Entregas', val: stats.deliveries, color: 'text-blue-500' }
          ].map((s, i) => (
            <div key={i} className="flex-1 lg:flex-none bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 min-w-[100px]">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Lado Esquerdo: Ações Rápidas (8 colunas) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('new-delivery')}
              className="relative group overflow-hidden bg-blue-600 rounded-[2rem] p-6 text-left transition-all hover:bg-blue-500 active:scale-[0.98] shadow-xl shadow-blue-900/20"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
                  <ClipboardCheck size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Registrar Saída</h2>
                <p className="text-blue-100 text-[10px] font-medium opacity-80">Processo Biométrico Facial</p>
                <div className="mt-4 inline-flex items-center gap-2 text-white font-black text-[9px] uppercase tracking-widest">
                  Acessar Agora <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <ClipboardCheck size={100} className="absolute -right-4 -bottom-4 text-white/10" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onNavigate('collaborators')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:bg-slate-800 transition-all group">
                <Users size={18} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight">Gestão de Pessoal</p>
              </button>
              <button onClick={() => onNavigate('epis')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:bg-slate-800 transition-all group">
                <HardHat size={18} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight">Controle de EPIs</p>
              </button>
              <button onClick={() => onNavigate('deliveries')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:bg-slate-800 transition-all group">
                <History size={18} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight">Histórico Geral</p>
              </button>
              <button onClick={() => onNavigate('new-epi')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:bg-slate-800 transition-all group">
                <Plus size={18} className="text-slate-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight">Cadastrar Novo</p>
              </button>
            </div>
          </div>

          {/* Atalhos Rápidos de Cadastro */}
          <div className="flex gap-4">
             <button onClick={() => onNavigate('new-collaborator')} className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-3 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
                <UserPlus size={14} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Novo Colaborador</span>
             </button>
             <button onClick={() => onNavigate('new-epi')} className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-3 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
                <Box size={14} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Adicionar Material</span>
             </button>
          </div>
        </div>

        {/* Lado Direito: Live Log (4 colunas) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[2rem] border border-slate-800 p-5 flex flex-col h-full min-h-[300px]">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Activity size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live Activity Log</h3>
           </div>
           
           <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {recentDeliveries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                   <LayoutGrid size={32} />
                   <p className="text-[8px] font-black uppercase mt-2">Sem atividade recente</p>
                </div>
              ) : (
                recentDeliveries.slice(0, 5).map((d, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/50 flex gap-3 animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0">
                        <ClipboardCheck size={14} />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[9px] font-black text-white uppercase truncate">{getColName(d.collaboratorId)}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase truncate">{getEpiName(d.epiId)}</p>
                        <p className="text-[7px] text-blue-500/50 font-mono mt-1">{formatDateTime(d.date)}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-950/50 border border-slate-900 rounded-2xl">
         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Alpha Terminal • v1.0.9</p>
         <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronizado com Nuvem</p>
         </div>
      </div>
    </div>
  );
};
