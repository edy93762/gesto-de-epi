import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, CheckCircle, AlertTriangle, ChevronDown, ScanFace, Loader2 } from 'lucide-react';

// Declaração global para o MediaPipe carregado via CDN
declare global {
  interface Window {
    FaceDetection: any;
    Camera: any;
    drawRectangle: any;
  }
}

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: string) => void;
  employeeName: string;
}

const FaceRecognitionModal: React.FC<FaceRecognitionModalProps> = ({ isOpen, onClose, onCapture, employeeName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Controle de Dispositivos e Seleção
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Estados da IA
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceDetectionInstance, setFaceDetectionInstance] = useState<any>(null);
  const requestRef = useRef<number | null>(null);

  // Inicializar MediaPipe FaceDetection
  useEffect(() => {
    if (isOpen && window.FaceDetection) {
      const faceDetection = new window.FaceDetection({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      faceDetection.setOptions({
        model: 'short', // 'short' é mais rápido e bom para selfies
        minDetectionConfidence: 0.6, // Aumentado ligeiramente a confiança para melhor precisão
      });

      faceDetection.onResults(onResults);
      setFaceDetectionInstance(faceDetection);
      setIsModelLoading(false);
    }
  }, [isOpen]);

  // Função chamada a cada quadro processado pela IA
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current || image) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    const { width, height } = canvasRef.current;
    canvasCtx.clearRect(0, 0, width, height);

    // Se detectou rosto
    if (results.detections.length > 0) {
      setIsFaceDetected(true);
      
      // Desenhar caixa em volta do rosto
      results.detections.forEach((detection: any) => {
        const bbox = detection.boundingBox;
        
        // Converter coordenadas normalizadas para pixels
        // O MediaPipe retorna coordenadas normalizadas (0.0 a 1.0)
        const x = bbox.xCenter * width - (bbox.width * width) / 2;
        const y = bbox.yCenter * height - (bbox.height * height) / 2;
        const w = bbox.width * width;
        const h = bbox.height * height;

        // Estilo do retângulo
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 4;
        canvasCtx.strokeStyle = '#10b981'; // Emerald 500 (Verde)
        canvasCtx.roundRect(x, y, w, h, 10); // Bordas arredondadas
        canvasCtx.stroke();

        // Adicionar texto "Rosto Detectado"
        canvasCtx.fillStyle = '#10b981';
        canvasCtx.font = 'bold 16px Inter, sans-serif';
        canvasCtx.fillText("Biometria OK", x, y - 10);
      });

    } else {
      setIsFaceDetected(false);
    }
  }, [image]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const processVideo = async () => {
    if (videoRef.current && faceDetectionInstance && !image && isOpen) {
      try {
        await faceDetectionInstance.send({ image: videoRef.current });
      } catch (e) {
        // Ignora erros de frame vazio
      }
      requestRef.current = requestAnimationFrame(processVideo);
    }
  };

  const startCamera = async (deviceIdToUse?: string) => {
    stopCamera();
    setError('');
    setIsFaceDetected(false);

    try {
      // Tenta resolução 720p (1280x720) para melhor qualidade da foto
      const constraints: MediaStreamConstraints = {
        video: deviceIdToUse 
            ? { deviceId: { exact: deviceIdToUse }, width: { ideal: 1280 }, height: { ideal: 720 } } 
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Detectar se é frontal
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      // Lógica heurística: se não escolheu ID específico, assume 'user' (frontal).
      const isFront = !deviceIdToUse || (settings.facingMode === 'user');
      setIsFrontCamera(isFront);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
                videoRef.current.play();
                // Ajustar tamanho do canvas ao vídeo
                if (canvasRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                }
                // Iniciar loop de detecção
                processVideo();
            }
        };
      }

      // Listar dispositivos para o select
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices.filter(d => d.kind === 'videoinput'));
      if (!selectedDeviceId && settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
      }

    } catch (err: any) {
      console.error("Erro Câmera:", err);
      // Fallback para resolução padrão se falhar a alta
      try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
           if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                videoRef.current.play();
                processVideo();
           }
      } catch (e) {
          setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }
  };

  useEffect(() => {
    if (isOpen && !image && !isModelLoading) {
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, image, isModelLoading]);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    startCamera(newId);
  };

  const handleCapture = () => {
    if (!isFaceDetected) return; // Segurança extra

    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Espelhar se for frontal, igual ao preview
        if (isFrontCamera) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg', 0.9);
        setImage(photoData);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setImage(null);
    setIsFaceDetected(false);
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
               <ScanFace className="w-4 h-4 text-white" />
            </div>
            Validação Biométrica
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center min-h-[350px] overflow-hidden">
          
          {isModelLoading && (
             <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-dark-900/90 text-white">
                 <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
                 <span className="text-sm font-medium">Carregando IA Facial...</span>
             </div>
          )}

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
                    playsInline
                    muted
                    style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* CANVAS OVERLAY PARA DESENHAR O ROSTO */}
                  <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
                  />

                  {/* Feedback Visual de Status */}
                  <div className="absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
                      <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-2 transition-all duration-300 ${
                          isFaceDetected 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                          : 'bg-red-500/20 border-red-500/50 text-red-400'
                      }`}>
                          {isFaceDetected ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Rosto Identificado</span>
                              </>
                          ) : (
                              <>
                                <ScanFace className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Posicione o Rosto</span>
                              </>
                          )}
                      </div>
                  </div>

                  {/* SELETOR DE CÂMERA */}
                  {devices.length > 0 && (
                    <div className="absolute bottom-4 right-4 z-20 w-[50%] flex justify-end">
                      <div className="relative group max-w-full pointer-events-auto">
                        <select
                          value={selectedDeviceId}
                          onChange={handleDeviceChange}
                          className="appearance-none bg-black/60 hover:bg-black/80 text-white pl-8 pr-8 py-2 rounded-full border border-white/10 text-xs font-medium focus:outline-none backdrop-blur-md cursor-pointer transition-all shadow-lg w-full truncate"
                        >
                          {devices.map((device, idx) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-dark-900 text-white">
                              {device.label || `Câmera ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                        <Camera className="w-3.5 h-3.5 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white transition-colors" />
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
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-dark-950 border-t border-dark-800 shrink-0">
          {!image ? (
            <button
              onClick={handleCapture}
              disabled={!!error || !isFaceDetected}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                !!error || !isFaceDetected
                ? 'bg-dark-800 text-zinc-600 cursor-not-allowed border border-dark-700 opacity-70' 
                : 'bg-brand-600 hover:bg-brand-500 text-white active:scale-[0.98] shadow-brand-600/20'
              }`}
            >
              <ScanFace className="w-6 h-6" />
              {isFaceDetected ? "CAPTURAR BIOMETRIA" : "AGUARDANDO ROSTO..."}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRetake}
                className="py-3.5 rounded-xl font-medium bg-dark-800 text-zinc-300 hover:bg-dark-700 hover:text-white border border-dark-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refazer
              </button>
              <button
                onClick={handleConfirm}
                className="py-3.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                CONFIRMAR
              </button>
            </div>
          )}
          
          <p className="text-center text-xs text-zinc-500 mt-3 truncate px-4">
             {employeeName ? `Vinculando a: ${employeeName}` : 'Cadastro de novo perfil'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognitionModal;