
import React, { useMemo } from 'react';
import { Delivery, EPI, Collaborator, ViewState } from '../types';
import { calculateStatus } from '../utils/helpers';
import { 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Users, 
  Plus, 
  ArrowRight,
  ClipboardCheck,
  UserPlus
} from 'lucide-react';

interface DashboardProps {
  deliveries: Delivery[];
  epis: EPI[];
  collaborators: Collaborator[];
  onNavigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ deliveries, epis, collaborators, onNavigate }) => {
  const stats = useMemo(() => {
    let vencido = 0;
    let aVencer = 0;
    
    deliveries.forEach(d => {
      if (d.predictedReplacementDate) {
        const status = calculateStatus(d.predictedReplacementDate);
        if (status === 'VENCIDO') vencido++;
        else if (status === 'A VENCER') aVencer++;
      }
    });

    const totalDels = deliveries.length;
    const complianceRate = totalDels > 0 ? Math.round(((totalDels - vencido) / totalDels) * 100) : 100;

    return { 
      vencido, 
      aVencer, 
      complianceRate, 
      totalEpis: epis.length, 
      totalPeople: collaborators.filter(c => c.active).length 
    };
  }, [deliveries, epis, collaborators]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6">
      {/* Header Objetivo */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">GESTAO DE EPI</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            SISTEMA OPERACIONAL • {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status de Conformidade</p>
          <div className="flex items-center gap-3">
             <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${stats.complianceRate >= 90 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                  style={{ width: `${stats.complianceRate}%` }}
                />
             </div>
             <p className={`text-2xl font-black ${stats.complianceRate >= 90 ? 'text-emerald-500' : 'text-orange-500'}`}>{stats.complianceRate}%</p>
          </div>
        </div>
      </div>

      {/* KPI Grid - Limpo e Direto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguro</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalPeople}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Equipe Ativa</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-xl">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Alerta</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.vencido}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Itens Vencidos</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Clock size={20} className="text-amber-600" />
            </div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Trocas</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.aVencer}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Próximos 15 dias</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users size={20} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalEpis}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">EPIs Cadastrados</p>
        </div>
      </div>

      {/* Ações Primárias */}
      <div className="space-y-6 pt-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] px-2">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button 
            onClick={() => onNavigate('new-delivery')}
            className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-blue-600 transition-all shadow-xl group active:scale-95"
          >
            <div className="flex items-center gap-5">
              <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20">
                <ClipboardCheck size={28} />
              </div>
              <div className="text-left">
                <p className="font-black text-lg uppercase tracking-tight">Nova Entrega</p>
                <p className="text-[10px] text-slate-400 group-hover:text-blue-100 font-bold uppercase tracking-widest">Saída de Material</p>
              </div>
            </div>
            <Plus size={24} className="text-slate-500 group-hover:text-white" />
          </button>

          <button 
            onClick={() => onNavigate('collaborators')}
            className="flex items-center justify-between p-6 bg-white text-slate-900 border border-slate-200 rounded-[2rem] hover:border-slate-900 transition-all shadow-sm group active:scale-95"
          >
            <div className="flex items-center gap-5">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100">
                <UserPlus size={28} className="text-slate-900" />
              </div>
              <div className="text-left">
                <p className="font-black text-lg uppercase tracking-tight">Equipe</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gerenciar Cadastro</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-900" />
          </button>
        </div>
      </div>
      
      {/* Rodapé Informativo */}
      <div className="pt-10 flex flex-col items-center gap-4 opacity-50">
        <div className="h-px w-20 bg-slate-300"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ambiente de Gestão Segura</p>
      </div>
    </div>
  );
};
