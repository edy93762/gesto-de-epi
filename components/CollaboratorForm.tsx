
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator } from '../types';
import { generateId } from '../utils/helpers';
import { Save, UserPlus, X, Camera, RefreshCw, User, Briefcase, Mail } from 'lucide-react';

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
  
  const [isCameraOpen, setIsCameraOpen] = useState(true);
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
          console.error("Erro ao acessar câmera frontal:", err);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) { 
              videoRef.current.srcObject = stream; 
              streamRef.current = stream; 
            }
          } catch (e) { 
            alert("Acesso à câmera negado."); 
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
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: generateId('COL'), active: true, photo: capturedPhoto || undefined });
  };

  return (
    <div className={`bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden ${isModal ? "w-full max-h-[90vh] overflow-y-auto" : "max-w-2xl mx-auto mb-12"}`}>
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <UserPlus className="text-blue-500" size={24} /> Novo Colaborador
          </h2>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors p-2"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* GRUPO 1: BIOMETRIA */}
        <section className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
             <Camera size={14} className="text-blue-500" />
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grupo: Biometria Facial</h3>
          </div>
          <div className="flex justify-center py-2">
            <div className="relative w-32 h-32 bg-slate-950 rounded-full border-2 border-slate-800 overflow-hidden flex items-center justify-center">
               {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setCapturedPhoto(null); setIsCameraOpen(true); }} className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-lg text-slate-900"><RefreshCw size={14} /></button>
                  </div>
               ) : isCameraOpen ? (
                  <div className="relative w-full h-full">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <button type="button" onClick={takePhoto} className="absolute inset-0 m-auto w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95"><Camera size={20} /></button>
                  </div>
               ) : (
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="text-slate-700 hover:text-white flex flex-col items-center gap-1 transition-colors">
                    <Camera size={32} className="opacity-20" />
                    <span className="text-[8px] font-black uppercase">Ativar</span>
                  </button>
               )}
            </div>
          </div>
        </section>

        {/* GRUPO 2: DADOS PESSOAIS */}
        <section className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
             <User size={14} className="text-emerald-500" />
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grupo: Identificação</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-600 outline-none text-white text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Matrícula</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-600 outline-none text-white text-sm" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Agência/Filial</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-600 outline-none text-white text-sm" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} />
            </div>
          </div>
        </section>

        {/* GRUPO 3: DADOS PROFISSIONAIS */}
        <section className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
             <Briefcase size={14} className="text-orange-500" />
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grupo: Alotação</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Setor</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-600 outline-none text-white text-sm" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-600 outline-none text-white text-sm" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Mail size={10} /> E-mail do Gestor Direto</label>
              <input required type="email" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-600 outline-none text-white text-sm" value={formData.managerEmail} onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })} />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
          <button type="submit" className="px-10 py-4 bg-white text-black font-black rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-widest">
            Confirmar Registro
          </button>
        </div>
      </form>
    </div>
  );
};
