
import React, { useState } from 'react';
import { Delivery, EPI, Collaborator } from '../types';
import { formatDateTime, calculateStatus } from '../utils/helpers';
import { Search, Camera, X, ShieldCheck, ShieldAlert, Medal, Calendar, User, HardHat } from 'lucide-react';

interface DeliveriesProps {
  deliveries: Delivery[];
  epis: EPI[];
  collaborators: Collaborator[];
}

export const Deliveries: React.FC<DeliveriesProps> = ({ deliveries, epis, collaborators }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const getCollaboratorName = (id: string) => collaborators.find(c => c.id === id)?.name || 'Desconhecido';
  const getEPIDescription = (id: string) => epis.find(e => e.id === id)?.description || id;

  const filteredDeliveries = deliveries.filter(d => 
    getCollaboratorName(d.collaboratorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEPIDescription(d.epiId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (predictedDate: string | undefined) => {
    if (!predictedDate) return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">N/A</span>;
    const status = calculateStatus(predictedDate);
    if (status === 'VENCIDO') return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-black">VENCIDO</span>;
    if (status === 'A VENCER') return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black">A VENCER</span>;
    return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-black uppercase">Em Dia</span>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatório de Entregas</h2>
          <p className="text-xs text-slate-500">Histórico detalhado de movimentação de EPIs.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Biometria</th>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">EPI / Motivo</th>
                <th className="px-6 py-4 text-center">Qtd</th>
                <th className="px-6 py-4">Próxima Troca</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {delivery.photo ? (
                      <button onClick={() => setSelectedPhoto(delivery.photo!)} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                        <img src={delivery.photo} className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-200">
                        <Camera size={14} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{formatDateTime(delivery.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{getCollaboratorName(delivery.collaboratorId)}</span>
                      <span className="text-[10px] text-slate-400 uppercase">Matrícula: {collaborators.find(c => c.id === delivery.collaboratorId)?.matricula || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{delivery.epiId} - {getEPIDescription(delivery.epiId)}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded w-fit mt-1 uppercase font-black">{delivery.reason}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-800">{delivery.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {delivery.predictedReplacementDate ? formatDateTime(delivery.predictedReplacementDate).split(' ')[0] : '-'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(delivery.predictedReplacementDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400 italic text-sm">
            Nenhum registro encontrado.
          </div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  {delivery.photo ? (
                    <button onClick={() => setSelectedPhoto(delivery.photo!)} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={delivery.photo} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-200">
                      <Camera size={16} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{getCollaboratorName(delivery.collaboratorId)}</h3>
                    <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> {formatDateTime(delivery.date)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(delivery.predictedReplacementDate)}
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                   <HardHat size={14} className="text-slate-400" />
                   <span className="text-xs font-bold text-slate-700">{delivery.epiId} - {getEPIDescription(delivery.epiId)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Quantidade: <strong className="text-slate-800">{delivery.quantity}</strong></span>
                  <span className="text-slate-500">Próxima Troca: <strong className="text-slate-800">{delivery.predictedReplacementDate ? formatDateTime(delivery.predictedReplacementDate).split(' ')[0] : '-'}</strong></span>
                </div>
                <div className="pt-2 border-t border-slate-200/50">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded uppercase">{delivery.reason}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                Assinatura Biométrica
              </h3>
              <button onClick={() => setSelectedPhoto(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            <img src={selectedPhoto} alt="Comprovante" className="w-full h-auto max-h-[60vh] object-contain" />
            <div className="p-6 text-center bg-slate-50">
               <div className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 px-4 py-2 rounded-full font-black text-xs uppercase shadow-lg animate-pulse">
                  <Medal size={16} fill="currentColor" /> Identidade Autenticada
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
