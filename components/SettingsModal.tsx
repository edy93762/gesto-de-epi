import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Settings, Download, Upload, Database, RefreshCw, HardDrive } from 'lucide-react';
import { AutoDeleteConfig, EpiRecord, EpiCatalogItem, Collaborator } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoDeleteConfig;
  onSaveConfig: (config: AutoDeleteConfig) => void;
  onRunCleanup: () => void;
  fullData: {
    records: EpiRecord[];
    catalog: EpiCatalogItem[];
    collaborators: Collaborator[];
    config: AutoDeleteConfig;
  };
  onImportData: (data: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onSaveConfig,
  onRunCleanup,
  fullData,
  onImportData
}) => {
  const [localConfig, setLocalConfig] = useState<AutoDeleteConfig>(config);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, percent: 0 });
  
  useEffect(() => {
    setLocalConfig(config);
    
    // Calcular uso do armazenamento baseado no tamanho do JSON dos dados
    if (isOpen) {
        try {
            // Estima o tamanho dos dados convertendo para string JSON
            const dataString = JSON.stringify(fullData);
            const bytes = new Blob([dataString]).size;
            const usedKB = bytes / 1024;
            
            // O limite do IndexedDB é muito alto (gigabytes), mas para visualização
            // definimos uma "meta" soft de 10MB para alertar o usuário se o arquivo está ficando grande demais para processar rápido.
            const softLimitKB = 10240; // 10MB
            
            setStorageUsage({
                used: usedKB,
                percent: Math.min((usedKB / softLimitKB) * 100, 100)
            });
        } catch (e) {
            console.error("Erro ao calcular armazenamento", e);
        }
    }
  }, [config, isOpen, fullData]);

  if (!isOpen) return null;

  const handleSaveConfig = async () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');
    
    link.href = url;
    link.download = `backup_gestao_epi_${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);
            onImportData(parsedData);
            onClose();
        } catch (error) {
            alert("Erro ao ler arquivo. Certifique-se de que é um backup válido.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-dark-800 p-2 rounded-lg text-zinc-400">
                <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
                Configurações
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
            
            {/* Storage Usage Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <HardDrive className="w-5 h-5 text-purple-500" />
                    <h4>Dados do Sistema (Offline)</h4>
                </div>
                
                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-sm text-zinc-400">Tamanho da Base de Dados</span>
                        <div className="text-right">
                            <span className="text-lg font-bold text-white">{storageUsage.used.toFixed(2)} KB</span>
                            <span className="text-xs text-zinc-600 block">Dados salvos no navegador</span>
                        </div>
                    </div>
                    <div className="w-full bg-dark-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${storageUsage.percent > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                            style={{ width: `${Math.max(storageUsage.percent, 2)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">
                        O sistema usa IndexedDB. A barra acima é apenas uma referência de volume de dados (Meta: 10MB).
                    </p>
                </div>
            </div>

            {/* Backup Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <h4>Backup e Restauração</h4>
                </div>

                {/* Toggle Auto Backup */}
                <div className="flex items-center justify-between p-4 bg-dark-950 rounded-lg border border-dark-800">
                    <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${localConfig.autoBackup ? 'bg-emerald-500/10 text-emerald-500' : 'bg-dark-800 text-zinc-600'}`}>
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-zinc-300">Backup Automático (Download)</span>
                        <span className="text-[10px] text-zinc-500">Baixa um arquivo JSON automaticamente a cada nova entrega</span>
                    </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={localConfig.autoBackup || false}
                        onChange={(e) => setLocalConfig({...localConfig, autoBackup: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-dark-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-dark-950 border border-dark-800 rounded-xl hover:border-brand-500/50 hover:bg-dark-800 transition-all group"
                    >
                        <div className="p-2 bg-brand-500/10 rounded-full text-brand-400 group-hover:scale-110 transition-transform">
                            <Download className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300">Baixar Manualmente</span>
                    </button>
                    
                    <button 
                        onClick={handleImportClick}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-dark-950 border border-dark-800 rounded-xl hover:border-amber-500/50 hover:bg-dark-800 transition-all group"
                    >
                        <div className="p-2 bg-amber-500/10 rounded-full text-amber-400 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300">Restaurar (Substituir)</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".json"
                    />
                </div>
            </div>
              
            <button 
                onClick={handleSaveConfig}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
                <Save className="w-4 h-4" />
                Salvar Configurações
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;