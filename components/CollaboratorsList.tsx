
import React from 'react';
import { Collaborator } from '../types';
import { CheckCircle, XCircle, UserPlus, ShieldCheck, MapPin, Trash2, Building2, User } from 'lucide-react';

interface CollaboratorsListProps {
  collaborators: Collaborator[];
  onAddClick: () => void;
  onDelete: (id: string) => void;
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ collaborators, onAddClick, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center md:text-left">Gestão de Pessoal</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 text-center md:text-left">Equipe Ativa e Cadastro Facial</p>
        </div>
        <button 
          onClick={onAddClick}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl font-black text-xs uppercase tracking-widest active:scale-95"
        >
          <UserPlus size={20} />
          Novo Colaborador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborators.length === 0 ? (
          <div className="col-span-full bg-slate-900/50 p-20 rounded-[2rem] border-2 border-dashed border-slate-800 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
             Nenhum registro encontrado.
          </div>
        ) : (
          collaborators.map((c) => (
            <div key={c.id} className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 hover:border-slate-700 transition-all group relative">
              <div className="flex items-center gap-5 mb-6">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center">
                    {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-800" />}
                  </div>
                  {c.photo && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 border-4 border-slate-900 shadow-xl" title="Biometria Ativa">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">#{c.id}</span>
                   <h3 className="text-lg font-black text-white uppercase tracking-tight truncate leading-tight">{c.name}</h3>
                   <p className="text-[10px] text-blue-500 font-bold uppercase truncate">{c.role}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold">
                   <span className="text-slate-500 uppercase tracking-widest">Empresa</span>
                   <span className="text-white flex items-center gap-1"><Building2 size={10} className="text-blue-500" /> {c.branch}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                   <span className="text-slate-500 uppercase tracking-widest">Matrícula</span>
                   <span className="text-white">{c.matricula || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                   <span className="text-slate-500 uppercase tracking-widest">Setor</span>
                   <span className="text-white">{c.sector}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                 {c.active ? (
                    <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                       <CheckCircle size={14} /> Ativo
                    </span>
                 ) : (
                    <span className="flex items-center gap-1.5 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                       <XCircle size={14} /> Inativo
                    </span>
                 )}
                 <button 
                  onClick={() => onDelete(c.id)}
                  className="p-2 text-slate-700 hover:text-red-500 transition-colors bg-slate-950 rounded-xl border border-slate-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
