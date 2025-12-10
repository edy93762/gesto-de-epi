import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Clock, Calendar, Settings, Download, Upload, Database, RefreshCw } from 'lucide-react';
import { AutoDeleteConfig, AutoDeleteUnit, EpiRecord, EpiCatalogItem, Collaborator } from '../types';

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
  
  useEffect(() => {
    setLocalConfig(config);
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
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `backup_luandre_epi_${date}.json`;
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
            // Confirmação movida para o App.tsx para controlar melhor o estado global
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

            {/* Validity Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <Clock className="w-5 h-5 text-brand-500" />
                    <h4>Controle de Validade</h4>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-dark-950 rounded-lg border border-dark-800">
                    <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${localConfig.defaultEnabled ? 'bg-blue-500/10 text-blue-500' : 'bg-dark-800 text-zinc-600'}`}>
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-zinc-300">Definir Validade Padrão</span>
                        <span className="text-[10px] text-zinc-500">Itens vencidos irão para a aba "Vencidos"</span>
                    </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={localConfig.defaultEnabled}
                        onChange={(e) => setLocalConfig({...localConfig, defaultEnabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-dark-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                </div>

                <div className={`space-y-4 transition-all duration-300 ${localConfig.defaultEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Tempo de validade da entrega:
                        </label>
                        <div className="flex gap-4">
                        <input 
                            type="number" 
                            min="1"
                            value={localConfig.defaultValue}
                            onChange={(e) => setLocalConfig({...localConfig, defaultValue: parseInt(e.target.value) || 1})}
                            className="flex-1 px-4 py-2 bg-dark-950 border border-dark-700 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-white"
                        />
                        <select 
                            value={localConfig.defaultUnit}
                            onChange={(e) => setLocalConfig({...localConfig, defaultUnit: e.target.value as AutoDeleteUnit})}
                            className="flex-1 px-4 py-2 bg-dark-950 border border-dark-700 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none text-white"
                        >
                            <option value="minutes">Minutos</option>
                            <option value="days">Dias</option>
                            <option value="months">Meses</option>
                        </select>
                        </div>
                    </div>
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