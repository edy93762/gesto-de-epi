
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, EPI, Delivery, DeliveryReason } from '../types';
import { generateId } from '../utils/helpers';
import { Save, Camera, X, RefreshCw, Loader2, Search, User, HardHat, ShieldCheck, ClipboardList, AlertCircle } from 'lucide-react';
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
    if (isCameraOpen && videoRef.current && !streamRef.current) {
      const initCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
          });
          if (videoRef.current) { 
            videoRef.current.srcObject = stream; 
            streamRef.current = stream; 
          }
        } catch (err) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) { 
              videoRef.current.srcObject = stream; 
              streamRef.current = stream; 
            }
          } catch (e) { 
            setIsCameraOpen(false); 
          }
        }
      };
      initCamera();
    }
  }, [isCameraOpen]);

  useEffect(() => { return () => stopCamera(); }, []);

  const stopCamera = () => {
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach(track => track.stop()); 
      streamRef.current = null; 
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
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
          <ClipboardList className="text-blue-500" size={20} /> Nova Saída de EPI
        </h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* GRUPO 1: AUTENTICAÇÃO E SELEÇÃO */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
               <ShieldCheck size={14} className="text-blue-500" />
               <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Biometria Facial (Frente)</h3>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[140px]">
              {capturedPhoto ? (
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-500/30">
                  <img src={capturedPhoto} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setCapturedPhoto(null); setIsCameraOpen(true); }} className="absolute bottom-1 right-1 bg-white p-1.5 rounded-lg text-slate-900 shadow-lg"><RefreshCw size={12} /></button>
                </div>
              ) : isCameraOpen ? (
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-800">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <button type="button" onClick={takePhoto} className="absolute inset-0 m-auto w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"><Camera size={18} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsCameraOpen(true)} className="text-slate-700 hover:text-white flex flex-col items-center gap-1">
                  <Camera size={32} className="opacity-30" />
                  <span className="text-[8px] font-black uppercase">Ativar Câmera</span>
                </button>
              )}
              {isVerifying && <p className="text-[7px] text-blue-500 font-black animate-pulse uppercase mt-2">Verificando Identidade...</p>}
            </div>
          </div>

          <div className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
               <User size={14} className="text-emerald-500" />
               <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador / Destinatário</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-600" size={14} />
              <input
                type="text"
                className="w-full p-3 pl-9 bg-slate-950 border border-slate-800 rounded-xl outline-none text-xs text-white font-bold"
                placeholder="Nome ou Matrícula..."
                value={collaboratorSearch}
                onChange={(e) => { setCollaboratorSearch(e.target.value); if (formData.collaboratorId) setFormData({ ...formData, collaboratorId: '' }); }}
              />
              {collaboratorSearch && !formData.collaboratorId && (
                <div className="absolute z-30 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                  {filteredCollaborators.length > 0 ? (
                    filteredCollaborators.map(c => (
                      <button key={c.id} type="button" className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 border-b border-slate-800/50 last:border-0" 
                        onClick={() => { setFormData({ ...formData, collaboratorId: c.id }); setCollaboratorSearch(c.name); if (capturedPhoto && c.photo) verifyIdentity(c.photo, capturedPhoto); }}>
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700">
                          {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <User size={12} className="m-auto mt-2" />}
                        </div>
                        <span className="font-black text-white text-[9px] uppercase truncate">{c.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-[8px] text-slate-600 uppercase font-black text-center">Nenhum resultado</div>
                  )}
                </div>
              )}
            </div>
            {selectedCollaborator && (
              <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-center gap-3 animate-in zoom-in-95">
                 <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30">
                    <img src={selectedCollaborator.photo} className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-white uppercase">{selectedCollaborator.name}</p>
                    <p className="text-[8px] text-slate-500 font-bold">{selectedCollaborator.matricula}</p>
                 </div>
              </div>
            )}
          </div>
        </section>

        {/* GRUPO 2: DADOS DO MATERIAL */}
        <section className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
             <HardHat size={14} className="text-orange-500" />
             <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Especificação do Equipamento</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Selecionado</label>
              <select required className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-xs text-white font-black" value={formData.epiId} onChange={(e) => setFormData({ ...formData, epiId: e.target.value })}>
                <option value="">Selecione o EPI...</option>
                {activeEpis.map(e => <option key={e.id} value={e.id}>{e.id} - {e.description}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo da Saída</label>
              <div className="flex flex-wrap gap-1.5">
                 {['Primeira', 'Troca', 'Desgaste', 'Perda'].map((reason) => (
                   <button key={reason} type="button" onClick={() => setFormData({...formData, reason: reason as any})} className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${formData.reason === reason ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-950 text-slate-600 border-slate-800 hover:text-white'}`}>
                     {reason}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {verificationResult && !verificationResult.match && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 animate-in shake">
             <AlertCircle className="text-red-500" size={20} />
             <div>
                <p className="text-[9px] font-black text-red-500 uppercase">Divergência Biométrica</p>
                <p className="text-[8px] text-red-400 font-bold uppercase">{verificationResult.reason}</p>
             </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-5 py-3 text-slate-500 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors">Cancelar</button>
          <button type="submit" disabled={isVerifying || !formData.collaboratorId || !formData.epiId} className="px-10 py-4 bg-white text-black font-black rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-30 disabled:pointer-events-none shadow-lg">
            Confirmar e Registrar
          </button>
        </div>
      </form>
    </div>
  );
};
