import React from 'react';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { EpiCatalogItem } from '../types';

interface StockMonitorProps {
  catalog: EpiCatalogItem[];
}

const StockMonitor: React.FC<StockMonitorProps> = ({ catalog }) => {
  // Sort by stock level (lowest first)
  const sortedItems = [...catalog].sort((a, b) => a.stock - b.stock);

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
    <div className="bg-dark-900 rounded-xl shadow-lg border border-dark-800 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-500" />
          Monitor de Estoque
        </h3>
        <span className="text-xs text-zinc-500 bg-dark-800 px-2 py-1 rounded-full border border-dark-700">
          {catalog.length} Itens
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nenhum item monitorado.</p>
          </div>
        ) : (
          sortedItems.map((item) => {
            // Calculate a percentage for the bar (cap at 100 for visual consistency, assume 50 is "full" for visual scale)
            const percentage = Math.min(100, (item.stock / 50) * 100);
            
            return (
              <div key={item.id} className="group p-3 rounded-lg bg-dark-950/50 border border-dark-800 hover:border-dark-700 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500 bg-dark-800 px-1.5 rounded">{item.code}</span>
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
      
      <div className="p-3 bg-dark-950/30 border-t border-dark-800 text-center">
        <p className="text-xs text-zinc-500 flex justify-center gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Crítico (0)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Baixo (&lt;10)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal</span>
        </p>
      </div>
    </div>
  );
};

export default StockMonitor;