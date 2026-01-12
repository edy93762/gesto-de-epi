
import React from 'react';
import { EPI } from '../types';
import { HardHat, Calendar, Tag, Shield, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface InventoryProps {
  epis: EPI[];
  onAddClick: () => void;
  onDelete: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ epis, onAddClick, onDelete }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catálogo de EPIs</h2>
          <p className="text-sm text-slate-500">Controle técnico e normativo.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-xl hover:bg-orange-700 transition-all shadow-md font-bold text-sm active:scale-95"
        >
          <Plus size={18} />
          Cadastrar EPI
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID / CA</th>
                <th className="px-6 py-4">Descrição / Categoria</th>
                <th className="px-6 py-4">Validade CA</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {epis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Nenhum EPI cadastrado.
                  </td>
                </tr>
              ) : (
                epis.map((epi) => (
                  <tr key={epi.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="font-bold text-slate-900 flex items-center gap-1">
                           <Tag size={12} className="text-slate-400" /> {epi.id}
                         </span>
                         <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded flex items-center gap-1 w-fit mt-1">
                           <Shield size={10} /> CA: {epi.ca}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="font-medium text-slate-700">{epi.description}</span>
                         <span className="text-[10px] text-slate-400 uppercase font-bold">{epi.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <Calendar size={14} />
                        {formatDate(epi.validityCA)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {epi.active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider">
                          ATIVO
                        </span>
                      ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                          INATIVO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(epi.id); }}
                        className="p-2 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50 active:scale-90"
                        title="Excluir EPI"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {epis.length === 0 ? (
           <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">Nenhum EPI cadastrado.</div>
        ) : (
          epis.map((epi) => (
            <div key={epi.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 active:bg-slate-50 relative group">
              <div className="flex justify-between items-start">
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                       <Tag size={12} className="text-blue-500" /> {epi.id}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1">{epi.description}</h3>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${epi.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {epi.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(epi.id); }}
                      className="p-1.5 text-red-500/50 hover:text-red-600 active:scale-90 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-[11px]">
                 <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2">
                    <Shield size={14} className="text-slate-400" />
                    <span className="text-slate-500">CA: <strong className="text-slate-800">{epi.ca}</strong></span>
                 </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 font-bold uppercase">{epi.category}</span>
                 <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={12} /> {formatDate(epi.validityCA)}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
