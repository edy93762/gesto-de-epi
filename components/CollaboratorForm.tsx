
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator } from '../types';
import { generateId } from '../utils/helpers';
import { UserPlus, X, Camera, RefreshCw, User, Briefcase, UserCheck, Scan, AlertCircle, Building2 } from 'lucide-react';

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
    managerName: '',
  });
  
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraOpen && !capturedPhoto) {
      startCamera();
    }
    return () => stopCamera();
  }, [isCameraOpen, capturedPhoto, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        streamRef.current = stream; 
      }
    } catch (err) {
      console.error("Erro câmera:", err);
      setCameraError("Câmera indisponível.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach(track => track.stop()); 
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
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
            context.translate(size, 0);
            context.scale(-1, 1);
        }

        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhoto) {
      alert("ATENÇÃO: A foto de cadastro é OBRIGATÓRIA.");
      return;
    }
    onSave({ ...formData, id: generateId('COL'), active: true, photo: capturedPhoto || undefined });
  };

  return (
    <div className={`bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden ${isModal ? "w-full max-h-[90vh] overflow-y-auto" : "max-w-2xl mx-auto mb-12"}`}>
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <UserPlus className="text-blue-500" size={24} /> Novo Cadastro
          </h2>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors p-2"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* FOTO DE PERFIL */}
        <section className="bg-slate-950/50 p-8 rounded-[3rem] border border-slate-800/50 space-y-6 relative">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
             <Scan size={18} className="text-blue-500" />
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Foto de Perfil</h3>
             {!capturedPhoto && <span className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-auto animate-pulse">* Obrigatório</span>}
          </div>
          
          <div className="flex justify-center">
            <div className="relative w-48 h-48 bg-slate-950 rounded-full border-4 border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
               {capturedPhoto ? (
                  <div className="relative w-full h-full animate-in zoom-in-95">
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setCapturedPhoto(null); setIsCameraOpen(true); }} 
                      className="absolute bottom-2 right-2 bg-white p-3 rounded-full shadow-2xl text-slate-900 active:scale-90 transition-all"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
               ) : isCameraOpen ? (
                  <div className="relative w-full h-full">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                    />
                    <div className="scanner-line"></div>
                    
                    <button 
                      type="button" 
                      onClick={toggleCamera} 
                      className="absolute top-2 right-2 p-1.5 bg-slate-950/90 rounded-lg text-white border border-slate-600 hover:bg-slate-800 z-10 flex items-center gap-1"
                      title="Trocar Câmera"
                    >
                      <RefreshCw size={12} />
                    </button>

                    <button 
                      type="button" 
                      onClick={takePhoto} 
                      className="absolute inset-0 m-auto w-16 h-16 bg-blue-600/90 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 border-2 border-white/30"
                    >
                      <Camera size={28} />
                    </button>
                  </div>
               ) : (
                  <div className="text-center p-4">
                    {cameraError ? <AlertCircle className="text-red-500 mx-auto mb-2" /> : <Camera size={32} className="text-slate-800 mx-auto mb-2" />}
                    <button type="button" onClick={() => setIsCameraOpen(true)} className="text-[10px] font-black uppercase text-blue-500 hover:text-white">Ativar Câmera</button>
                  </div>
               )}
            </div>
          </div>
        </section>

        {/* DADOS DO FORMULÁRIO */}
        <section className="space-y-6">
          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
               <User size={14} className="text-emerald-500" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Empresa / Agência</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-4 top-4.5 text-slate-500" />
                  <input required type="text" className="w-full pl-10 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} />
                </div>
              </div>
               <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Matrícula (Opcional)</label>
                <input type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} placeholder="Sem registro" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
               <Briefcase size={14} className="text-orange-500" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados Operacionais</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Setor</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><UserCheck size={10} /> Nome do Gestor</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.managerName} onChange={(e) => setFormData({ ...formData, managerName: e.target.value })} placeholder="Nome do Responsável" />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
          <button type="submit" disabled={!capturedPhoto} className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase text-[11px] tracking-widest disabled:opacity-20 shadow-2xl disabled:cursor-not-allowed">
            {capturedPhoto ? 'Efetivar Cadastro' : 'Aguardando Foto...'}
          </button>
        </div>
      </form>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
