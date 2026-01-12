
import React from 'react';
import { ViewState } from '../types';
import { 
  Plus, 
  ArrowRight,
  ClipboardCheck,
  UserPlus,
  History,
  HardHat,
  Users,
  Box,
  LayoutGrid
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  stats?: {
    collaborators: number;
    epis: number;
    deliveries: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, stats = { collaborators: 0, epis: 0, deliveries: 0 } }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 md:py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header Compacto */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            COMMAND <span className="text-blue-500">CENTER</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
              GESTÃO DE EPI
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Sistema Ativo</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-2xl min-w-[100px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Equipe</p>
            <p className="text-xl font-black text-white">{stats.collaborators}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-2xl min-w-[100px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Catálogo</p>
            <p className="text-xl font-black text-white">{stats.epis}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-2xl min-w-[100px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Entregas</p>
            <p className="text-xl font-black text-blue-500">{stats.deliveries}</p>
          </div>
        </div>
      </div>

      {/* Grid Funcional de Alta Densidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Ação Primária: Registrar Entrega */}
        <button 
          onClick={() => onNavigate('new-delivery')}
          className="col-span-1 sm:col-span-2 relative group overflow-hidden bg-blue-600 rounded-[2rem] p-8 text-left transition-all hover:bg-blue-500 hover:shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-[0.98]"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
              <ClipboardCheck size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Entrega</h2>
            <p className="text-blue-100 text-xs font-medium mt-1">Saída de material com biometria facial</p>
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-white font-black text-[10px] uppercase tracking-widest group-hover:bg-white/20 transition-colors">
              Iniciar Processo <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <ClipboardCheck size={140} className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700" />
        </button>

        {/* Módulo: Histórico */}
        <button 
          onClick={() => onNavigate('deliveries')}
          className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-left transition-all hover:border-slate-600 hover:bg-slate-800/50 group active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:text-blue-400 transition-colors">
            <History size={20} />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">Histórico</h2>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Relatórios e Fichas</p>
          <div className="mt-8 text-slate-600 group-hover:text-white transition-colors">
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Módulo: Cadastro EPI */}
        <button 
          onClick={() => onNavigate('epis')}
          className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-left transition-all hover:border-slate-600 hover:bg-slate-800/50 group active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:text-orange-400 transition-colors">
            <HardHat size={20} />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">Produtos</h2>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Gestão de Itens</p>
          <div className="mt-8 text-slate-600 group-hover:text-white transition-colors">
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Módulo: Equipe */}
        <button 
          onClick={() => onNavigate('collaborators')}
          className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-left transition-all hover:border-slate-600 hover:bg-slate-800/50 group active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:text-emerald-400 transition-colors">
            <Users size={20} />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">Equipe</h2>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">RH e Biometria</p>
          <div className="mt-8 text-slate-600 group-hover:text-white transition-colors">
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Módulo: Novo EPI */}
        <button 
          onClick={() => onNavigate('new-epi')}
          className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-4 transition-all hover:bg-slate-800 active:scale-[0.95] group"
        >
          <div className="shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-orange-500">
            <Box size={18} />
          </div>
          <div className="text-left">
            <p className="font-black text-white uppercase text-[10px] tracking-widest">Novo EPI</p>
            <p className="text-[8px] text-slate-600 font-bold uppercase">Entrada no estoque</p>
          </div>
        </button>

        {/* Módulo: Novo Colaborador */}
        <button 
          onClick={() => onNavigate('new-collaborator')}
          className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-4 transition-all hover:bg-slate-800 active:scale-[0.95] group"
        >
          <div className="shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-emerald-500">
            <UserPlus size={18} />
          </div>
          <div className="text-left">
            <p className="font-black text-white uppercase text-[10px] tracking-widest">Novo Membro</p>
            <p className="text-[8px] text-slate-600 font-bold uppercase">Registro Facial</p>
          </div>
        </button>

        <div className="sm:col-span-2 bg-slate-950/50 border border-slate-900 rounded-[2rem] p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-600">
                <LayoutGrid size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Status Operacional</p>
                <p className="text-xs font-bold text-slate-300 mt-1">Terminal ALPHA-01 Ativo</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">v1.0.8</p>
           </div>
        </div>
      </div>
    </div>
  );
};
