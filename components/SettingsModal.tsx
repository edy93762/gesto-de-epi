import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Settings, Download, Upload, Database, RefreshCw, HardDrive, Sheet, Link, HelpCircle, Copy, Check, ExternalLink, Send, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
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

const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Cria o cabeçalho se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Data", "Hora", "Empresa", "Colaborador", "CPF", "Itens", "Assinado"]);
    }

    var dataHora = new Date(data.date);
    var itensTexto = data.items.map(function(i) { 
      return i.name + (i.ca ? " (CA: " + i.ca + ")" : ""); 
    }).join(", ");

    sheet.appendRow([
      Utilities.formatDate(dataHora, Session.getScriptTimeZone(), "dd/MM/yyyy"),
      Utilities.formatDate(dataHora, Session.getScriptTimeZone(), "HH:mm:ss"),
      data.company,
      data.employeeName,
      data.cpf || "",
      itensTexto,
      data.facePhoto ? "Sim (Biometria)" : "Não"
    ]);

    return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": e})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

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
  
  // Estado para o tutorial
  const [showScriptHelp, setShowScriptHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Estado para o teste de conexão
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setLocalConfig(config);
    setTestResult('idle');
    
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

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!localConfig.googleSheetsUrl) return;
    
    // Validação básica de URL
    if (!localConfig.googleSheetsUrl.includes('script.google.com')) {
        alert("A URL parece incorreta. Ela deve começar com 'https://script.google.com...'");
        return;
    }

    setIsTesting(true);
    setTestResult('idle');

    try {
        const testPayload = {
            date: new Date().toISOString(),
            company: 'SISTEMA',
            employeeName: 'TESTE DE CONEXÃO',
            cpf: '000000',
            items: [{ name: 'Verificação de URL', ca: 'TESTE' }],
            facePhoto: ''
        };

        await fetch(localConfig.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        // Como usamos no-cors, não sabemos se o script falhou internamente, 
        // mas sabemos que a requisição saiu do navegador.
        setTestResult('success');
    } catch (error) {
        console.error("Erro no teste:", error);
        setTestResult('error');
    } finally {
        setIsTesting(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col my-auto max-h-[90vh]">
        <div className="bg-dark-900 px-4 py-3 sm:px-6 sm:py-4 border-b border-dark-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-dark-800 p-2 rounded-lg text-zinc-400">
                <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
                Configurações
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 -mr-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 flex-1 custom-scrollbar">
            
            {/* Storage Usage Section */}
            <div className="space-y-3 sm:space-y-4">
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

            {/* Integração Google Sheets - MOBILE OPTIMIZED */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-800 pb-2 gap-2">
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                        <Sheet className="w-5 h-5 text-green-500 shrink-0" />
                        <h4>Integração Google Planilhas</h4>
                    </div>
                    <button 
                        onClick={() => setShowScriptHelp(!showScriptHelp)}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center justify-center gap-1 font-medium bg-brand-500/10 px-3 py-2 sm:py-1.5 rounded-full border border-brand-500/20 transition-colors w-full sm:w-auto"
                    >
                        <HelpCircle className="w-3 h-3" />
                        {showScriptHelp ? 'Ocultar Tutorial' : 'Ver Tutorial e Script'}
                    </button>
                </div>

                {/* Tutorial Box */}
                {showScriptHelp && (
                    <div className="bg-dark-950 border border-dark-700 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2 text-sm text-zinc-300">
                            <p><strong className="text-white">Passo 1:</strong> Crie uma nova planilha em <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3"/></a></p>
                            <p><strong className="text-white">Passo 2:</strong> Vá em <strong>Extensões</strong> {'>'} <strong>Apps Script</strong>.</p>
                            <p><strong className="text-white">Passo 3:</strong> Apague qualquer código que estiver lá e cole o código abaixo:</p>
                        </div>
                        
                        <div className="relative group">
                            <pre className="bg-dark-900 border border-dark-800 p-3 rounded-lg text-xs text-zinc-400 font-mono overflow-x-auto custom-scrollbar max-h-40">
                                {GOOGLE_SCRIPT_CODE}
                            </pre>
                            <button 
                                onClick={handleCopyScript}
                                className="absolute top-2 right-2 p-2 bg-dark-800 hover:bg-dark-700 text-white rounded-md border border-dark-600 transition-colors shadow-lg"
                                title="Copiar código"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-zinc-300">
                            <p><strong className="text-white">Passo 4:</strong> Clique em <strong>Implantar (Deploy)</strong> {'>'} <strong>Nova implantação</strong>.</p>
                            <p><strong className="text-white">Passo 5:</strong> Clique na engrenagem, selecione <strong>App da Web</strong>.</p>
                            <p><strong className="text-white">Passo 6:</strong> Em "Quem pode acessar", escolha: <strong>"Qualquer pessoa"</strong> (Importante!).</p>
                            <p><strong className="text-white">Passo 7:</strong> Clique em Implantar, autorize o acesso e copie a <strong>URL do App da Web</strong> gerada.</p>
                            <p><strong className="text-white">Passo 8:</strong> Cole a URL no campo abaixo.</p>
                        </div>
                    </div>
                )}

                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                     <label className="block text-sm font-medium text-zinc-400 mb-1">
                         URL do App da Web (Google Apps Script)
                     </label>
                     <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                             <Link className="w-4 h-4" />
                         </div>
                         <input 
                            type="text"
                            placeholder="https://script.google.com/macros/s/..."
                            value={localConfig.googleSheetsUrl || ''}
                            onChange={(e) => {
                                setLocalConfig({...localConfig, googleSheetsUrl: e.target.value});
                                setTestResult('idle');
                            }}
                            className="w-full pl-10 pr-3 py-3 sm:py-2 bg-dark-900 border border-dark-700 rounded-lg text-base sm:text-sm text-white focus:ring-1 focus:ring-green-500 outline-none placeholder:text-zinc-700"
                         />
                     </div>
                     
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <button
                            onClick={handleTestConnection}
                            disabled={!localConfig.googleSheetsUrl || isTesting}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full sm:w-auto justify-center ${
                                !localConfig.googleSheetsUrl 
                                ? 'bg-dark-800 text-zinc-600 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                            }`}
                        >
                            {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Testar Conexão
                        </button>

                        {/* Status Message */}
                        {testResult === 'success' && (
                            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 w-full sm:w-auto animate-in fade-in slide-in-from-left">
                                <CheckCircle className="w-3 h-3 shrink-0" />
                                <span>Enviado! Verifique se apareceu na planilha.</span>
                            </div>
                        )}
                        {testResult === 'error' && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 w-full sm:w-auto animate-in fade-in slide-in-from-left">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Falha. Verifique a URL ou a internet.</span>
                            </div>
                        )}
                     </div>
                     
                     <p className="text-[10px] text-zinc-500 leading-tight pt-2 border-t border-dark-800/50">
                         <strong>Nota:</strong> O teste envia um registro fictício ("TESTE DE CONEXÃO"). Se ele aparecer na sua planilha, a integração está funcionando.
                     </p>
                </div>
            </div>

            {/* Backup Section */}
            <div className="space-y-3 sm:space-y-4">
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
                        <span className="font-medium text-zinc-300">Backup Automático</span>
                        <span className="text-[10px] text-zinc-500">Baixa arquivo JSON ao salvar</span>
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
                        <span className="text-sm font-medium text-zinc-300 text-center">Baixar Manualmente</span>
                    </button>
                    
                    <button 
                        onClick={handleImportClick}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-dark-950 border border-dark-800 rounded-xl hover:border-amber-500/50 hover:bg-dark-800 transition-all group"
                    >
                        <div className="p-2 bg-amber-500/10 rounded-full text-amber-400 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300 text-center">Restaurar Backup</span>
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
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
                <Save className="w-5 h-5" />
                Salvar Configurações
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;