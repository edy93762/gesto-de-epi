import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Trash2, Calendar, Settings } from 'lucide-react';
import { AutoDeleteConfig, AutoDeleteUnit } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoDeleteConfig;
  onSaveConfig: (config: AutoDeleteConfig) => void;
  onRunCleanup: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onSaveConfig,
  onRunCleanup
}) => {
  const [localConfig, setLocalConfig] = useState<AutoDeleteConfig>(config);
  
  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    onSaveConfig(localConfig);
    onClose();
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
                Configurações do Sistema
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <Clock className="w-5 h-5 text-brand-500" />
                    <h4>Limpeza Automática</h4>
                </div>
              <p className="text-sm text-zinc-500">
                Defina o tempo padrão de retenção para novas fichas.
              </p>

              <div className="flex items-center justify-between p-4 bg-dark-950 rounded-lg border border-dark-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${localConfig.defaultEnabled ? 'bg-blue-500/10 text-blue-500' : 'bg-dark-800 text-zinc-600'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-zinc-300">Sugerir Validade</span>
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
                      Tempo padrão de vida do registro:
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

              <div className="border-t border-dark-800 pt-4">
                <button 
                   onClick={onRunCleanup}
                   className="w-full text-xs text-zinc-500 hover:text-zinc-300 underline flex justify-center items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Verificar e apagar registros vencidos agora
                </button>
              </div>
              
              <button 
                onClick={handleSaveConfig}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                Salvar Padrão
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;