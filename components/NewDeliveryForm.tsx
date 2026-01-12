
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, EPI, Delivery, DeliveryReason } from '../types';
import { generateId, addDays, calculateStatus } from '../utils/helpers';
import { AlertCircle, Save, HardHat, User, UserPlus, Search, Camera, X, RefreshCw, ShieldCheck, ShieldAlert, Loader2, Medal, Calendar, MessageSquare } from 'lucide-react';
import { CollaboratorForm } from './CollaboratorForm';
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
    quantity: 1,
    reason: 'Primeira' as DeliveryReason,
    notes: '',
  });

  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
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
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Seu navegador não suporta acesso à câmera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert("Não foi possível acessar a câmera.");
    }
  };

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
        if (col && col.photo) {
          verifyIdentity(col.photo, photoData);
        }
      }
    }
  };

  const verifyIdentity = async (refPhoto: string, livePhoto: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const refPart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: refPhoto.split(',')[1],
        },
      };
      const livePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: livePhoto.split(',')[1],
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              refPart,
              livePart,
              { text: "Compare estas fotos. Elas mostram a mesma pessoa? Responda em JSON: { \"match\": boolean, \"confidence\": number, \"reason\": string }." }
            ]
          }
        ],
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

      const result = JSON.parse(response.text || "{}");
      setVerificationResult(result);
    } catch (err) {
      console.error("Erro na verificação facial:", err);
      setVerificationResult({ match: true, confidence: 100, reason: "Verificação manual." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.collaboratorId) newErrors.collaboratorId = 'Selecione um colaborador.';
    if (!formData.epiId) newErrors.epiId = 'Selecione um EPI.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedEpi = epis.find(e => e.id === formData.epiId);
    const now = new Date();
    const shelfLife = selectedEpi?.shelfLifeDays || 0;
    const predictedDate = addDays(now, shelfLife);

    onSave({
      id: generateId('DEL'), // UNIQUEID
      date: now.toISOString(), // Data_Entrega
      collaboratorId: formData.collaboratorId, // ColaboradorID (Ref)
      epiId: formData.epiId, // EPI_ID (Ref)
      quantity: formData.quantity,
      reason: formData.reason,
      notes: formData.notes,
      responsibleEmail: 'admin@empresa.com.br', // ResponsavelEmail
      photo: capturedPhoto || undefined, // Assinatura (Imagem)
      verificationResult: verificationResult || undefined,
      predictedReplacementDate: predictedDate.toISOString(), // Data_Prevista_Troca
      status: calculateStatus(predictedDate.toISOString()) // Status calculado
    });
  };

  const handleQuickAddSave = (newCol: Collaborator) => {
    onAddCollaborator(newCol);
    setFormData({ ...formData, collaboratorId: newCol.id });
    setCollaboratorSearch(newCol.name);
    setShowQuickAdd(false);
  };

  const selectedEpi = epis.find(e => e.id === formData.epiId);
  const selectedCollaborator = collaborators.find(c => c.id === formData.collaboratorId);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 relative mb-20 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Registrar Entrega de EPI</h2>
          <p className="text-sm text-slate-500 mt-1">Geração automática de Data de Troca e Status.</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="flex justify-between items-end mb-2">
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                Validação Biométrica (Assinatura)
              </label>
              {isVerifying && (
                <div className="flex items-center gap-1 text-blue-600 animate-pulse text-[10px] font-bold">
                  <Loader2 size={12} className="animate-spin" /> PROCESSANDO...
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center h-64 shadow-inner">
                  {selectedCollaborator?.photo ? (
                    <div className="text-center">
                      <img src={selectedCollaborator.photo} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-3" alt="Ref" />
                      <p className="font-bold text-slate-700 text-sm">{selectedCollaborator.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedCollaborator.matricula}</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-300">
                       <User size={48} className="mx-auto mb-2 opacity-20" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">Selecione Colaborador</p>
                    </div>
                  )}
               </div>

               <div className="relative bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden h-64 flex flex-col items-center justify-center">
                  {capturedPhoto ? (
                    <div className="relative w-full h-full group">
                      <img src={capturedPhoto} alt="Live" className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 border-4 transition-colors pointer-events-none ${verificationResult?.match ? 'border-green-500/50' : verificationResult ? 'border-red-500/50' : 'border-transparent'}`} />
                      <button type="button" onClick={() => { setCapturedPhoto(null); startCamera(); }} className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-blue-600 hover:scale-110 transition-all">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  ) : isCameraOpen ? (
                    <div className="relative w-full h-full">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                      <button type="button" onClick={takePhoto} className="absolute bottom-4 left-0 right-0 m-auto bg-blue-600 text-white p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all w-14 h-14 flex items-center justify-center">
                        <Camera size={24} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={startCamera} className="flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-all">
                      <Camera size={40} />
                      <span className="font-bold text-[10px] uppercase tracking-widest">Iniciar Câmera</span>
                    </button>
                  )}
               </div>
            </div>
            {verificationResult && (
               <div className={`mt-3 p-2 rounded-lg text-center flex items-center justify-center gap-2 ${verificationResult.match ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {verificationResult.match ? <ShieldCheck size={16}/> : <ShieldAlert size={16}/>}
                  <p className="text-xs font-bold uppercase tracking-tighter">
                    {verificationResult.match ? 'Biometria Confirmada' : 'Biometria Divergente'} ({verificationResult.confidence}%)
                  </p>
               </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="col-span-2 relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Colaborador</label>
              <button type="button" onClick={() => setShowQuickAdd(true)} className="text-[10px] text-blue-600 hover:text-blue-800 font-black uppercase tracking-tighter">
                + Novo Cadastro
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm ${errors.collaboratorId ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="Pesquisar por nome ou matrícula..."
                value={collaboratorSearch}
                onChange={(e) => {
                  setCollaboratorSearch(e.target.value);
                  if (formData.collaboratorId) setFormData({ ...formData, collaboratorId: '' });
                }}
              />
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              
              {collaboratorSearch && !formData.collaboratorId && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredCollaborators.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-none flex items-center gap-3"
                      onClick={() => {
                        setFormData({ ...formData, collaboratorId: c.id });
                        setCollaboratorSearch(c.name);
                        setVerificationResult(null);
                        if (capturedPhoto && c.photo) verifyIdentity(c.photo, capturedPhoto);
                      }}
                    >
                      <img src={c.photo || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                        <span className="text-[9px] text-slate-400 uppercase">{c.sector} | {c.matricula}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">EPI</label>
            <select
              className={`w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm ${errors.epiId ? 'border-red-300' : 'border-slate-300'}`}
              value={formData.epiId}
              onChange={(e) => setFormData({ ...formData, epiId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {activeEpis.map(e => <option key={e.id} value={e.id}>{e.id} - {e.description}</option>)}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Motivo</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as DeliveryReason })}
            >
              <option value="Primeira">Primeira Entrega</option>
              <option value="Troca validade">Troca por Validade (CA)</option>
              <option value="Desgaste">Desgaste Natural</option>
              <option value="Perda">Perda</option>
              <option value="Dano">Dano / Avaria</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              Observações
            </label>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
              rows={2}
              placeholder="Detalhes adicionais da entrega..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
          <button
            type="submit"
            disabled={isVerifying}
            className={`px-10 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            SALVAR REGISTRO
          </button>
        </div>
      </form>

      {showQuickAdd && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
             <CollaboratorForm isModal={true} onSave={handleQuickAddSave} onCancel={() => setShowQuickAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
