
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

const LEGAL_TEXT = `Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e que estou ciente da Legislação abaixo discriminada.
Portaria 3214, 08/06/78 do M T E, NR- 01 e NR-06... (Texto Completo na Versão Impressa)`;

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
      
      const fileName = `${col?.name}_${epi?.description}_${dateStr}_${col?.branch}_${col?.matricula}.pdf`
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_.]/g, '');

      pdf.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao processar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const col = fichaPreview ? getCollaborator(fichaPreview.collaboratorId) : null;
  const epi = fichaPreview ? getEPI(fichaPreview.epiId) : null;
  const isShopee = col?.branch?.toLowerCase().includes('shopee');

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

      {selectedPhoto && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-lg w-full">
            <img src={selectedPhoto} className="w-full h-auto rounded-[2rem] shadow-2xl border-4 border-slate-800" />
            <button className="absolute -top-12 right-0 text-white p-2 hover:scale-110 transition-transform"><X size={32} /></button>
          </div>
        </div>
      )}

      {fichaPreview && col && epi && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[1rem] shadow-2xl overflow-hidden relative my-8">
            <div className="p-4 bg-slate-100 border-b border-slate-300 flex justify-between items-center no-print">
               <h3 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2">
                 <FileText size={18} className="text-blue-600" /> Prévia da Ficha
               </h3>
               <button onClick={() => setFichaPreview(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>

            {/* CONTEÚDO DA PRÉVIA - IGUAL AO PDF GERADO */}
            <div ref={fichaRef} className="p-8 bg-white text-black font-sans text-xs">
                
                {/* Header */}
                <div className="border-2 border-black mb-4 flex">
                    <div className="w-1/3 border-r-2 border-black flex items-center justify-center p-2">
                        <h1 className={`text-xl font-black text-center uppercase ${isShopee ? 'text-red-600' : 'text-blue-900'}`}>
                            {col.branch || 'LOGO'}
                        </h1>
                    </div>
                    <div className="w-2/3 p-2">
                        <h2 className="text-center font-bold text-[10px] uppercase mb-1">TERMO DE RESPONSABILIDADE</h2>
                        <p className="text-[7px] text-justify leading-tight">
                            {LEGAL_TEXT}
                        </p>
                    </div>
                </div>

                <div className="border-2 border-black border-b-0 py-1 bg-white text-center">
                    <h2 className="text-[10px] font-black uppercase">FICHA DE CONTROLE DE EPI</h2>
                </div>

                <div className="border-2 border-black text-[10px] font-bold uppercase mb-0">
                    <div className="border-b border-black p-1 pl-2">
                        Nome: <span className="font-normal ml-2">{col.name}</span>
                    </div>
                    <div className="flex border-b border-black">
                        <div className="w-1/2 border-r border-black p-1 pl-2">
                            Matrícula: <span className="font-normal ml-2">{col.matricula}</span>
                        </div>
                        <div className="w-1/2 p-1 pl-2">
                            Data de Admissão: <span className="font-normal ml-2">-</span>
                        </div>
                    </div>
                    <div className="flex border-b border-black">
                        <div className="w-1/2 border-r border-black p-1 pl-2">
                            Unidade: <span className="font-normal ml-2">{col.branch}</span>
                        </div>
                        <div className="w-1/2 p-1 pl-2">
                            Turno: <span className="font-normal ml-2">-</span>
                        </div>
                    </div>
                    <div className="p-1 pl-2">
                        Função: <span className="font-normal ml-2">{col.role}</span>
                    </div>
                </div>

                <div className="mt-0">
                    <table className="w-full border-2 border-black border-t-0 text-[9px] text-center">
                        <thead>
                            <tr className="border-b border-black font-bold uppercase">
                                <th className="border-r border-black p-1 w-8">Qt</th>
                                <th className="border-r border-black p-1 w-8">Un</th>
                                <th className="border-r border-black p-1">Discriminação</th>
                                <th className="border-r border-black p-1 w-16">CA</th>
                                <th className="border-r border-black p-1 w-16">Entrega</th>
                                <th className="border-r border-black p-1 w-24">Assinatura</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-black h-8">
                                <td className="border-r border-black">1</td>
                                <td className="border-r border-black">UN</td>
                                <td className="border-r border-black text-left pl-2">{epi.description}</td>
                                <td className="border-r border-black">{epi.ca}</td>
                                <td className="border-r border-black">{formatDate(fichaPreview.date)}</td>
                                <td className="border-r border-black text-[7px]">DIGITAL</td>
                            </tr>
                            {[...Array(3)].map((_, i) => (
                                <tr key={i} className="border-b border-black h-8"><td colSpan={6}></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {fichaPreview.notes && (
                    <div className="border border-black p-2 mt-4 text-[10px]">
                        <strong>OBS:</strong> {fichaPreview.notes}
                    </div>
                )}

                {/* AREA DE ASSINATURA E FOTO PEQUENA (3X4 / 5X5) */}
                <div className="mt-8 flex justify-between items-end gap-4 px-4">
                     {/* Assinatura Gestor */}
                     <div className="flex-1 text-center">
                         <div className="border-b border-black mb-1"></div>
                         <p className="text-[9px] uppercase font-bold">Assinatura do Responsável</p>
                     </div>

                     {/* Assinatura Colaborador */}
                     <div className="flex-1 text-center">
                         <div className="border-b border-black mb-1"></div>
                         <p className="text-[9px] uppercase font-bold">Assinatura do Colaborador</p>
                     </div>

                     {/* FOTO PEQUENA */}
                     <div className="shrink-0">
                         {fichaPreview.photo ? (
                             <div className="w-[80px] h-[100px] border border-black p-1 bg-white">
                                 <img src={fichaPreview.photo} className="w-full h-full object-cover" style={{ objectPosition: 'center' }} />
                             </div>
                         ) : (
                             <div className="w-[80px] h-[100px] border border-black flex items-center justify-center text-[8px] uppercase text-center p-2">
                                 Foto Biometria
                             </div>
                         )}
                         <p className="text-[7px] text-center mt-1 uppercase font-bold">Biometria</p>
                     </div>
                </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-300 flex justify-end gap-4 no-print">
               <button 
                 onClick={generatePDF} 
                 disabled={isExporting} 
                 className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
               >
                 {isExporting ? 'Processando...' : 'Baixar PDF'} <Download size={16} />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
