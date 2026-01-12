import React from 'react';
import { EPI } from '../types';
import { HardHat, Calendar, Tag, MapPin } from 'lucide-react';
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
            <p className="text-sm text-slate-500">Listagem de equipamentos e locais de armazenamento.</p>
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
                <th className="px-6 py-4">ID do EPI (EPI_ID)</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Local</th>
                <th className="px-6 py-4">Data de Cadastro</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {epis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Nenhum EPI cadastrado. Clique em "Novo EPI" para começar.
                  </td>
                </tr>
              ) : (
                epis.map((epi) => {
                  return (
                    <tr key={epi.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <Tag size={14} className="text-slate-400" />
                        {epi.id}
                      </td>
                      <td className="px-6 py-4">{epi.description}</td>
                      <td className="px-6 py-4 flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {epi.location || 'Não informado'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar size={14} />
                          {formatDate(epi.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {epi.active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                            Ativo
                          </span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            Inativo
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