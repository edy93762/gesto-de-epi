import React, { useState } from 'react';
import { Trash2, FileText, Search, Package, Clock } from 'lucide-react';
import { EpiRecord } from '../types';
import { generateEpiPdf } from '../utils/pdfGenerator';

interface HistoryTableProps {
  records: EpiRecord[];
  onDelete: (id: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-dark-900 rounded-xl shadow-lg border border-dark-800 overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-lg text-white">Histórico de Fichas</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar histórico..." 
            className="pl-9 pr-4 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-64 placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-dark-950 text-zinc-500 font-semibold uppercase text-xs sticky top-0 border-b border-dark-800">
            <tr>
              <th className="px-6 py-4">Data / Hora</th>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">Turno</th>
              <th className="px-6 py-4">Itens</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-600">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 opacity-20" />
                    <span>Nenhum registro encontrado.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-dark-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-200">
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs text-zinc-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(record.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {record.employeeName}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{record.shift || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {record.items && record.items.length > 0 ? (
                        record.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                             <Package className="w-3 h-3 text-brand-500" />
                             <span className="font-medium text-zinc-300">
                               {item.code ? `[${item.code}] ` : ''}{item.name}
                             </span>
                          </div>
                        ))
                      ) : (
                         <span className="text-xs text-red-500">Erro de formato</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => generateEpiPdf(record)}
                      className="inline-flex items-center justify-center w-9 h-9 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg transition-colors"
                      title="Baixar PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(record.id)}
                      className="inline-flex items-center justify-center w-9 h-9 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default HistoryTable;