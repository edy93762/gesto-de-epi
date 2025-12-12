import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw, CheckCircle, AlertTriangle, Play, ChevronDown } from 'lucide-react';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: string) => void;
  employeeName: string;
}

const FaceRecognitionModal: React.FC<FaceRecognitionModalProps> = ({ isOpen, onClose, onCapture, employeeName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Controle de Dispositivos e Seleção
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isFrontCamera, setIsFrontCamera] = useState(true); // Controla espelhamento

  const [isSecureContext, setIsSecureContext] = useState(true);

  useEffect(() => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setIsSecureContext(false);
      setError("A câmera requer conexão segura (HTTPS).");
    }
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Carregar lista de câmeras quando o stream iniciar (necessário para ter permissão de ler labels)
  useEffect(() => {
    const loadDevices = async () => {
        try {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
            setDevices(videoDevs);

            // Tenta identificar a câmera atual na lista
            if (stream && !selectedDeviceId) {
                const track = stream.getVideoTracks()[0];
                const settings = track.getSettings();
                if (settings.deviceId) {
                    setSelectedDeviceId(settings.deviceId);
                }
            }
        } catch (e) {
            console.error("Erro ao listar dispositivos:", e);
        }
    };

    if (stream) {
        loadDevices();
    }
  }, [stream]);

  const startCamera = async (deviceIdToUse?: string) => {
    if (!isSecureContext) return;
    
    stopCamera();
    setError('');

    try {
      console.log(`Iniciando câmera... DeviceID: ${deviceIdToUse || 'Padrão (User)'}`);
      
      const constraints: MediaStreamConstraints = {
        video: deviceIdToUse 
            ? { deviceId: { exact: deviceIdToUse } } 
            : { facingMode: 'user' }, // Tenta frontal por padrão na primeira vez
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      // Lógica de Espelhamento:
      // Se usou facingMode 'user' OU se o nome da câmera selecionada tiver "front/anterior"
      const track = newStream.getVideoTracks()[0];
      const label = track.label.toLowerCase();
      // Se não tem ID (primeiro load) é 'user' (front). Se tem ID, checa o label.
      const isFront = !deviceIdToUse || label.includes('front') || label.includes('anterior') || label.includes('frontal');
      setIsFrontCamera(isFront);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Autoplay bloqueado:", e);
        }
      }
    } catch (err: any) {
      console.error("Erro Câmera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permissão da câmera negada.");
      } else if (err.name === 'NotFoundError') {
        setError("Nenhuma câmera encontrada.");
      } else {
        setError("Erro ao iniciar câmera.");
      }
    }
  };

  // Inicia câmera ao abrir o modal
  useEffect(() => {
    if (isOpen && !image) {
      // Usa o ID selecionado se houver, senão usa padrão
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, image]); 

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      setSelectedDeviceId(newId);
      startCamera(newId);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setTimeout(handleCapture, 100);
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Espelha apenas se for câmera frontal
        if (isFrontCamera) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const photoData = canvas.toDataURL('image/jpeg', 0.85);
          setImage(photoData);
          stopCamera();
        } catch (e) {
          setError("Erro ao processar imagem.");
        }
      }
    }
  };

  const handleRetake = () => {
    setImage(null);
    setError('');
  };

  const handleConfirm = () => {
    if (image) {
      onCapture(image);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="bg-dark-900 w-full max-w-md rounded-2xl border border-dark-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800 bg-dark-950 shrink-0">
          <h3 className="text-white font-bold flex items-center gap-2">
            <div className="bg-brand-600 p-1.5 rounded-lg">
               <Camera className="w-4 h-4 text-white" />
            </div>
            Reconhecimento Facial
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center min-h-[350px] overflow-hidden">
          
          {error ? (
            <div className="p-6 text-center max-w-[85%] bg-dark-900 rounded-xl border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-200 text-sm mb-4 font-medium">{error}</p>
              <button 
                onClick={() => startCamera(selectedDeviceId)} 
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-2.5 rounded-lg border border-red-500/30 transition-colors font-bold text-sm"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <>
              {!image ? (
                // VIDEO LIVE
                <div className="relative w-full h-full flex flex-col justify-center bg-black">
                   <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                        if(videoRef.current) videoRef.current.play().catch(e => console.error("Play error", e));
                    }}
                  />
                  
                  {/* Play Manual Fallback */}
                  {!stream && !error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-dark-900 z-10">
                          <button 
                            onClick={() => startCamera(selectedDeviceId)}
                            className="flex flex-col items-center gap-3 text-zinc-400 hover:text-white transition-colors"
                          >
                              <div className="p-4 bg-dark-800 rounded-full border border-dark-700">
                                <Play className="w-8 h-8 fill-current" />
                              </div>
                              <span className="text-sm font-medium">Ativar Câmera</span>
                          </button>
                      </div>
                  )}

                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-[200px] h-[260px] border-2 border-brand-500/50 rounded-[4rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-brand-500/30 backdrop-blur-sm">
                           Rosto Aqui
                        </div>
                    </div>
                  </div>

                  {/* SELETOR DE CÂMERA */}
                  {devices.length > 0 && (
                    <div className="absolute top-4 right-4 z-20 w-[60%] flex justify-end">
                      <div className="relative group max-w-full">
                        <select
                          value={selectedDeviceId}
                          onChange={handleDeviceChange}
                          className="appearance-none bg-black/60 hover:bg-black/80 text-white pl-9 pr-8 py-2.5 rounded-full border border-white/10 text-xs font-medium focus:outline-none backdrop-blur-md cursor-pointer transition-all shadow-lg w-full truncate"
                        >
                          {devices.map((device, idx) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-dark-900 text-white">
                              {device.label || `Câmera ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                        <Camera className="w-4 h-4 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  )}
                  
                </div>
              ) : (
                // PREVIEW FOTO
                <div className="relative w-full h-full bg-black">
                  <img src={image} alt="Captura" className="w-full h-full object-contain" />
                  <div className="absolute bottom-6 inset-x-0 flex justify-center z-20">
                      <span className="bg-emerald-600/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 border border-emerald-400/30">
                          <CheckCircle className="w-5 h-5" /> Foto Capturada
                      </span>
                  </div>
                </div>
              )}
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-dark-950 border-t border-dark-800 shrink-0">
          {!image ? (
            <button
              onClick={handleCapture}
              disabled={!!error || !stream}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                !!error || !stream
                ? 'bg-dark-800 text-zinc-500 cursor-not-allowed border border-dark-700' 
                : 'bg-brand-600 hover:bg-brand-500 text-white active:scale-[0.98] shadow-brand-600/20'
              }`}
            >
              <Camera className="w-6 h-6" />
              CAPTURAR FOTO
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRetake}
                className="py-3.5 rounded-xl font-medium bg-dark-800 text-zinc-300 hover:bg-dark-700 hover:text-white border border-dark-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              <button
                onClick={handleConfirm}
                className="py-3.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                CONFIRMAR FOTO
              </button>
            </div>
          )}
          
          <p className="text-center text-xs text-zinc-500 mt-3 truncate px-4">
             {employeeName ? `Vinculando a: ${employeeName}` : 'Nenhum colaborador selecionado'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognitionModal;