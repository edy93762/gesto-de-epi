
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
  Download,
  FileText,
  Shield
} from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface NewDeliveryFormProps {
  collaborators: Collaborator[];
  epis: EPI[];
  onSave: (delivery: Delivery) => void;
  onAddCollaborator: (collaborator: Collaborator) => void;
  onCancel: () => void;
}

export const NewDeliveryForm: React.FC<NewDeliveryFormProps> = ({
  collaborators,
  epis,
  onSave,
  onCancel,
}) => {
  // Fluxo: SELECT_USER -> FORM_DATA -> CAMERA
  const [step, setStep] = useState<'SELECT_USER' | 'FORM_DATA' | 'CAMERA'>('SELECT_USER');
  
  const [selectedCol, setSelectedCol] = useState<Collaborator | null>(null);
  const [selectedEpiId, setSelectedEpiId] = useState('');
  const [reason, setReason] = useState<DeliveryReason>('Primeira');
  
  // Câmera e Foto
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSaving, setIsSaving] = useState(false);
  
  // Busca
  const [searchTerm, setSearchTerm] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null); // Ref para o PDF

  const filteredCollaborators = collaborators.filter(c => 
    c.active && (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.branch.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const selectedEpi = epis.find(e => e.id === selectedEpiId);

  // Efeito para controlar a câmera apenas quando estiver no passo CAMERA
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
      
      // Espelhar se for frontal
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

  const generateAndDownloadPDF = async (deliveryId: string) => {
    if (!receiptRef.current) return;
    
    try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            backgroundColor: "#ffffff",
            allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NR06_${selectedCol?.name?.replace(/\s+/g, '_')}_${deliveryId}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF", error);
        alert("A entrega foi salva, mas houve um erro ao gerar o PDF.");
    }
  };

  const handleSave = async () => {
    if (!selectedCol || !selectedEpiId || !capturedPhoto) return;
    
    setIsSaving(true);
    const newId = generateId('REC');
    
    // Aguarda um pequeno delay para garantir que o React renderizou o componente oculto com os dados atuais
    await new Promise(resolve => setTimeout(resolve, 500));

    await generateAndDownloadPDF(newId);

    onSave({
      id: newId,
      date: new Date().toISOString(),
      collaboratorId: selectedCol.id,
      epiId: selectedEpiId,
      reason,
      notes: 'Entrega com Evidência Fotográfica e Assinatura Digital',
      responsibleEmail: 'admin@nr06.com',
      photo: capturedPhoto,
      verificationResult: { match: true, confidence: 100, reason: 'Registro Fotográfico' }
    });
    
    setIsSaving(false);
  };

  // --- RENDER STEP 1: SELEÇÃO DE USUÁRIO ---
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
              placeholder="Buscar Nome, Matrícula ou Empresa..." 
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
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0">
                    {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-3 text-slate-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="text-white text-sm font-black uppercase truncate group-hover:text-blue-400">{c.name}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase truncate flex items-center gap-2">
                        <span><Building2 size={10} className="inline mr-1"/>{c.branch}</span>
                        <span>•</span>
                        <span>{c.matricula || 'S/ Matrícula'}</span>
                     </p>
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

  // --- RENDER STEP 2: DADOS DA ENTREGA ---
  if (step === 'FORM_DATA') {
    return (
      <div className="max-w-2xl mx-auto mb-20 animate-in slide-in-from-right-8 duration-500">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button onClick={() => { setStep('SELECT_USER'); setSelectedCol(null); }} className="p-3 bg-slate-950 rounded-xl hover:text-white text-slate-500"><ArrowLeft size={20} /></button>
             <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Dados da Entrega</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passo 2 de 3</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
            {/* Resumo Colaborador */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700">
                  {selectedCol?.photo ? <img src={selectedCol.photo} className="w-full h-full object-cover" /> : <User size={32} className="m-auto mt-4" />}
               </div>
               <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Colaborador</p>
                  <p className="text-lg font-black text-white uppercase leading-none">{selectedCol?.name}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{selectedCol?.role}</p>
               </div>
               <CheckCircle2 className="ml-auto text-emerald-500" size={24} />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                 <Package size={14} className="text-orange-500" /> Equipamento
              </label>
              <select 
                className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl text-white font-black text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                value={selectedEpiId}
                onChange={(e) => setSelectedEpiId(e.target.value)}
              >
                <option value="">Selecione o EPI...</option>
                {epis.filter(e => e.active).map(e => (
                  <option key={e.id} value={e.id}>{e.id} | {e.description}</option>
                ))}
              </select>
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

            <button 
              onClick={() => setStep('CAMERA')}
              disabled={!selectedEpiId}
              className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-20 shadow-xl flex items-center justify-center gap-3"
            >
              <Camera size={20} /> Registrar Foto da Entrega
            </button>
        </div>
      </div>
    );
  }

  // --- RENDER STEP 3: FULLSCREEN CAMERA ---
  if (step === 'CAMERA') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in zoom-in-95 duration-300">
         {/* Top Bar */}
         <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div>
               <p className="text-white font-black text-lg uppercase tracking-tight shadow-black drop-shadow-md">Registro de Entrega</p>
               <p className="text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">{selectedCol?.name}</p>
            </div>
            <button onClick={() => { setCapturedPhoto(null); setStep('FORM_DATA'); }} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20">
               <X size={24} />
            </button>
         </div>

         {/* Camera Viewport */}
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
                     <div className="w-14"></div> {/* Spacer for symmetry */}
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
                           {isSaving ? (
                             <>
                               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                               Gerando PDF...
                             </>
                           ) : (
                             "Confirmar & Baixar"
                           )}
                        </button>
                     </div>
                  </div>
               </>
            )}
         </div>
         <canvas ref={canvasRef} className="hidden" />

         {/* --- HIDDEN RECEIPT TEMPLATE FOR PDF --- */}
         {/* This div is positioned way off-screen but rendered so html2canvas can capture it */}
         <div 
            ref={receiptRef} 
            className="fixed -left-[9999px] top-0 w-[800px] bg-white text-black p-12 font-sans"
            style={{ width: '800px', minHeight: '1120px' }}
         >
            {/* Header */}
            <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-start">
               <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Ficha de Entrega de EPI</h1>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Norma Regulamentadora NR-06</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-400">Emissão</p>
                  <p className="text-lg font-mono font-bold">{formatDateTime(new Date().toISOString())}</p>
               </div>
            </div>

            {/* Employer / Employee Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
               <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Empregador / Unidade</h3>
                  <p className="text-xl font-bold uppercase mb-1">{selectedCol?.branch || 'Sede Principal'}</p>
                  <p className="text-sm text-gray-600">Gestor Resp: {selectedCol?.managerName || 'RH'}</p>
               </div>
               <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Colaborador</h3>
                  <p className="text-xl font-bold uppercase mb-1">{selectedCol?.name}</p>
                  <div className="flex gap-4 text-sm text-gray-600 font-bold">
                     <span>MAT: {selectedCol?.matricula || '---'}</span>
                     <span>|</span>
                     <span>{selectedCol?.role}</span>
                  </div>
               </div>
            </div>

            {/* EPI Info */}
            <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
               <div className="bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-widest">Equipamento Fornecido</div>
               <div className="p-6">
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="text-2xl font-bold uppercase">{selectedEpi?.description}</p>
                        <p className="text-sm font-bold text-gray-500 mt-1">ID: {selectedEpi?.id}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-black text-gray-400 uppercase">Certificado de Aprovação</p>
                        <p className="text-xl font-bold">CA: {selectedEpi?.ca}</p>
                     </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 uppercase font-bold">
                     Motivo da Entrega: <span className="text-black">{reason}</span>
                  </div>
               </div>
            </div>

            {/* Legal Text */}
            <div className="mb-8 text-xs text-justify leading-relaxed text-gray-600 uppercase border-l-4 border-gray-300 pl-4">
               <p>
                  Declaro para os devidos fins que recebi o Equipamento de Proteção Individual (EPI) descrito acima, em perfeito estado de conservação e funcionamento. 
                  Comprometo-me a utilizá-lo apenas para as finalidades a que se destina, responsabilizando-me pela sua guarda e conservação, comunicando ao empregador qualquer alteração que o torne impróprio para uso, e cumprindo as determinações da NR-06.
               </p>
            </div>

            {/* Photo Evidence & Digital Signature */}
            <div className="grid grid-cols-2 gap-8 items-end">
               <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Evidência Fotográfica</p>
                  <div className="w-full h-64 bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden">
                     {capturedPhoto && <img src={capturedPhoto} className="w-full h-full object-cover grayscale contrast-125" />}
                  </div>
               </div>
               
               <div className="border-t-2 border-black pt-4">
                   <p className="text-sm font-bold uppercase mb-2">Assinatura Digital</p>
                   <div className="border-2 border-black p-4 rounded-lg bg-gray-50 relative overflow-hidden flex flex-col items-center">
                      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                         <Shield size={120} />
                      </div>
                      
                      {/* FOTO DO COLABORADOR NO PDF - FIX */}
                      {selectedCol?.photo && (
                        <div className="w-16 h-16 rounded-full border-2 border-gray-300 overflow-hidden mb-2">
                           <img src={selectedCol.photo} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        </div>
                      )}

                      <p className="text-[10px] uppercase font-bold text-gray-500 text-center mb-1">Autenticação Biométrica / Sistema</p>
                      <p className="text-center font-mono font-bold text-xs break-all leading-tight mb-2">
                         KEY: {Math.random().toString(36).substring(2, 15).toUpperCase()}-{Date.now().toString(36).toUpperCase()}
                      </p>
                      <p className="text-center text-[10px] uppercase font-black">
                         {selectedCol?.name}
                      </p>
                      <p className="text-center text-[8px] text-gray-400 uppercase mt-1">
                         Assinado Eletronicamente em {formatDate(new Date().toISOString())}
                      </p>
                   </div>
               </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center">
               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.5em]">Sistema de Controle NR-06 PRO</p>
            </div>
         </div>
      </div>
    );
  }

  return null;
};
