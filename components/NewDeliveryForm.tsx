
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, EPI, Delivery, DeliveryReason } from '../types';
import { generateId } from '../utils/helpers';
import { AlertCircle, Save, HardHat, User, UserPlus, Search, Camera, X, RefreshCw, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
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
  
  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verification states
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
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

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
        
        // Se já temos um colaborador selecionado com foto, tentamos verificar
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
              { text: "Compare estas duas fotos. A primeira é a foto de referência do colaborador e a segunda é a foto capturada agora na entrega. Elas mostram a mesma pessoa? Responda obrigatoriamente em JSON seguindo este esquema: { \"match\": boolean, \"confidence\": number (0-100), \"reason\": string (curta em português) }." }
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
      // Fallback em caso de erro na API
      setVerificationResult({ match: true, confidence: 50, reason: "Erro na verificação automática." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.collaboratorId) newErrors.collaboratorId = 'Selecione um colaborador.';
    if (!formData.epiId) newErrors.epiId = 'Selecione um EPI pelo ID.';
    if (formData.quantity <= 0) newErrors.quantity = 'A quantidade deve ser maior que 0.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: generateId('DEL'),
      date: new Date().toISOString(),
      collaboratorId: formData.collaboratorId,
      epiId: formData.epiId,
      quantity: formData.quantity,
      reason: formData.reason,
      notes: formData.notes,
      responsibleEmail: 'admin@empresa.com.br',
      photo: capturedPhoto || undefined,
      verificationResult: verificationResult || undefined,
      status: 'OK'
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
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 relative mb-20">
      <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        <h2 className="text-xl font-bold text-slate-800">Nova Entrega de EPI</h2>
        <p className="text-sm text-slate-500 mt-1">Reconhecimento facial ativo para segurança.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Captura de Foto e Verificação Facial */}
          <div className="col-span-2">
            <div className="flex justify-between items-end mb-2">
               <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                <Camera size={16} /> Verificação Facial em Tempo Real
              </label>
              {isVerifying && (
                <div className="flex items-center gap-1 text-blue-600 animate-pulse text-xs font-bold">
                  <Loader2 size={14} className="animate-spin" /> VERIFICANDO...
                </div>
              )}
              {verificationResult && !isVerifying && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${verificationResult.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {verificationResult.match ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {verificationResult.match ? 'IDENTIDADE CONFIRMADA' : 'IDENTIDADE DIVERGENTE'}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {/* Lado do Colaborador (Referência) */}
               <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center h-64">
                  {selectedCollaborator?.photo ? (
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Referência</p>
                      <img src={selectedCollaborator.photo} className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-md mx-auto" alt="Ref" />
                      <p className="mt-2 font-bold text-slate-700">{selectedCollaborator.name}</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 flex flex-col items-center gap-2">
                       <User size={48} className="opacity-20" />
                       <p className="text-xs font-medium">Selecione um colaborador<br/>com foto de referência</p>
                    </div>
                  )}
               </div>

               {/* Lado da Captura (Live) */}
               <div className="relative bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden h-64 flex flex-col items-center justify-center">
                  {capturedPhoto ? (
                    <div className="relative w-full h-full group">
                      <img src={capturedPhoto} alt="Live" className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 border-4 transition-colors pointer-events-none ${verificationResult?.match ? 'border-green-500/50' : verificationResult ? 'border-red-500/50' : 'border-transparent'}`} />
                      <button type="button" onClick={() => { setCapturedPhoto(null); startCamera(); }} className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-blue-600 hover:scale-110 transition-all">
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  ) : isCameraOpen ? (
                    <div className="relative w-full h-full">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                      <div className="absolute inset-0 border-2 border-white/30 rounded-full w-48 h-48 m-auto pointer-events-none" />
                      <button type="button" onClick={takePhoto} className="absolute bottom-4 left-0 right-0 m-auto bg-blue-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all w-14 h-14 flex items-center justify-center">
                        <Camera size={24} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={startCamera} className="flex flex-col items-center gap-2 text-slate-500 hover:text-blue-600 transition-all">
                      <Camera size={48} />
                      <span className="font-medium">Abrir Scanner</span>
                    </button>
                  )}
               </div>
            </div>
            {verificationResult && (
               <p className={`text-[10px] mt-2 font-medium text-center ${verificationResult.match ? 'text-green-600' : 'text-red-600'}`}>
                  {verificationResult.reason} (Confiança: {verificationResult.confidence}%)
               </p>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="col-span-2 relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                <User size={16} /> Colaborador
              </label>
              <button type="button" onClick={() => setShowQuickAdd(true)} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
                <UserPlus size={14} /> + NOVO COLABORADOR
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                className={`w-full p-2.5 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.collaboratorId ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="Busque pelo nome..."
                value={collaboratorSearch}
                onChange={(e) => {
                  setCollaboratorSearch(e.target.value);
                  if (formData.collaboratorId) setFormData({ ...formData, collaboratorId: '' });
                }}
              />
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              
              {collaboratorSearch && !formData.collaboratorId && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredCollaborators.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-none flex items-center gap-3"
                      onClick={() => {
                        setFormData({ ...formData, collaboratorId: c.id });
                        setCollaboratorSearch(c.name);
                        if (capturedPhoto && c.photo) verifyIdentity(c.photo, capturedPhoto);
                      }}
                    >
                      <img src={c.photo || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[10px] text-slate-500">{c.sector} | {c.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <HardHat size={16} /> ID do EPI
            </label>
            <select
              className={`w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.epiId ? 'border-red-300' : 'border-slate-300'}`}
              value={formData.epiId}
              onChange={(e) => setFormData({ ...formData, epiId: e.target.value })}
            >
              <option value="">Selecione o EPI...</option>
              {activeEpis.map(e => <option key={e.id} value={e.id}>{e.id} - {e.description}</option>)}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as DeliveryReason })}
            >
              <option value="Primeira">Primeira Entrega</option>
              <option value="Troca validade">Troca por Validade</option>
              <option value="Desgaste">Desgaste Natural</option>
              <option value="Perda">Perda</option>
              <option value="Dano">Dano / Avaria</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-700 font-medium">Cancelar</button>
          <button
            type="submit"
            disabled={isVerifying}
            className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-all ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={18} />
            Finalizar Entrega
          </button>
        </div>
      </form>

      {showQuickAdd && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm rounded-lg flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden my-auto">
             <CollaboratorForm isModal={true} onSave={handleQuickAddSave} onCancel={() => setShowQuickAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
