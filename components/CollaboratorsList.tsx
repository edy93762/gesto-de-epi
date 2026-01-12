
import React from 'react';
import { Collaborator } from '../types';
import { User, CheckCircle, XCircle, UserPlus, Medal, ShieldCheck, MapPin, Trash2 } from 'lucide-react';

interface CollaboratorsListProps {
  collaborators: Collaborator[];
  onAddClick: () => void;
  onDelete: (id: string) => void;
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ collaborators, onAddClick, onDelete }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Equipe</h2>
          <p className="text-sm text-slate-500">Gestão de pessoal e cadastro facial.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md font-bold text-sm active:scale-95"
        >
          <UserPlus size={18} />
          Cadastrar Novo
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nome / Biometria</th>
                <th className="px-6 py-4">Agência</th>
                <th className="px-6 py-4">Matrícula</th>
                <th className="px-6 py-4">Cargo / Setor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collaborators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum colaborador cadastrado.
                  </td>
                </tr>
              ) : (
                collaborators.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3 text-slate-900">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                              {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={18} />}
                          </div>
                          {c.photo && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-900 rounded-full p-0.5 border border-white shadow-sm" title="Biometria Cadastrada">
                              <Medal size={10} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {c.id}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-100">
                         <MapPin size={10} /> {c.branch || 'N/A'}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{c.matricula || '-'}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-slate-800 font-medium">{c.role}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{c.sector}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 font-bold text-[10px] uppercase">
                          <CheckCircle size={12} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-500 font-bold text-[10px] uppercase">
                          <XCircle size={12} /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                        className="p-2 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50 active:scale-90"
                        title="Excluir Colaborador"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {collaborators.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
             Nenhum colaborador encontrado.
          </div>
        ) : (
          collaborators.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden active:bg-slate-50 group">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-slate-200">
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={24} className="text-slate-300" />}
                </div>
                {c.photo && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-900 rounded-full p-1 border border-white shadow-sm">
                    <ShieldCheck size={12} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{c.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold truncate tracking-widest">{c.role} | {c.sector}</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                     <MapPin size={8} /> {c.branch}
                   </span>
                   <span className="text-[11px] text-slate-600">Mat: <strong>{c.matricula || '-'}</strong></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                 {c.active ? (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Ativo</span>
                 ) : (
                    <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Inativo</span>
                 )}
                 <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="p-2 text-red-500/50 hover:text-red-600 active:scale-90 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
