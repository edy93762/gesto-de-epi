
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, EPI, Delivery, DeliveryReason } from '../types';
import { generateId, formatDate, formatDateTime } from '../utils/helpers';
import { 
  X, 
  User, 
  CheckCircle2,
  ChevronRight,
  Camera,
  Search,
  Building2,
  RefreshCw,
  ArrowLeft,
  Package,
  FileEdit,
  Square,
  CheckSquare
} from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface NewDeliveryFormProps {
  collaborators: Collaborator[];
  epis: EPI[];
  onSave: (deliveries: Delivery[]) => void;
  onAddCollaborator: (collaborator: Collaborator) => void;
  onCancel: () => void;
}

// Texto legal fixo
const LEGAL_TEXT = `Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e que estou ciente da Legislação abaixo discriminada.
Portaria 3214, 08/06/78 do M T E, NR- 01 e NR-06
1.4.2 Cabe ao trabalhador:
a) cumprir as disposições legais e regulamentares sobre segurança e saúde no trabalho, inclusive as ordens de serviço expedidas pelo empregador; b) submeter-se aos exames médicos previstos nas NR; c) colaborar com a organização na aplicação das NR; e d) usar o equipamento de proteção individual fornecido pelo empregador.
1.4.2.1 Constitui ato faltoso a recusa injustificada do empregado ao cumprimento do disposto nas alíneas do subitem anterior.
6.7.1 Cabe ao empregado quanto ao EPI:
a) usar, utilizando-o apenas para a finalidade a que se destina; b) responsabilizar-se pela guarda e conservação; c) comunicar ao empregador qualquer alteração que o torne impróprio para uso; e, d) cumprir as determinações do empregador sobre o uso adequado.
CLT - Art. 462 § 1º - Em caso de dano causado pelo empregado o desconto será lícito desde que esta possibilidade tenha sido acordada ou na ocorrência de dolo do empregado.`;

export const NewDeliveryForm: React.FC<NewDeliveryFormProps> = ({
  collaborators,
  epis,
  onSave,
  onCancel,
}) => {
  const [step, setStep] = useState<'SELECT_USER' | 'FORM_DATA' | 'CAMERA'>('SELECT_USER');
  const [selectedCol, setSelectedCol] = useState<Collaborator | null>(null);
  const [selectedEpiIds, setSelectedEpiIds] = useState<string[]>([]);
  const [reason, setReason] = useState<DeliveryReason>('Primeira');
  const [notes, setNotes] = useState(''); 
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const filteredCollaborators = collaborators.filter(c => 
    c.active && (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.branch.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const toggleEpiSelection = (id: string) => {
    setSelectedEpiIds(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (step === 'CAMERA' && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, facingMode, capturedPhoto]);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      alert("Erro ao abrir câmera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photo);
      stopCamera();
    }
  };

  const handleSave = async () => {
    if (!selectedCol || selectedEpiIds.length === 0 || !capturedPhoto) return;
    setIsSaving(true);
    
    // Simula delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 800));

    // Cria um registro de entrega para CADA EPI selecionado
    const newDeliveries: Delivery[] = selectedEpiIds.map(epiId => ({
      id: generateId('REC'),
      date: new Date().toISOString(),
      collaboratorId: selectedCol.id,
      epiId: epiId,
      reason,
      notes: notes,
      responsibleEmail: selectedCol.managerEmail || 'admin@nr06.com',
      photo: capturedPhoto, 
      verificationResult: { match: true, confidence: 100, reason: 'Registro Fotográfico' }
    }));
    
    onSave(newDeliveries);
    setIsSaving(false);
  };

  const isShopee = selectedCol?.branch?.toLowerCase().includes('shopee');
  const selectedEpisList = epis.filter(e => selectedEpiIds.includes(e.id));

  // --- RENDER STEP 1 ---
  if (step === 'SELECT_USER') {
    return (
      <div className="max-w-4xl mx-auto mb-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl mb-6 flex justify-between items-center">
          <div>
             <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Nova Entrega</h2>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o Colaborador</p>
          </div>
          <button onClick={onCancel} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 h-[600px] flex flex-col">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-4 text-slate-500" size={18} />
            <input 
              autoFocus
              type="text" 
              placeholder="Buscar por Nome ou CPF..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
             {filteredCollaborators.map(c => (
               <button 
                 key={c.id} 
                 onClick={() => { setSelectedCol(c); setStep('FORM_DATA'); }}
                 className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left group"
               >
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                    <User size={20} className="text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="text-white text-sm font-black uppercase truncate group-hover:text-blue-400">{c.name}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase truncate flex items-center gap-2">
                        <span><Building2 size={10} className="inline mr-1"/>{c.branch}</span>
                        <span>•</span>
                        <span>CPF: {c.cpf || '---'}</span>
                     </p>
                  </div>
                   <div className="px-3 py-1 bg-blue-900/30 rounded-lg border border-blue-500/20 text-[10px] font-black text-blue-400">
                     {c.shift}
                   </div>
                  <ChevronRight size={20} className="text-slate-700 group-hover:text-blue-500" />
               </button>
             ))}
             {filteredCollaborators.length === 0 && (
                <div className="text-center p-10 text-slate-600 font-black uppercase text-xs">Nenhum colaborador encontrado</div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER STEP 2 ---
  if (step === 'FORM_DATA') {
    return (
      <div className="max-w-2xl mx-auto mb-20 animate-in slide-in-from-right-8 duration-500">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button onClick={() => { setStep('SELECT_USER'); setSelectedCol(null); setSelectedEpiIds([]); }} className="p-3 bg-slate-950 rounded-xl hover:text-white text-slate-500"><ArrowLeft size={20} /></button>
             <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Dados da Entrega</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione os Itens</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-900">
                  <User size={32} className="text-slate-600" />
               </div>
               <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Colaborador</p>
                  <p className="text-lg font-black text-white uppercase leading-none">{selectedCol?.name}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{selectedCol?.role} • {selectedCol?.shift}</p>
               </div>
               <CheckCircle2 className="ml-auto text-emerald-500" size={24} />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                 <Package size={14} className="text-orange-500" /> Selecione os Equipamentos (Múltipla Escolha)
              </label>
              
              <div className="bg-slate-950 border border-slate-800 rounded-3xl max-h-60 overflow-y-auto custom-scrollbar p-2">
                 {epis.filter(e => e.active).map(e => {
                   const isSelected = selectedEpiIds.includes(e.id);
                   return (
                     <button 
                        key={e.id}
                        onClick={() => toggleEpiSelection(e.id)}
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all mb-1 text-left ${isSelected ? 'bg-blue-900/20 border border-blue-500/50' : 'hover:bg-slate-900 border border-transparent'}`}
                     >
                        <div className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-600'}`}>
                           {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        <div className="min-w-0">
                           <p className={`text-xs font-black uppercase ${isSelected ? 'text-white' : 'text-slate-400'}`}>{e.description}</p>
                           <p className="text-[9px] text-slate-500 font-bold uppercase">{e.id} • CA: {e.ca || 'N/A'}</p>
                        </div>
                     </button>
                   );
                 })}
              </div>
              {selectedEpiIds.length > 0 && (
                <p className="text-right text-[10px] font-black text-blue-500 uppercase tracking-widest px-2">{selectedEpiIds.length} Itens Selecionados</p>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo</label>
              <div className="grid grid-cols-2 gap-2">
                {['Primeira', 'Troca', 'Desgaste', 'Perda'].map(r => (
                  <button 
                    key={r}
                    onClick={() => setReason(r as any)}
                    className={`py-3 rounded-2xl text-[9px] font-black uppercase border transition-all ${reason === r ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                 <FileEdit size={14} className="text-blue-500" /> Observações (Opcional)
              </label>
              <textarea
                className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl text-white font-medium text-xs outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none h-24"
                placeholder="Ex: Devolução do EPI anterior realizada..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button 
              onClick={() => setStep('CAMERA')}
              disabled={selectedEpiIds.length === 0}
              className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-20 shadow-xl flex items-center justify-center gap-3"
            >
              <Camera size={20} /> Registrar Foto da Entrega
            </button>
        </div>
      </div>
    );
  }

  // --- RENDER STEP 3 ---
  if (step === 'CAMERA') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in zoom-in-95 duration-300">
         <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div>
               <p className="text-white font-black text-lg uppercase tracking-tight shadow-black drop-shadow-md">Registro de Entrega</p>
               <p className="text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">{selectedCol?.name}</p>
            </div>
            <button onClick={() => { setCapturedPhoto(null); setStep('FORM_DATA'); }} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20">
               <X size={24} />
            </button>
         </div>

         <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {!capturedPhoto ? (
               <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                  />
                  <div className="absolute bottom-8 w-full flex justify-center items-center gap-8 z-20 pb-safe">
                     <button onClick={toggleCamera} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20">
                        <RefreshCw size={24} />
                     </button>
                     <button 
                        onClick={takePhoto} 
                        className="w-24 h-24 bg-white rounded-full border-4 border-slate-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-transform flex items-center justify-center"
                     >
                        <div className="w-20 h-20 border-2 border-black rounded-full"></div>
                     </button>
                     <div className="w-14"></div>
                  </div>
               </>
            ) : (
               <>
                  <img src={capturedPhoto} className="absolute inset-0 w-full h-full object-contain bg-black" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pb-safe">
                     <div className="flex gap-4 max-w-md mx-auto">
                        <button 
                          onClick={() => setCapturedPhoto(null)} 
                          disabled={isSaving}
                          className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-700 disabled:opacity-50"
                        >
                           Tirar Outra
                        </button>
                        <button 
                          onClick={handleSave} 
                          disabled={isSaving}
                          className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-400 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {isSaving ? "Salvando..." : "Confirmar & Salvar no Histórico"}
                        </button>
                     </div>
                  </div>
               </>
            )}
         </div>
         <canvas ref={canvasRef} className="hidden" />

         {/* --- FICHA TÉCNICA (PDF) --- */}
         <div 
            ref={receiptRef} 
            className="fixed -left-[9999px] top-0 bg-white text-black font-sans"
            style={{ width: '210mm', minHeight: '297mm', padding: '10mm' }}
         >
            {/* Header */}
            <div className="border-2 border-black mb-4 flex" style={{ height: '180px' }}>
                <div className="w-1/3 border-r-2 border-black flex items-center justify-center p-4">
                    <h1 className={`text-3xl font-black text-center uppercase leading-tight ${isShopee ? 'text-red-600' : 'text-blue-900'}`}>
                        {selectedCol?.branch || 'LOGO DA EMPRESA'}
                    </h1>
                </div>
                <div className="w-2/3 p-2 relative">
                    <h2 className="text-center font-bold text-xs uppercase mb-1">TERMO DE RESPONSABILIDADE</h2>
                    <p className="text-[8px] text-justify leading-tight" style={{ whiteSpace: 'pre-wrap' }}>
                        {LEGAL_TEXT}
                    </p>
                </div>
            </div>

            <div className="border-2 border-black border-b-0 py-2 bg-white text-center">
                <h2 className="text-sm font-black uppercase">FICHA DE CONTROLE DE EPI</h2>
            </div>

            <div className="border-2 border-black text-xs font-bold uppercase mb-0">
                <div className="border-b border-black p-1 pl-2">
                    Nome: <span className="font-normal ml-2">{selectedCol?.name}</span>
                </div>
                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-1 pl-2">
                        CPF: <span className="font-normal ml-2">{selectedCol?.cpf}</span>
                    </div>
                    <div className="w-1/2 p-1 pl-2">
                        Data de Admissão: <span className="font-normal ml-2">-</span>
                    </div>
                </div>
                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-1 pl-2">
                        Unidade: <span className="font-normal ml-2">{selectedCol?.branch}</span>
                    </div>
                    <div className="w-1/2 p-1 pl-2">
                        Turno: <span className="font-normal ml-2">{selectedCol?.shift}</span>
                    </div>
                </div>
                <div className="p-1 pl-2">
                    Função: <span className="font-normal ml-2">{selectedCol?.role}</span>
                </div>
            </div>

            <div className="mt-0">
                <table className="w-full border-2 border-black border-t-0 text-[10px] text-center">
                    <thead>
                        <tr className="border-b border-black font-bold uppercase">
                            <th className="border-r border-black p-1 w-10">Quant.</th>
                            <th className="border-r border-black p-1 w-10">Unid.</th>
                            <th className="border-r border-black p-1">Discriminação</th>
                            <th className="border-r border-black p-1 w-20">Nº C. A</th>
                            <th className="border-r border-black p-1 w-20">Motivo</th>
                            <th className="border-r border-black p-1 w-20">Data da Entrega</th>
                            <th className="border-r border-black p-1 w-24">Assinatura</th>
                            <th className="border-r border-black p-1 w-20">Data da Devolução</th>
                            <th className="p-1 w-24">Assinatura</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* LISTA DE EPIS SELECIONADOS */}
                        {selectedEpisList.map((epi) => (
                          <tr key={epi.id} className="border-b border-black h-8">
                              <td className="border-r border-black">1</td>
                              <td className="border-r border-black">UN</td>
                              <td className="border-r border-black text-left pl-2">{epi.description}</td>
                              <td className="border-r border-black">{epi.ca}</td>
                              <td className="border-r border-black font-bold">{reason}</td>
                              <td className="border-r border-black">{formatDate(new Date().toISOString())}</td>
                              <td className="border-r border-black text-[7px] italic">BIOMETRIA DIGITAL</td>
                              <td className="border-r border-black"></td>
                              <td></td>
                          </tr>
                        ))}
                        
                        {/* LINHAS VAZIAS PARA PREENCHER */}
                        {[...Array(Math.max(0, 6 - selectedEpisList.length))].map((_, i) => (
                            <tr key={i} className="border-b border-black h-8"><td colSpan={9}></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {notes && (
                <div className="border border-black p-2 text-xs mb-4 mt-4">
                    <strong>OBSERVAÇÕES:</strong> {notes}
                </div>
            )}

            {/* AREA DE ASSINATURA E FOTO NA MESMA LINHA */}
             <div className="mt-8 flex justify-between items-end gap-2 px-2 border-2 border-black p-2">
                 
                 <div className="flex-1 flex gap-4">
                    <div className="flex-1 text-center">
                        <div className="border-b border-black mb-1 mt-8"></div>
                        <p className="text-[9px] uppercase font-bold">Responsável: {selectedCol?.managerName || 'ADM'}</p>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="border-b border-black mb-1 mt-8"></div>
                        <p className="text-[9px] uppercase font-bold">Colaborador: {selectedCol?.name}</p>
                    </div>
                 </div>

                 <div className="shrink-0 ml-4">
                     {capturedPhoto && (
                         <div className="w-[3cm] h-[4cm] border border-black p-1 bg-white">
                             <img src={capturedPhoto} className="w-full h-full object-cover" />
                         </div>
                     )}
                     <p className="text-[7px] text-center mt-1 uppercase font-bold">Biometria</p>
                 </div>
            </div>
         </div>
      </div>
    );
  }

  return null;
};
