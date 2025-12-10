import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw, CheckCircle, ScanFace, AlertTriangle, UserCog } from 'lucide-react';

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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetState();
    }
    return () => stopCamera();
  }, [isOpen]);

  const resetState = () => {
    setCapturedImage(null);
    setIsScanning(false);
    setConfidenceScore(0);
  };

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      setIsScanning(true);
      
      // Simula processamento da IA
      setTimeout(() => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const context = canvasRef.current.getContext('2d');
        if (context) {
          const { videoWidth, videoHeight } = videoRef.current;
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
          
          const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageData);
          
          // SIMULAÇÃO DE SCORE DE CONFIANÇA (Entre 60% e 99% para fins de demonstração)
          // Em produção, isso viria da API de reconhecimento facial
          const simulatedScore = Math.floor(Math.random() * (99 - 60 + 1)) + 60;
          setConfidenceScore(simulatedScore);
          
          setIsScanning(false);
        }
      }, 1500);
    }
  };

  const handleRetake = () => {
    resetState();
  };

  const handleConfirm = () => {
    if (capturedImage && confidenceScore >= 80) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleManualEntry = () => {
    onClose();
    // O usuário preencherá manualmente no formulário pai
  };

  if (!isOpen) return null;

  const isLowConfidence = confidenceScore > 0 && confidenceScore < 80;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-dark-800 flex flex-col max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500/10 p-2 rounded-lg text-brand-500">
              <ScanFace className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Reconhecimento Facial</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-4 overflow-y-auto">
          {error ? (
            <div className="text-red-400 bg-red-500/10 p-4 rounded-lg text-center w-full">
              {error}
            </div>
          ) : (
            <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden border-2 border-dark-700 shadow-inner group shrink-0">
              {!capturedImage ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                  />
                  {/* Overlay de Scanner */}
                  <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute inset-8 border-2 border-brand-500/50 rounded-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-400"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-400"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-400"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-400"></div>
                     </div>
                     {isScanning && (
                       <div className="absolute top-0 left-0 w-full h-1 bg-brand-400/80 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                     )}
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      Posicione o rosto de <strong>{employeeName || 'Colaborador'}</strong>
                    </span>
                  </div>
                </>
              ) : (
                <div className="relative w-full h-full">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                  
                  {/* Resultado da Análise */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${isLowConfidence ? 'bg-amber-500/10' : 'bg-brand-500/20'}`}>
                     <div className={`backdrop-blur-md p-4 rounded-2xl border flex flex-col items-center animate-in zoom-in duration-300 shadow-2xl ${isLowConfidence ? 'bg-black/40 border-amber-500/50' : 'bg-white/10 border-white/20'}`}>
                        {isLowConfidence ? (
                            <AlertTriangle className="w-12 h-12 text-amber-500 drop-shadow-lg mb-2" />
                        ) : (
                            <CheckCircle className="w-12 h-12 text-emerald-400 drop-shadow-lg mb-2" />
                        )}
                        <span className={`text-2xl font-bold ${isLowConfidence ? 'text-amber-500' : 'text-white'}`}>
                            {confidenceScore}%
                        </span>
                        <span className="text-xs text-white/80 font-medium uppercase tracking-wider mt-1">
                            Nível de Confiança
                        </span>
                     </div>
                  </div>

                  <div className={`absolute bottom-0 left-0 right-0 py-3 text-white text-center text-sm font-bold flex flex-col gap-1 ${isLowConfidence ? 'bg-amber-600/90' : 'bg-emerald-600/90'}`}>
                    <span>{isLowConfidence ? '⚠ Confiança Baixa' : '✓ Biometria Validada'}</span>
                    {isLowConfidence && <span className="text-[10px] font-normal opacity-90">Necessário mínimo de 80%</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Botões de Ação */}
          <div className="w-full pt-2">
            {!capturedImage ? (
              <button
                onClick={handleCapture}
                disabled={isScanning || !!error}
                className={`w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-brand-500/20 ${isScanning ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capturar Rosto
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                {isLowConfidence ? (
                   // Controles para Baixa Confiança
                   <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleRetake}
                        className="col-span-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Tentar Novamente
                      </button>
                      <button
                        onClick={handleManualEntry}
                        className="col-span-1 bg-dark-800 hover:bg-dark-700 text-zinc-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-dark-700"
                      >
                        <UserCog className="w-4 h-4" />
                        Inserir Manualmente
                      </button>
                      <p className="col-span-2 text-center text-xs text-zinc-500 mt-1">
                        A pontuação foi inferior a 80%. Melhore a iluminação ou remova acessórios do rosto.
                      </p>
                   </div>
                ) : (
                   // Controles para Sucesso
                   <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleRetake}
                        className="bg-dark-800 hover:bg-dark-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Tirar Outra
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </button>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FaceRecognitionModal;