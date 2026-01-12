
import React, { useState } from 'react';
import { Delivery, EPI, Collaborator } from '../types';
import { formatDateTime, calculateStatus } from '../utils/helpers';
import { Search, Camera, X, ShieldCheck, ShieldAlert } from 'lucide-react';

interface DeliveriesProps {
  deliveries: Delivery[];
  epis: EPI[];
  collaborators: Collaborator[];
}

export const Deliveries: React.FC<DeliveriesProps> = ({ deliveries, epis, collaborators }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const getCollaboratorName = (id: string) => collaborators.find(c => c.id === id)?.name || 'Desconhecido';
  const getEPIName = (id: string) => epis.find(e => e.id === id)?.description || 'Desconhecido';

  const filteredDeliveries = deliveries.filter(d => 
    getCollaboratorName(d.collaboratorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEPIName(d.epiId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (predictedDate: string | undefined) => {
    if (!predictedDate) return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">N/A</span>;
    const status = calculateStatus(predictedDate);
    if (status === 'VENCIDO') return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">VENCIDO</span>;
    if (status === 'A VENCER') return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">A VENCER</span>;
    return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">EM DIA</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Histórico de Entregas</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar entrega..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Foto/Face</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">EPI</th>
              <th className="px-6 py-4">Qtd</th>
              <th className="px-6 py-4">Verificação</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeliveries.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  {delivery.photo ? (
                    <button 
                      onClick={() => setSelectedPhoto(delivery.photo!)}
                      className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all shadow-sm"
                    >
                      <img src={delivery.photo} alt="Entrega" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-200">
                      <Camera size={16} />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium">{formatDateTime(delivery.date)}</td>
                <td className="px-6 py-4">{getCollaboratorName(delivery.collaboratorId)}</td>
                <td className="px-6 py-4 font-bold text-slate-700">{delivery.epiId}</td>
                <td className="px-6 py-4">{delivery.quantity}</td>
                <td className="px-6 py-4">
                  {delivery.verificationResult ? (
                    <div className={`flex items-center gap-1 font-bold text-[10px] ${delivery.verificationResult.match ? 'text-green-600' : 'text-red-600'}`}>
                      {delivery.verificationResult.match ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {delivery.verificationResult.match ? 'CONFIRMADA' : 'ALERTA'}
                    </div>
                  ) : <span className="text-slate-300">-</span>}
                </td>
                <td className="px-6 py-4">{getStatusBadge(delivery.predictedReplacementDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>
            <img src={selectedPhoto} alt="Comprovante" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
