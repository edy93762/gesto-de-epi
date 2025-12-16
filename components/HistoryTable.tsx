import React, { useState } from 'react';
import { Trash2, FileText, Search, Package, Clock, ScanFace, Calendar, RotateCcw } from 'lucide-react';
import { EpiRecord } from '../types';
import { generateEpiPdf } from '../utils/pdfGenerator';

interface HistoryTableProps {
  records: EpiRecord[];
  onDelete: (id: string) => void;
  compact?: boolean; 
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records, onDelete, compact = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtragem por busca
  const filteredRecords = records.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ORDENAÇÃO: Mais recente primeiro
  const sortedRecords = filteredRecords.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="bg-dark-900 rounded-xl shadow-lg border border-dark-800 overflow-hidden h-full flex flex-col">
      {/* Header da Tabela */}
      <div className="p-4 sm:p-5 border-b border-dark-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-lg text-white">Fichas de Entrega</h3>
            </div>
            <span className="text-xs text-zinc-500 bg-dark-800 px-2 py-1 rounded-full border border-dark-700">
                {sortedRecords.length}
            </span>
        </div>
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar ficha por nome..." 
            className="pl-9 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 w-full placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-dark-950/30">
        {sortedRecords.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-zinc-600 px-4 text-center">
             <FileText className="w-10 h-10 opacity-20 mb-2" />
             <span>Nenhuma ficha encontrada.</span>
           </div>
        ) : (
            <>
              {/* --- VERSÃO MOBILE / COMPACTA (CARDS) --- */}
              <div className={`${compact ? 'block' : 'block sm:hidden'} p-3 space-y-3`}>
                {sortedRecords.map((record) => (
                    <div key={record.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4 shadow-sm hover:border-dark-700 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                {record.facePhoto ? (
                                    <img src={record.facePhoto} alt="Face" className="w-10 h-10 rounded-full object-cover border border-dark-700" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center">
                                        <ScanFace className="w-5 h-5 text-zinc-600" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-zinc-200 text-sm line-clamp-1">{record.employeeName}</h4>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(record.date).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                            {/* Company Tag */}
                            {record.company && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-dark-800 text-zinc-400 border border-dark-700">
                                    {record.company}
                                </span>
                            )}
                        </div>

                        <div className="bg-dark-950/50 rounded-lg p-2.5 mb-3 border border-dark-800/50">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 block">Itens da Ficha</span>
                            <div className="space-y-2">
                                {record.items && record.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Package className="w-3 h-3 text-brand-500/70" />
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <button 
                                onClick={() => generateEpiPdf(record, true)}
                                className="flex-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                             >
                                <FileText className="w-4 h-4" /> Baixar Ficha
                             </button>
                             <button 
                                onClick={() => onDelete(record.id)}
                                className="flex-none w-10 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                                title="Apagar Ficha"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                ))}
              </div>

              {/* --- VERSÃO DESKTOP (TABLE) --- */}
              <table className={`${compact ? 'hidden' : 'hidden sm:table'} w-full text-left text-sm text-zinc-400`}>
                <thead className="bg-dark-950 text-zinc-500 font-semibold uppercase text-xs sticky top-0 border-b border-dark-800 z-10">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Colaborador</th>
                    <th className="px-6 py-4">Itens Entregues</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {sortedRecords.map((record) => (
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
                        <div className="flex items-center gap-3">
                          {record.facePhoto && (
                            <div className="relative group/face cursor-help shrink-0">
                               <ScanFace className="w-4 h-4 text-emerald-500" />
                               <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-lg border-2 border-emerald-500 overflow-hidden hidden group-hover/face:block z-50 shadow-xl bg-black">
                                  <img src={record.facePhoto} alt="Bio" className="w-full h-full object-cover" />
                               </div>
                            </div>
                          )}
                          <div>
                              <div className="text-zinc-200">{record.employeeName}</div>
                              {record.company && (
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">{record.company}</div>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 max-w-[250px]">
                          {record.items && record.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                 <div className="flex items-center gap-2 truncate">
                                    <Package className="w-3 h-3 text-brand-500 shrink-0" />
                                    <span className="font-medium truncate text-zinc-300" title={item.name}>
                                        {item.code ? `[${item.code}] ` : ''}{item.name}
                                    </span>
                                 </div>
                              </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => generateEpiPdf(record, true)}
                          className="inline-flex items-center justify-center w-9 h-9 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg transition-colors"
                          title="Baixar PDF da Ficha"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(record.id)}
                          className="inline-flex items-center justify-center w-9 h-9 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                          title="Excluir Ficha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;