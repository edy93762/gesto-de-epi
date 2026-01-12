
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, EPI, Delivery, DeliveryReason } from '../types';
import { generateId } from '../utils/helpers';
import { 
  X, 
  Loader2, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  Scan,
  CheckCircle2,
  HardHat,
  ChevronRight,
  Camera,
  Search,
  Building2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

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
  const [mode, setMode] = useState<'SCANNING' | 'MANUAL_SEARCH' | 'IDENTIFIED' | 'ERROR'>('SCANNING');
  const [identifiedCol, setIdentifiedCol] = useState<Collaborator | null>(null);
  const [selectedEpiId, setSelectedEpiId] = useState('');
  const [reason, setReason] = useState<DeliveryReason>('Primeira');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Posicione o rosto no centro');
  
  // States para busca manual
  const [searchTerm, setSearchTerm] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filteredCollaborators = collaborators.filter(c => 
    c.active && (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.branch.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    if (mode === 'SCANNING') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 480, height: 480 } // Reduzido levemente para performance
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setMode('ERROR');
      setStatusMsg("Erro ao acessar câmera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleIdentification = async () => {
    if (!videoRef.current || !canvasRef.current || collaborators.length === 0) {
      setStatusMsg("Sem dados para comparação.");
      return;
    }
    
    setIsProcessing(true);
    setStatusMsg("Processando imagem...");
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, 480, 480);
    const livePhotoBase64 = canvas.toDataURL('image/jpeg', 0.7); // Compressão maior para envio rápido
    setCapturedPhoto(livePhotoBase64);

    setStatusMsg("Analisando Biometria...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Envia apenas IDs e Fotos para economizar tokens
      const candidates = collaborators
        .filter(c => c.active && c.photo)
        .map(c => ({
          id: c.id,
          photo: c.photo!.split(',')[1]
        }));

      if (candidates.length === 0) throw new Error("Sem fotos de referência");

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: livePhotoBase64.split(',')[1] } },
            { text: `Identifique a pessoa. Banco de dados JSON: ${JSON.stringify(candidates)}. Retorne JSON: { "matchId": "ID" (ou null), "confidence": 0-100 }.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchId: { type: Type.STRING, nullable: true },
              confidence: { type: Type.NUMBER }
            },
            required: ["confidence"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      if (result.matchId) {
        const found = collaborators.find(c => c.id === result.matchId);
        if (found) {
          setIdentifiedCol(found);
          setMode('IDENTIFIED');
          setStatusMsg("Identificado!");
        } else {
          setMode('ERROR');
          setStatusMsg("ID não encontrado localmente.");
        }
      } else {
        setMode('ERROR');
        setStatusMsg("Rosto não compatível.");
      }
    } catch (err) {
      console.error(err);
      setMode('ERROR');
      setStatusMsg("Falha na IA. Tente busca manual.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectManual = (col: Collaborator) => {
    setIdentifiedCol(col);
    setCapturedPhoto(col.photo || null); // Usa a foto do cadastro se não tiver scan
    setMode('IDENTIFIED');
  };

  const handleSave = () => {
    if (!identifiedCol || !selectedEpiId) return;
    onSave({
      id: generateId('REC'),
      date: new Date().toISOString(),
      collaboratorId: identifiedCol.id,
      epiId: selectedEpiId,
      reason,
      notes: mode === 'MANUAL_SEARCH' ? 'Identificação Manual' : 'Biometria Facial',
      responsibleEmail: 'admin@nr06.com',
      photo: capturedPhoto || undefined,
      verificationResult: { match: true, confidence: mode === 'MANUAL_SEARCH' ? 100 : 98, reason: 'Confirmado' }
    });
  };

  return (
    <div className="max-w-4xl mx-auto mb-20 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-2xl mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Scan className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">Checkout <span className="text-blue-500">Biométrico</span></h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{statusMsg}</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LADO ESQUERDO: CAMERA OU LISTA MANUAL */}
        <div className="md:col-span-7">
          <div className="relative aspect-square bg-slate-950 rounded-[3rem] border-2 border-slate-800 overflow-hidden flex flex-col shadow-inner">
            
            {mode === 'SCANNING' && (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="scanner-overlay">
                   <div className="scanner-line"></div>
                   <div className="absolute inset-0 border-[60px] border-slate-950/60 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-full border-2 border-dashed border-blue-500/50 rounded-full"></div>
                   </div>
                </div>
                
                {!isProcessing && (
                  <div className="absolute bottom-6 w-full flex justify-center gap-4 px-6">
                     <button 
                      onClick={() => setMode('MANUAL_SEARCH')}
                      className="flex-1 bg-slate-900/80 backdrop-blur-md text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-700 hover:bg-slate-800"
                    >
                      <Search size={16} className="inline mr-2 mb-0.5" /> Buscar Manual
                    </button>
                    <button 
                      onClick={handleIdentification}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-500"
                    >
                      <Camera size={16} className="inline mr-2 mb-0.5" /> Identificar
                    </button>
                  </div>
                )}
              </>
            )}

            {mode === 'MANUAL_SEARCH' && (
              <div className="w-full h-full bg-slate-950 p-6 flex flex-col">
                 <div className="relative mb-4">
                    <Search className="absolute left-4 top-4 text-slate-500" size={18} />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Nome, Matrícula ou Empresa..." 
                      className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {filteredCollaborators.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => selectManual(c)}
                        className="w-full p-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all text-left group"
                      >
                         <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0">
                           {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2 text-slate-600" />}
                         </div>
                         <div className="min-w-0">
                            <p className="text-white text-xs font-black uppercase truncate group-hover:text-blue-400">{c.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{c.branch} • {c.matricula || 'S/ Matrícula'}</p>
                         </div>
                         <ChevronRight size={16} className="ml-auto text-slate-700 group-hover:text-white" />
                      </button>
                    ))}
                    {filteredCollaborators.length === 0 && (
                      <p className="text-center text-slate-600 text-[10px] font-black uppercase mt-10">Nenhum colaborador encontrado</p>
                    )}
                 </div>
                 <button 
                    onClick={() => setMode('SCANNING')}
                    className="mt-4 w-full py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white"
                  >
                    Voltar para Câmera
                  </button>
              </div>
            )}

            {(mode === 'IDENTIFIED' || mode === 'ERROR') && (
              <div className="w-full h-full relative animate-in fade-in">
                {capturedPhoto ? (
                   <img src={capturedPhoto} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700"><User size={64} /></div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                
                {mode === 'IDENTIFIED' && identifiedCol && (
                  <div className="absolute bottom-8 left-8 flex items-center gap-4 right-8">
                    <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-2xl shrink-0">
                      <img src={identifiedCol.photo} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left min-w-0">
                       <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Colaborador Localizado</p>
                       <p className="text-lg font-black text-white uppercase leading-none truncate">{identifiedCol.name}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                          <Building2 size={10} /> {identifiedCol.branch}
                       </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Consultando...</p>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div className="md:col-span-5 space-y-6">
          
          {mode === 'IDENTIFIED' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-right-4">
               
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Dados Confirmados
                  </div>
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
                     <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Empresa / Unidade</p>
                       <p className="text-sm font-black text-white flex items-center gap-2">
                         <Building2 size={14} className="text-blue-500" />
                         {identifiedCol?.branch}
                       </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900">
                        <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Matrícula</p>
                           <p className="text-xs font-bold text-slate-300">{identifiedCol?.matricula || '---'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Cargo</p>
                           <p className="text-xs font-bold text-slate-300">{identifiedCol?.role}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Equipamento para Retirada</label>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo da Entrega</label>
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

               <div className="pt-6 flex gap-3">
                  <button 
                    onClick={() => { setMode('SCANNING'); setIdentifiedCol(null); setCapturedPhoto(null); }} 
                    className="flex-1 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={!selectedEpiId}
                    className="flex-[2] py-4 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                  >
                    Confirmar
                  </button>
               </div>
            </div>
          ) : mode === 'ERROR' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-center space-y-6 animate-in zoom-in-95">
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border-2 border-red-500/20">
                  <AlertCircle size={40} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Não Identificado</h3>
                  <p className="text-xs text-slate-500 font-bold mt-2 uppercase">{statusMsg}</p>
               </div>
               <div className="space-y-3">
                  <button 
                    onClick={() => { setMode('SCANNING'); setStatusMsg('Aguardando...'); }} 
                    className="w-full py-4 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-slate-200"
                  >
                    Tentar Câmera Novamente
                  </button>
                  <button 
                    onClick={() => setMode('MANUAL_SEARCH')}
                    className="w-full py-4 bg-slate-950 border border-slate-800 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-slate-800"
                  >
                    Buscar Pelo Nome
                  </button>
               </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 h-full border-dashed opacity-50">
               <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800 border border-slate-800">
                  <User size={32} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aguardando Colaborador</p>
                  <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed uppercase">Utilize a câmera ou a busca manual.</p>
               </div>
            </div>
          )}

        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
