
import React, { useState } from 'react';
import { Delivery, EPI, Collaborator } from '../types';
import { formatDateTime, calculateStatus } from '../utils/helpers';
import { Search, Camera, X, ShieldCheck, ShieldAlert, Medal, Info } from 'lucide-react';

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
    if (status === 'VENCIDO') return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">VENCIDO</span>;
    if (status === 'A VENCER') return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold">A VENCER</span>;
    return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">EM DIA</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatório de Entregas</h2>
          <p className="text-xs text-slate-500">Dados vinculados diretamente ao banco de dados.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar por colaborador ou EPI..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] text-slate-600">
          <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Biometria</th>
              <th className="px-6 py-3">Data/Hora</th>
              <th className="px-6 py-3">Colaborador</th>
              <th className="px-6 py-3">EPI / Motivo</th>
              <th className="px-6 py-3 text-center">Qtd</th>
              <th className="px-6 py-3">Próxima Troca</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                  Nenhuma entrega registrada no banco de dados.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {delivery.photo ? (
                      <button 
                        onClick={() => setSelectedPhoto(delivery.photo!)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all shadow-sm relative group bg-white"
                      >
                        <img src={delivery.photo} alt="Comprovante" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Search size={12} className="text-white" />
                        </div>
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
                      <span className="text-[10px] text-slate-400">ID: {delivery.collaboratorId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{delivery.epiId} - {getEPIDescription(delivery.epiId)}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded w-fit mt-1 uppercase font-black">{delivery.reason}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-800">{delivery.quantity}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{delivery.predictedReplacementDate ? formatDateTime(delivery.predictedReplacementDate).split(' ')[0] : '-'}</span>
                      <span className="text-[9px] text-slate-400">Resp: {delivery.responsibleEmail.split('@')[0]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(delivery.predictedReplacementDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                Comprovante Biométrico
              </h3>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <img src={selectedPhoto} alt="Comprovante" className="w-full h-auto max-h-[70vh] object-contain bg-slate-100" />
            <div className="p-4 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Identidade Verificada por Reconhecimento Facial Gemini</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
