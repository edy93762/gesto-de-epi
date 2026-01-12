
import React from 'react';
import { EPI } from '../types';
import { HardHat, Plus, Trash2, Tag } from 'lucide-react';

interface EPIListProps {
  epis: EPI[];
  onAddClick: () => void;
  onDelete: (id: string) => void;
}

export const EPIList: React.FC<EPIListProps> = ({ epis, onAddClick, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Equipamentos (EPI)</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Gestão de Itens Cadastrados</p>
        </div>
        <button 
          onClick={onAddClick}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-orange-600 text-white px-8 py-4 rounded-2xl hover:bg-orange-500 transition-all shadow-xl font-black text-xs uppercase tracking-widest active:scale-95"
        >
          <Plus size={20} />
          Novo Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {epis.length === 0 ? (
           <div className="col-span-full bg-slate-900/50 p-20 rounded-[2rem] border-2 border-dashed border-slate-800 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
             Nenhum equipamento cadastrado.
           </div>
        ) : (
          epis.map((epi) => (
            <div key={epi.id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 hover:border-blue-500/50 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                   <HardHat size={24} />
                 </div>
                 <button 
                  onClick={() => onDelete(epi.id)}
                  className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-1 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  <Tag size={12} /> {epi.id}
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{epi.description}</h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[10px] font-black uppercase">
                 <span className={`px-2 py-0.5 rounded-full ${epi.active ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
                   {epi.active ? 'Ativo' : 'Inativo'}
                 </span>
                 <span className="text-slate-700">Cod: {epi.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
