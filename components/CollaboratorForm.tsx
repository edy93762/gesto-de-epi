
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
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Seu navegador não suporta acesso à câmera.");
      return;
    }

    const constraints = [
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    let success = false;
    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraOpen(true);
          success = true;
          break;
        }
      } catch (err) {
        console.warn("Falha ao abrir câmera frontal no cadastro:", constraint, err);
      }
    }

    if (!success) {
      alert("Não foi possível acessar a câmera. Verifique permissões.");
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
    : "max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden";

  return (
    <div className={containerClasses}>
      {!isModal && (
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="text-blue-600" size={24} />
              Cadastrar Novo Colaborador
            </h2>
            <p className="text-sm text-slate-500 mt-1">Insira os dados e a foto de referência.</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
      )}

      {isModal && (
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="text-blue-600" size={20} />
            Rápido Cadastro
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isModal ? "space-y-3" : "p-6 space-y-4"}>
        <div className="flex flex-col items-center mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2 w-full">Foto de Referência (Reconhecimento Facial)</label>
          <div className="relative w-32 h-32 bg-slate-100 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center">
             {capturedPhoto ? (
                <div className="relative w-full h-full">
                  <img src={capturedPhoto} alt="Foto referência" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setCapturedPhoto(null); startCamera(); }} className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-md text-blue-600">
                    <RefreshCw size={14} />
                  </button>
                </div>
             ) : isCameraOpen ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  <button type="button" onClick={takePhoto} className="absolute inset-0 m-auto w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Camera size={18} />
                  </button>
                </div>
             ) : (
                <button type="button" onClick={startCamera} className="text-slate-400 hover:text-blue-600 flex flex-col items-center">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold">CAPTURAR</span>
                </button>
             )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className={`grid grid-cols-1 ${isModal ? "" : "md:grid-cols-2"} gap-4`}>
          <div className={isModal ? "" : "col-span-2"}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João da Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula (Opcional)</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.matricula}
              onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
              placeholder="Ex: 10025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <MapPin size={14} className="text-slate-400" /> Agência
            </label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="Ex: Agência Centro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              placeholder="Ex: Produção"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Ex: Operador I"
            />
          </div>
          <div className={isModal ? "" : "col-span-2"}>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail do Gestor</label>
            <input
              required
              type="email"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.managerEmail}
              onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
              placeholder="gestor@empresa.com"
            />
          </div>
        </div>

        <div className={`flex justify-end gap-3 pt-6 ${isModal ? "" : "border-t border-slate-100"}`}>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all"
          >
            <Save size={18} />
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};
