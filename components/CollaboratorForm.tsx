
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator } from '../types';
import { generateId } from '../utils/helpers';
import { Save, UserPlus, X, Camera, RefreshCw, MapPin } from 'lucide-react';

interface CollaboratorFormProps {
  onSave: (collaborator: Collaborator) => void;
  onCancel: () => void;
  isModal?: boolean;
}

export const CollaboratorForm: React.FC<CollaboratorFormProps> = ({ onSave, onCancel, isModal = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    matricula: '',
    sector: '',
    role: '',
    branch: '',
    managerEmail: '',
  });
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
          console.warn("Câmera frontal falhou, tentando fallback:", err);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              streamRef.current = stream;
            }
          } catch (e) {
            alert("Erro ao abrir câmera. Verifique permissões.");
            setIsCameraOpen(false);
          }
        }
      };
      initCamera();
    }
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = generateId('COL');
    const newCollaborator: Collaborator = {
      ...formData,
      id,
      active: true,
      photo: capturedPhoto || undefined
    };
    onSave(newCollaborator);
  };

  const containerClasses = isModal 
    ? "bg-white p-6 rounded-xl w-full" 
    : "max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden";

  return (
    <div className={containerClasses}>
      {!isModal && (
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <UserPlus className="text-blue-600" size={28} />
              Novo Cadastro
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Biometria Facial Obrigatória</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
            <X size={24} />
          </button>
        </div>
      )}

      {isModal && (
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <UserPlus className="text-blue-600" size={24} />
            Cadastro Rápido
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 p-2">
            <X size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isModal ? "space-y-6" : "p-8 space-y-8"}>
        <div className="flex flex-col items-center">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 w-full text-center">Referência Biométrica</label>
          <div className="relative w-40 h-40 bg-slate-900 rounded-full border-4 border-slate-100 shadow-2xl overflow-hidden flex items-center justify-center group">
             {capturedPhoto ? (
                <div className="relative w-full h-full">
                  <img src={capturedPhoto} alt="Foto referência" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-500/10 border-4 border-emerald-500/30 rounded-full pointer-events-none" />
                  <button type="button" onClick={() => { setCapturedPhoto(null); setIsCameraOpen(true); }} className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg text-blue-600 hover:scale-110 transition-all active:scale-90">
                    <RefreshCw size={16} />
                  </button>
                </div>
             ) : isCameraOpen ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <button type="button" onClick={takePhoto} className="absolute inset-0 m-auto w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl border-4 border-blue-600/20 active:scale-90 transition-all">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </button>
                </div>
             ) : (
                <button type="button" onClick={() => setIsCameraOpen(true)} className="text-white/40 hover:text-white flex flex-col items-center gap-2 transition-colors">
                  <Camera size={32} />
                  <span className="text-[9px] font-black tracking-widest uppercase">Capturar Rosto</span>
                </button>
             )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className={`grid grid-cols-1 ${isModal ? "" : "md:grid-cols-2"} gap-6`}>
          <div className={isModal ? "" : "col-span-2"}>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
            <input
              required
              type="text"
              className="w-full p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João da Silva"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Matrícula</label>
            <input
              type="text"
              className="w-full p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.matricula}
              onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
              placeholder="Ex: 10025"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              Agência
            </label>
            <input
              required
              type="text"
              className="w-full p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="Unidade de Trabalho"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Setor Operacional</label>
            <input
              required
              type="text"
              className="w-full p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              placeholder="Ex: Almoxarifado"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Cargo / Função</label>
            <input
              required
              type="text"
              className="w-full p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Ex: Técnico Segurança"
            />
          </div>
          <div className={isModal ? "" : "col-span-2"}>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail Corporativo Gestor</label>
            <input
              required
              type="email"
              className="w-full p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.managerEmail}
              onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
              placeholder="gestor@empresa.com"
            />
          </div>
        </div>

        <div className={`flex justify-end gap-4 pt-8 ${isModal ? "" : "border-t border-slate-100"}`}>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 flex items-center gap-3 shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest"
          >
            <Save size={18} />
            Finalizar Cadastro
          </button>
        </div>
      </form>
    </div>
  );
};
