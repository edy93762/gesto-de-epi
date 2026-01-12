
import React from 'react';
import { Collaborator } from '../types';
import { User, CheckCircle, XCircle, UserPlus } from 'lucide-react';

interface CollaboratorsListProps {
  collaborators: Collaborator[];
  onAddClick: () => void;
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ collaborators, onAddClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Colaboradores</h2>
          <p className="text-sm text-slate-500">Gerencie quem pode receber equipamentos.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <UserPlus size={18} />
          Novo Colaborador
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Matrícula</th>
              <th className="px-6 py-4">Setor</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {collaborators.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Nenhum colaborador cadastrado.
                </td>
              </tr>
            ) : (
              collaborators.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium flex items-center gap-3 text-slate-900">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 border border-slate-200">
                          {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {c.id}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">{c.matricula || '-'}</td>
                  <td className="px-6 py-4">{c.sector}</td>
                  <td className="px-6 py-4">{c.role}</td>
                  <td className="px-6 py-4">
                    {c.active ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle size={14} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <XCircle size={14} /> Inativo
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
