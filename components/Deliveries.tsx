
import React, { useState, useRef, useMemo } from 'react';
import { Delivery, EPI, Collaborator } from '../types';
import { formatDateTime, formatDate } from '../utils/helpers';
import { Search, X, FileText, Download, User, HardHat, Building2, ChevronRight, Calendar } from 'lucide-react';
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
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fichaRef = useRef<HTMLDivElement>(null);

  const getCollaborator = (id: string) => collaborators.find(c => c.id === id);
  const getEPI = (id: string) => epis.find(e => e.id === id);

  // 1. Agrupar entregas por Colaborador para a lista principal
  const collaboratorsWithHistory = useMemo(() => {
    const uniqueIds = Array.from(new Set(deliveries.map(d => d.collaboratorId)));
    
    return uniqueIds.map(id => {
      const col = getCollaborator(id);
      const colDeliveries = deliveries.filter(d => d.collaboratorId === id);
      // Pega a data mais recente
      const lastDelivery = colDeliveries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      return {
        collaborator: col,
        totalItems: colDeliveries.length,
        lastUpdate: lastDelivery?.date
      };
    }).filter(item => 
      item.collaborator && 
      (item.collaborator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.collaborator.cpf.includes(searchTerm))
    );
  }, [deliveries, collaborators, searchTerm]);

  // 2. Dados da Ficha Selecionada (Histórico Completo)
  const activeFichaData = useMemo(() => {
    if (!selectedCollaboratorId) return null;
    
    const col = getCollaborator(selectedCollaboratorId);
    if (!col) return null;

    // Ordena do ANTIGO para o NOVO (preenchimento de cima para baixo na ficha)
    const history = deliveries
      .filter(d => d.collaboratorId === selectedCollaboratorId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { col, history };
  }, [selectedCollaboratorId, deliveries, collaborators]);

  // 3. Pega a foto mais recente (do último registro que tiver foto)
  const latestPhoto = useMemo(() => {
    if (!activeFichaData) return null;
    // Percorre do mais novo para o mais antigo procurando foto
    const reversedHistory = [...activeFichaData.history].reverse();
    const deliveryWithPhoto = reversedHistory.find(d => d.photo);
    return deliveryWithPhoto?.photo;
  }, [activeFichaData]);

  const generatePDF = async () => {
    if (!fichaRef.current || !activeFichaData) return;
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
      
      // Configuração A4 Altura Automática baseada no conteúdo
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const { col } = activeFichaData;
      // Nome do Arquivo Padronizado: FICHA_EPI_NOME_CPF.pdf
      const fileName = `FICHA_EPI_${col.name}_${col.cpf}`
          .replace(/\s+/g, '_')
          .toUpperCase() + '.pdf';

      pdf.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao processar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const isShopee = activeFichaData?.col.branch?.toLowerCase().includes('shopee');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Principal */}
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Fichas de EPI</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
             Documentos Consolidados por Colaborador
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar Colaborador..."
            className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-sm text-white font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-4.5 text-slate-600" size={18} />
        </div>
      </div>

      {/* Lista de Fichas (Colaboradores) */}
      <div className="grid grid-cols-1 gap-4">
         {collaboratorsWithHistory.length === 0 ? (
            <div className="p-20 text-center text-slate-500 font-black uppercase text-xs border-2 border-dashed border-slate-800 rounded-[2rem]">
               Nenhum histórico encontrado.
            </div>
         ) : (
            collaboratorsWithHistory.map(({ collaborator, totalItems, lastUpdate }) => (
               <div key={collaborator?.id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/50 transition-all group">
                  <div className="flex items-center gap-5 w-full md:w-auto">
                     <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                        <User size={28} className="text-slate-500" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white uppercase leading-none mb-1">{collaborator?.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                           <Building2 size={10} /> {collaborator?.branch}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                           CPF: {collaborator?.cpf}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                     <div className="text-right">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Última Movimentação</p>
                        <p className="text-xs font-bold text-white flex items-center justify-end gap-1">
                           <Calendar size={12} className="text-blue-500" /> {lastUpdate ? formatDateTime(lastUpdate) : '-'}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Total Itens</p>
                        <p className="text-xs font-bold text-white flex items-center justify-end gap-1">
                           <HardHat size={12} className="text-orange-500" /> {totalItems}
                        </p>
                     </div>
                     
                     <button 
                        onClick={() => setSelectedCollaboratorId(collaborator!.id)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                     >
                        Abrir Ficha <ChevronRight size={14} />
                     </button>
                  </div>
               </div>
            ))
         )}
      </div>

      {/* --- MODAL DA FICHA ÚNICA --- */}
      {activeFichaData && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[1rem] shadow-2xl overflow-hidden relative my-8">
            
            {/* Toolbar do Modal */}
            <div className="p-4 bg-slate-100 border-b border-slate-300 flex justify-between items-center no-print sticky top-0 z-50">
               <h3 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2">
                 <FileText size={18} className="text-blue-600" /> Ficha Consolidada
               </h3>
               <button onClick={() => setSelectedCollaboratorId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>

            {/* ÁREA DE IMPRESSÃO (O DOCUMENTO REAL) */}
            <div ref={fichaRef} className="p-10 bg-white text-black font-sans text-xs min-h-[297mm]">
                
                {/* Cabeçalho Padrão */}
                <div className="border-2 border-black mb-4 flex">
                    <div className="w-1/3 border-r-2 border-black flex flex-col items-center justify-center p-2 bg-slate-50">
                        <h1 className={`text-lg font-black text-center uppercase leading-tight ${isShopee ? 'text-red-600' : 'text-blue-900'}`}>
                            {activeFichaData.col.branch || 'LOGO'}
                        </h1>
                        {/* Agência no Cabeçalho */}
                        {activeFichaData.col.agency && (
                           <div className="mt-2 pt-2 border-t border-slate-300 w-full text-center">
                              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Agência</p>
                              <p className="text-[9px] font-black uppercase text-slate-800">{activeFichaData.col.agency}</p>
                           </div>
                        )}
                    </div>
                    <div className="w-2/3 p-2">
                        <h2 className="text-center font-bold text-[10px] uppercase mb-1">TERMO DE RESPONSABILIDADE & FICHA DE CONTROLE</h2>
                        <p className="text-[7px] text-justify leading-tight text-slate-600">
                            {LEGAL_TEXT}
                        </p>
                    </div>
                </div>

                <div className="border-2 border-black border-b-0 py-1 bg-slate-100 text-center">
                    <h2 className="text-[10px] font-black uppercase">DADOS DO COLABORADOR</h2>
                </div>

                {/* Dados do Colaborador (Formato Lista) */}
                <div className="border-2 border-black text-[10px] font-bold uppercase mb-4">
                    <div className="border-b border-black p-1 pl-2 bg-white">
                        Nome: <span className="font-normal ml-2">{activeFichaData.col.name}</span>
                    </div>
                    <div className="flex border-b border-black">
                        <div className="w-1/2 border-r border-black p-1 pl-2">
                            CPF: <span className="font-normal ml-2">{activeFichaData.col.cpf}</span>
                        </div>
                        <div className="w-1/2 p-1 pl-2">
                            Matrícula/ID: <span className="font-normal ml-2">{activeFichaData.col.id}</span>
                        </div>
                    </div>
                    <div className="flex border-b border-black">
                        <div className="w-1/2 border-r border-black p-1 pl-2">
                            Unidade: <span className="font-normal ml-2">{activeFichaData.col.branch}</span>
                        </div>
                        <div className="w-1/2 p-1 pl-2">
                            Agência: <span className="font-normal ml-2">{activeFichaData.col.agency || '-'}</span>
                        </div>
                    </div>
                    <div className="flex">
                            <div className="w-1/2 border-r border-black p-1 pl-2">
                            Função: <span className="font-normal ml-2">{activeFichaData.col.role}</span>
                            </div>
                            <div className="w-1/2 p-1 pl-2">
                            Turno: <span className="font-normal ml-2">{activeFichaData.col.shift}</span>
                            </div>
                    </div>
                </div>

                {/* TABELA DE REGISTROS (LINHAS ACUMULATIVAS) */}
                <div className="mt-0">
                    <h3 className="text-[10px] font-black uppercase mb-1">REGISTRO DE ENTREGAS</h3>
                    <table className="w-full border-2 border-black text-[9px] text-center">
                        <thead className="bg-slate-100">
                            <tr className="border-b-2 border-black font-bold uppercase">
                                <th className="border-r border-black p-1 w-8">Qt</th>
                                <th className="border-r border-black p-1">Descrição do EPI</th>
                                <th className="border-r border-black p-1 w-20">CA/ID</th>
                                <th className="border-r border-black p-1 w-20">Motivo</th>
                                <th className="border-r border-black p-1 w-20">Data Entrega</th>
                                <th className="border-r border-black p-1 w-24">Visto Colab.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Mapeia TODAS as entregas do histórico */}
                            {activeFichaData.history.map((delivery, index) => {
                                const epi = getEPI(delivery.epiId);
                                return (
                                    <tr key={delivery.id} className="border-b border-black h-8 hover:bg-slate-50">
                                        <td className="border-r border-black">1</td>
                                        <td className="border-r border-black text-left pl-2 font-medium">{epi?.description || 'Item Excluído'}</td>
                                        <td className="border-r border-black">{delivery.epiId}</td>
                                        <td className="border-r border-black">{delivery.reason}</td>
                                        <td className="border-r border-black font-bold">{formatDate(delivery.date)}</td>
                                        <td className="border-r border-black text-[7px]">
                                            {delivery.photo ? 'BIOMETRIA OK' : 'ASS. MANUAL'}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Linhas em branco para preenchimento manual futuro (opcional, visual de ficha) */}
                            {[...Array(Math.max(0, 15 - activeFichaData.history.length))].map((_, i) => (
                                <tr key={`empty-${i}`} className="border-b border-black h-8">
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* RODAPÉ DO DOCUMENTO */}
                <div className="mt-8 flex justify-between items-end gap-2 border-t-2 border-black pt-4">
                     <div className="flex-1 flex gap-8">
                         {/* Assinatura Gestor */}
                         <div className="flex-1 text-center">
                             <div className="border-b border-black mb-1 mt-8"></div>
                             <p className="text-[9px] uppercase font-bold">Gestor: {activeFichaData.col.managerName}</p>
                         </div>

                         {/* Assinatura Colaborador */}
                         <div className="flex-1 text-center">
                             <div className="border-b border-black mb-1 mt-8"></div>
                             <p className="text-[9px] uppercase font-bold">Colaborador: {activeFichaData.col.name}</p>
                         </div>
                     </div>

                     {/* Área da Foto (Rodapé) */}
                     <div className="shrink-0 ml-4 flex flex-col items-center">
                       {latestPhoto ? (
                           <img src={latestPhoto} className="w-20 h-24 object-cover border border-slate-400 shadow-sm" alt="Biometria" />
                       ) : (
                           <div className="w-20 h-24 border border-slate-300 bg-slate-200 flex items-center justify-center text-center p-1">
                               <p className="text-[8px] text-slate-400 font-bold">SEM FOTO</p>
                           </div>
                       )}
                       <p className="text-[6px] text-center font-bold mt-1 text-slate-500 uppercase">Biometria Recente</p>
                    </div>
                </div>
                <div className="mt-4 text-[7px] text-center text-slate-400 uppercase">
                    Este documento substitui e revoga as versões anteriores. Gerado eletronicamente em {formatDateTime(new Date().toISOString())}.
                </div>
            </div>

            {/* Footer do Modal com Ação */}
            <div className="p-4 bg-slate-100 border-t border-slate-300 flex justify-end gap-4 no-print">
               <button 
                 onClick={generatePDF} 
                 disabled={isExporting} 
                 className="flex items-center justify-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs hover:bg-blue-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
               >
                 {isExporting ? 'Gerando PDF Único...' : 'Baixar/Imprimir Ficha Completa'} <Download size={16} />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
