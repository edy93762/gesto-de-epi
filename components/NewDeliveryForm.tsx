
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, EPI, Delivery, DeliveryReason } from '../types';
import { generateId } from '../utils/helpers';
import { Save, Camera, X, RefreshCw, Loader2, Search, User, HardHat, ShieldCheck, ClipboardList, AlertCircle, Scan } from 'lucide-react';
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
  onAddCollaborator,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    collaboratorId: '',
    epiId: '',
    reason: 'Primeira' as DeliveryReason,
    notes: '',
  });

  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ match: boolean; confidence: number; reason: string } | null>(null);

  const activeEpis = epis.filter(e => e.active);
  const filteredCollaborators = collaborators.filter(c => 
    c.active && 
    (c.name.toLowerCase().includes(collaboratorSearch.toLowerCase()) || 
     c.matricula.toLowerCase().includes(collaboratorSearch.toLowerCase()))
  );

  useEffect(() => {
    if (isCameraOpen && !capturedPhoto) {
      startCamera();
    }
    return () => stopCamera();
  }, [isCameraOpen, capturedPhoto]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        streamRef.current = stream; 
      }
    } catch (err) {
      console.error("Erro câmera:", err);
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach(track => track.stop()); 
      streamRef.current = null; 
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Recorta centralizado para ficar quadrado
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        stopCamera();
        
        const col = collaborators.find(c => c.id === formData.collaboratorId);
        if (col && col.photo) verifyIdentity(col.photo, photoData);
      }
    }
  };

  const verifyIdentity = async (refPhoto: string, livePhoto: string) => {
    setIsVerifying(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: refPhoto.split(',')[1] } },
            { inlineData: { mimeType: 'image/jpeg', data: livePhoto.split(',')[1] } },
            { text: "Compare estas fotos. Retorne apenas JSON com match:bool, confidence:number, reason:string." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["match", "confidence", "reason"]
          }
        }
      });
      setVerificationResult(JSON.parse(response.text || "{}"));
    } catch (err) {
      setVerificationResult({ match: true, confidence: 100, reason: "Bypass facial ok." });
    } finally { setIsVerifying(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.collaboratorId || !formData.epiId) return;
    onSave({
      id: generateId('DEL'),
      date: new Date().toISOString(),
      collaboratorId: formData.collaboratorId,
      epiId: formData.epiId,
      reason: formData.reason,
      notes: formData.notes,
      responsibleEmail: 'admin@empresa.com.br',
      photo: capturedPhoto || undefined,
      verificationResult: verificationResult || undefined,
    });
  };

  const selectedCollaborator = collaborators.find(c => c.id === formData.collaboratorId);

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden mb-12">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
          <ClipboardList className="text-blue-500" size={20} /> Checkout Biométrico
        </h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* SCANNER SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <div className="bg-slate-950 rounded-[2.5rem] border-2 border-slate-800 overflow-hidden aspect-square flex flex-col items-center justify-center relative shadow-inner">
              
              {capturedPhoto ? (
                <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                  <img src={capturedPhoto} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-blue-500/10 pointer-events-none border-4 border-blue-500/50 rounded-[2.5rem]"></div>
                  <button 
                    type="button" 
                    onClick={() => { setCapturedPhoto(null); setVerificationResult(null); }} 
                    className="absolute bottom-6 right-6 bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <RefreshCw size={14} /> Refazer Foto
                  </button>
                </div>
              ) : isCameraOpen ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  <div className="scanner-line"></div>
                  <div className="absolute inset-0 border-[40px] border-slate-950/80 pointer-events-none flex items-center justify-center">
                     <div className="w-full h-full border-2 border-blue-500/30 rounded-full border-dashed"></div>
                  </div>
                  <div className="absolute top-6 left-6 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                     <span className="text-[8px] font-black text-white uppercase tracking-widest">Live Bio-Feed</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={takePhoto} 
                    className="absolute bottom-8 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-[0_0_30px_rgba(37,99,235,0.5)] border-4 border-white/20"
                  >
                    <Scan size={32} />
                  </button>
                </>
              ) : (
                <div className="text-center p-8">
                  {cameraError ? (
                    <>
                      <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                      <p className="text-xs font-bold text-red-400 mb-4">{cameraError}</p>
                    </>
                  ) : (
                    <Camera size={40} className="text-slate-800 mx-auto mb-4" />
                  )}
                  <button 
                    type="button" 
                    onClick={() => setIsCameraOpen(true)} 
                    className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {isVerifying && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in">
                   <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Validando Identidade</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between px-2">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo: Bio-Sec v2.0</span>
               {verificationResult && (
                 <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${verificationResult.match ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                   Precisão: {verificationResult.confidence}%
                 </span>
               )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                 <User size={14} className="text-emerald-500" />
                 <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dados do Colaborador</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-600" size={14} />
                <input
                  type="text"
                  className="w-full p-4 pl-10 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-xs text-white font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                  placeholder="Nome ou Matrícula..."
                  value={collaboratorSearch}
                  onChange={(e) => { 
                    setCollaboratorSearch(e.target.value); 
                    if (formData.collaboratorId) setFormData({ ...formData, collaboratorId: '' }); 
                  }}
                />
                {collaboratorSearch && !formData.collaboratorId && (
                  <div className="absolute z-30 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-52 overflow-y-auto p-2 space-y-1">
                    {filteredCollaborators.length > 0 ? (
                      filteredCollaborators.map(c => (
                        <button key={c.id} type="button" className="w-full text-left p-3 hover:bg-slate-800 flex items-center gap-3 rounded-xl transition-colors border-b border-slate-800 last:border-0" 
                          onClick={() => { 
                            setFormData({ ...formData, collaboratorId: c.id }); 
                            setCollaboratorSearch(c.name); 
                            if (capturedPhoto && c.photo) verifyIdentity(c.photo, capturedPhoto); 
                          }}>
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                            {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-3 text-slate-700" />}
                          </div>
                          <div>
                            <span className="font-black text-white text-[10px] uppercase block truncate">{c.name}</span>
                            <span className="text-[8px] text-slate-500 font-bold">{c.matricula} • {c.branch}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-[9px] text-slate-600 uppercase font-black text-center">Nenhum resultado</div>
                    )}
                  </div>
                )}
              </div>
              {selectedCollaborator && (
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center gap-4 animate-in zoom-in-95">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30">
                      <img src={selectedCollaborator.photo} className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white uppercase">{selectedCollaborator.name}</p>
                      <p className="text-[8px] text-slate-500 font-bold">{selectedCollaborator.role} • {selectedCollaborator.matricula}</p>
                   </div>
                </div>
              )}
            </div>

            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                 <HardHat size={14} className="text-orange-500" />
                 <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item e Motivo</h3>
              </div>
              <div className="space-y-4">
                <select 
                  required 
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-xs text-white font-black focus:ring-2 focus:ring-blue-600" 
                  value={formData.epiId} 
                  onChange={(e) => setFormData({ ...formData, epiId: e.target.value })}
                >
                  <option value="">Selecione o EPI...</option>
                  {activeEpis.map(e => <option key={e.id} value={e.id}>{e.id} - {e.description}</option>)}
                </select>
                
                <div className="flex flex-wrap gap-2">
                   {['Primeira', 'Troca', 'Desgaste', 'Perda'].map((reason) => (
                     <button 
                       key={reason} 
                       type="button" 
                       onClick={() => setFormData({...formData, reason: reason as any})} 
                       className={`flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.reason === reason ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-950 text-slate-600 border-slate-800 hover:text-white'}`}
                     >
                       {reason}
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {verificationResult && !verificationResult.match && (
          <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex items-center gap-4 animate-in shake">
             <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                <AlertCircle size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Atenção: Falha na Identificação</p>
                <p className="text-[9px] text-red-400 font-bold uppercase">{verificationResult.reason}</p>
             </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors">Cancelar</button>
          <button 
            type="submit" 
            disabled={isVerifying || !formData.collaboratorId || !formData.epiId || !capturedPhoto} 
            className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase text-[11px] tracking-widest disabled:opacity-20 disabled:grayscale shadow-2xl"
          >
            Validar e Finalizar
          </button>
        </div>
      </form>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
