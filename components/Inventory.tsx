
import React from 'react';
import { EPI } from '../types';
import { HardHat, Calendar, Tag, MapPin, Shield, Clock } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface InventoryProps {
  epis: EPI[];
  onAddClick: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ epis, onAddClick }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Catálogo de EPIs</h2>
            <p className="text-sm text-slate-500">Controle de CA e Vida Útil para conformidade legal.</p>
          </div>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium"
          >
            <HardHat size={18} />
            Novo EPI
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID / CA</th>
                <th className="px-6 py-4">Descrição / Categoria</th>
                <th className="px-6 py-4">Validade CA</th>
                <th className="px-6 py-4">Vida Útil (Dias)</th>
                <th className="px-6 py-4">Status</th>
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
                epis.map((epi) => {
                  return (
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
                         <div className="flex items-center gap-1 text-slate-600 font-bold">
                           <Clock size={14} className="text-blue-500" />
                           {epi.shelfLifeDays} dias
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
