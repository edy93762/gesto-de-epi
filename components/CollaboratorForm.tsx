
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
  
  // Estado para controlar se a câmera está em tela cheia
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraFullscreen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraFullscreen, capturedPhoto, facingMode]);

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
      console.error("Erro câmera:", err);
      alert("Não foi possível acessar a câmera.");
      setIsCameraFullscreen(false);
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
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
        setIsCameraFullscreen(false); // Fecha o modo tela cheia após capturar
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

  // --- RENDER CAMERA FULLSCREEN ---
  if (isCameraFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in zoom-in-95 duration-300">
         {/* Top Bar */}
         <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div>
               <p className="text-white font-black text-lg uppercase tracking-tight shadow-black drop-shadow-md">Foto de Perfil</p>
               <p className="text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">Cadastro de Colaborador</p>
            </div>
            <button onClick={() => setIsCameraFullscreen(false)} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20">
               <X size={24} />
            </button>
         </div>

         {/* Camera Viewport */}
         <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted 
               className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
             />
             
             {/* Overlay de Guia para Rosto */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-white/30 rounded-full border-dashed"></div>
             </div>

             <div className="absolute bottom-8 w-full flex justify-center items-center gap-8 z-20 pb-safe">
                <button type="button" onClick={toggleCamera} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20">
                   <RefreshCw size={24} />
                </button>
                <button 
                   type="button"
                   onClick={takePhoto} 
                   className="w-24 h-24 bg-white rounded-full border-4 border-slate-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-transform flex items-center justify-center"
                >
                   <div className="w-20 h-20 border-2 border-black rounded-full"></div>
                </button>
                <div className="w-14"></div>
             </div>
         </div>
         <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // --- RENDER FORMULÁRIO NORMAL ---
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
          
          <div className="flex flex-col items-center gap-4">
             {capturedPhoto ? (
                <div className="relative">
                   <div className="w-48 h-48 rounded-full border-4 border-emerald-500 shadow-2xl overflow-hidden">
                      <img src={capturedPhoto} className="w-full h-full object-cover" />
                   </div>
                   <button 
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute bottom-0 right-0 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                   >
                      <RefreshCw size={20} />
                   </button>
                </div>
             ) : (
                <div className="w-full bg-slate-900 rounded-3xl border-2 border-dashed border-slate-800 p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => setIsCameraFullscreen(true)}>
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-blue-500">
                      <Camera size={40} />
                   </div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Toque para Abrir Câmera</p>
                </div>
             )}
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
