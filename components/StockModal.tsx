import React, { useState } from 'react';
import { X, Package, BarChart3, Search } from 'lucide-react';
import { EpiCatalogItem } from '../types';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: EpiCatalogItem[];
}

const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, catalog }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Sort by stock level (lowest first)
  const sortedItems = [...catalog].sort((a, b) => a.stock - b.stock);

  // Filter items based on search query
  const filteredItems = sortedItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (stock < 10) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  const getProgressBarColor = (stock: number) => {
    if (stock === 0) return 'bg-red-600';
    if (stock < 10) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Monitor de Estoque
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-dark-800 bg-dark-950/30">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar item no estoque..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-zinc-600"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 bg-dark-950/50 rounded-xl border border-dashed border-dark-800">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{searchQuery ? 'Nenhum item encontrado.' : 'Nenhum item monitorado.'}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              // Calculate a percentage for the bar (cap at 100 for visual consistency, assume 50 is "full" for visual scale)
              const percentage = Math.min(100, (item.stock / 50) * 100);
              
              return (
                <div key={item.id} className="group p-3 rounded-lg bg-dark-950 border border-dark-800 hover:border-dark-700 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500 bg-dark-800 px-1.5 rounded border border-dark-700">{item.code}</span>
                        <span className="font-medium text-zinc-200 text-sm">{item.name}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(item.stock)}`}>
                      {item.stock} un
                    </div>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(item.stock)}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-dark-900 border-t border-dark-800 text-center shrink-0">
          <p className="text-xs text-zinc-500 flex justify-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Crítico (0)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Baixo (&lt;10)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockModal;