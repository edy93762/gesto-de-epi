
import React, { useState, useRef } from 'react';
import { Delivery, EPI, Collaborator } from '../types';
import { formatDateTime, formatDate } from '../utils/helpers';
import { Search, Camera, X, ShieldCheck, FileText, Download, User, HardHat as Hat, Tag, MapPin, Briefcase } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DeliveriesProps {
  deliveries: Delivery[];
  epis: EPI[];
  collaborators: Collaborator[];
}

export const Deliveries: React.FC<DeliveriesProps> = ({ deliveries, epis, collaborators }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [fichaPreview, setFichaPreview] = useState<Delivery | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fichaRef = useRef<HTMLDivElement>(null);

  const getCollaborator = (id: string) => collaborators.find(c => c.id === id);
  const getEPI = (id: string) => epis.find(e => e.id === id);

  const filteredDeliveries = deliveries.filter(d => 
    getCollaborator(d.collaboratorId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEPI(d.epiId)?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEPI(d.epiId)?.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const generatePDF = async () => {
    if (!fichaRef.current || !fichaPreview) return;
    setIsExporting(true);
    try {
      const element = fichaRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const col = getCollaborator(fichaPreview.collaboratorId);
      const epi = getEPI(fichaPreview.epiId);
      const dateStr = new Date(fichaPreview.date).toISOString().split('T')[0];
      
      // Nome do arquivo solicitado
      const fileName = `${col?.name}_${epi?.description}_${dateStr}_${col?.branch}_${col?.matricula}.pdf`
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_.]/g, '');

      pdf.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao processar o PDF. Verifique os logs.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Histórico de Entregas</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Registros de Recebimento de Materiais</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Pesquisar por nome ou ID..."
            className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-sm text-white font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-4.5 text-slate-600" size={18} />
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-800">
              <tr>
                <th className="px-8 py-6">Evidência</th>
                <th className="px-8 py-6">Data / Hora</th>
                <th className="px-8 py-6">Colaborador</th>
                <th className="px-8 py-6">Equipamento (ID)</th>
                <th className="px-8 py-6">Motivo</th>
                <th className="px-8 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-bold">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center opacity-30 text-xs font-black uppercase">Nenhuma entrega registrada</td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      {delivery.photo ? (
                        <button onClick={() => setSelectedPhoto(delivery.photo!)} className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 hover:scale-110 transition-transform bg-slate-950 p-0.5">
                          <img src={delivery.photo} className="w-full h-full object-cover rounded-[10px]" />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-slate-800 border border-slate-800"><Camera size={18} /></div>
                      )}
                    </td>
                    <td className="px-8 py-5 font-mono text-[11px] text-slate-500">{formatDateTime(delivery.date)}</td>
                    <td className="px-8 py-5 text-white uppercase tracking-tight text-xs">
                       {getCollaborator(delivery.collaboratorId)?.name || 'N/A'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-white text-xs uppercase tracking-tight">{getEPI(delivery.epiId)?.description || 'EPI Excluído'}</span>
                        <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1"><Tag size={8} /> {delivery.epiId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[9px] text-slate-400 uppercase font-black px-2 py-1 bg-slate-800 rounded-lg">{delivery.reason}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setFichaPreview(delivery)} className="bg-white text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg">
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FOTO AMPLIADA */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-lg w-full">
            <img src={selectedPhoto} className="w-full h-auto rounded-[2rem] shadow-2xl border-4 border-slate-800" />
            <button className="absolute -top-12 right-0 text-white p-2 hover:scale-110 transition-transform"><X size={32} /></button>
          </div>
        </div>
      )}

      {/* MODAL FICHA PDF */}
      {fichaPreview && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative my-8">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
               <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                 <FileText size={20} className="text-blue-600" /> Prévia do Documento
               </h3>
               <button onClick={() => setFichaPreview(null)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>

            <div ref={fichaRef} className="p-16 bg-white text-slate-900 font-serif leading-relaxed">
               {/* CONTEÚDO DA FICHA (MESMO DO PDF) */}
               <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Recibo de Entrega de EPI</h1>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.3em]">NR-06 | Segurança do Trabalho</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registro ID</p>
                    <p className="text-lg font-black text-blue-600">{fichaPreview.id}</p>
                  </div>
               </div>
               
               <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-widest mb-1">Colaborador</span>
                        <span className="font-black uppercase text-base text-slate-900 leading-tight">{getCollaborator(fichaPreview.collaboratorId)?.name}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-widest mb-1">Cargo</span>
                        <span className="font-bold text-xs">{getCollaborator(fichaPreview.collaboratorId)?.role}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-widest mb-1">CPF / Matrícula</span>
                        <span className="font-bold text-sm">{getCollaborator(fichaPreview.collaboratorId)?.matricula}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-widest mb-1">Agência</span>
                        <span className="font-bold text-xs">{getCollaborator(fichaPreview.collaboratorId)?.branch}</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="mb-12 border-2 border-slate-100 rounded-3xl overflow-hidden">
                 <table className="w-full border-collapse">
                    <thead className="bg-slate-900 text-white text-[9px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-left">Item Entregue</th>
                        <th className="px-6 py-4 text-right">C.A.</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr>
                        <td className="px-6 py-6 font-bold uppercase">{getEPI(fichaPreview.epiId)?.description}</td>
                        <td className="px-6 py-6 text-right font-black">{getEPI(fichaPreview.epiId)?.ca || '---'}</td>
                      </tr>
                    </tbody>
                 </table>
               </div>

               <div className="mt-16 flex justify-between items-end gap-12">
                  <div className="flex-1 border-t-2 border-slate-900 pt-2">
                     <span className="text-[10px] uppercase font-black tracking-widest">Assinatura do Recebedor</span>
                     <p className="text-[8px] text-slate-400 mt-1">Confirmado via Biometria em {formatDate(fichaPreview.date)}</p>
                  </div>
                  <div className="shrink-0">
                     <div className="w-32 h-32 rounded-3xl border-4 border-slate-100 overflow-hidden shadow-lg grayscale">
                        {fichaPreview.photo && <img src={fichaPreview.photo} className="w-full h-full object-cover" />}
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-4 no-print">
               <button 
                 onClick={generatePDF} 
                 disabled={isExporting} 
                 className="flex items-center justify-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
               >
                 {isExporting ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download size={18} />}
                 {isExporting ? 'Exportando...' : 'Baixar PDF Novamente'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
