
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
  Camera
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
  const [mode, setMode] = useState<'SCANNING' | 'IDENTIFIED' | 'ERROR'>('SCANNING');
  const [identifiedCol, setIdentifiedCol] = useState<Collaborator | null>(null);
  const [selectedEpiId, setSelectedEpiId] = useState('');
  const [reason, setReason] = useState<DeliveryReason>('Primeira');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Aguardando Detecção...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        video: { facingMode: 'user', width: 640, height: 640 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setMode('ERROR');
      setStatusMsg("Erro ao acessar câmera. Verifique permissões.");
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
      setStatusMsg("Nenhum colaborador cadastrado para comparar.");
      return;
    }
    
    setIsProcessing(true);
    setStatusMsg("Capturando imagem...");
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, 640, 640);
    const livePhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(livePhotoBase64);

    setStatusMsg("Consultando Banco de Dados Facial...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Criamos um mapa de candidatos com fotos para o Gemini
      const candidates = collaborators
        .filter(c => c.active && c.photo)
        .map(c => ({
          id: c.id,
          name: c.name,
          photo: c.photo!.split(',')[1] // Apenas o base64
        }));

      if (candidates.length === 0) throw new Error("Sem fotos de referência");

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: livePhotoBase64.split(',')[1] } },
            { text: `Você é um sistema de reconhecimento biométrico. Abaixo estão as fotos dos colaboradores cadastrados em formato JSON (id e base64). Identifique quem é a pessoa na foto capturada. 
              Banco de Dados: ${JSON.stringify(candidates.map(c => ({ id: c.id, name: c.name })))}
              
              Analise os traços faciais. Retorne APENAS um JSON com:
              { "matchId": "ID_DO_COLABORADOR", "confidence": 0-100, "reason": "breve justificativa" }
              Se não encontrar ninguém com mais de 70% de confiança, retorne matchId: null.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchId: { type: Type.STRING, nullable: true },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["confidence", "reason"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      if (result.matchId) {
        const found = collaborators.find(c => c.id === result.matchId);
        if (found) {
          setIdentifiedCol(found);
          setMode('IDENTIFIED');
          setStatusMsg("Identidade Confirmada!");
        } else {
          setMode('ERROR');
          setStatusMsg("Colaborador identificado não encontrado no sistema.");
        }
      } else {
        setMode('ERROR');
        setStatusMsg("Rosto não reconhecido no banco de dados.");
      }
    } catch (err) {
      console.error(err);
      setMode('ERROR');
      setStatusMsg("Falha crítica no sistema de reconhecimento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!identifiedCol || !selectedEpiId) return;
    onSave({
      id: generateId('REC'),
      date: new Date().toISOString(),
      collaboratorId: identifiedCol.id,
      epiId: selectedEpiId,
      reason,
      notes: 'Identificado via Biometria Automática',
      responsibleEmail: 'admin@nr06.com',
      photo: capturedPhoto || undefined,
      verificationResult: { match: true, confidence: 98, reason: 'Sucesso' }
    });
  };

  return (
    <div className="max-w-4xl mx-auto mb-20 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Form */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Scan className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Checkout <span className="text-blue-500">Biométrico</span></h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{statusMsg}</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo: Scanner / Foto */}
        <div className="md:col-span-7">
          <div className="relative aspect-square bg-slate-950 rounded-[3rem] border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            
            {mode === 'SCANNING' ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="scanner-overlay">
                   <div className="scanner-line"></div>
                   <div className="absolute inset-0 border-[60px] border-slate-950/60 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-full border-2 border-dashed border-blue-500/50 rounded-full"></div>
                   </div>
                </div>
                
                {!isProcessing && (
                  <button 
                    onClick={handleIdentification}
                    className="absolute bottom-10 w-24 h-24 bg-blue-600 rounded-full flex flex-col items-center justify-center text-white shadow-[0_0_40px_rgba(59,130,246,0.6)] border-4 border-white/20 active:scale-90 transition-all group"
                  >
                    <Camera size={32} />
                    <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Identificar</span>
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full relative animate-in fade-in">
                <img src={capturedPhoto!} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                {mode === 'IDENTIFIED' && (
                  <div className="absolute bottom-8 left-8 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-2xl">
                      <img src={identifiedCol?.photo} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                       <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sucesso</p>
                       <p className="text-lg font-black text-white uppercase leading-none">{identifiedCol?.name}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Cruzando Dados Faciais...</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Formulário de Item */}
        <div className="md:col-span-5 space-y-6">
          
          {mode === 'IDENTIFIED' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-right-4">
               
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Colaborador Validado
                  </div>
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                     <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Matrícula</p>
                     <p className="text-sm font-black text-white">{identifiedCol?.matricula}</p>
                     <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase">{identifiedCol?.branch} • {identifiedCol?.role}</p>
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

               <div className="pt-6 flex gap-3">
                  <button 
                    onClick={() => { setMode('SCANNING'); setIdentifiedCol(null); }} 
                    className="flex-1 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
                  >
                    Resetar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={!selectedEpiId}
                    className="flex-[2] py-4 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                  >
                    Finalizar Entrega
                  </button>
               </div>
            </div>
          ) : mode === 'ERROR' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-center space-y-6 animate-in zoom-in-95">
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border-2 border-red-500/20">
                  <AlertCircle size={40} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Erro na Identificação</h3>
                  <p className="text-xs text-slate-500 font-bold mt-2 uppercase">{statusMsg}</p>
               </div>
               <button 
                onClick={() => { setMode('SCANNING'); setStatusMsg('Aguardando Detecção...'); }} 
                className="w-full py-5 bg-white text-black font-black rounded-3xl text-[11px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
               >
                 Tentar Novamente
               </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 h-full border-dashed">
               <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-800 border border-slate-800">
                  <User size={32} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Passo Único</p>
                  <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed uppercase">O sistema identificará o colaborador automaticamente através da biometria facial.</p>
               </div>
            </div>
          )}

        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
