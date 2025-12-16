import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Users, History, FileCheck, Settings, Package, BarChart3, Loader2, Database, UploadCloud, X } from 'lucide-react';
import AssignmentForm from './components/AssignmentForm';
import HistoryTable from './components/HistoryTable';
import StatsCard from './components/StatsCard';
import StockModal from './components/StockModal';
import SettingsModal from './components/SettingsModal';
import CatalogModal from './components/CatalogModal';
import CollaboratorModal from './components/CollaboratorModal';
import { EpiRecord, AutoDeleteConfig, EpiCatalogItem, Collaborator } from './types';
import * as db from './utils/db';

// URL Fixa solicitada pelo usuário
const FIXED_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx3NKcMf8Y5CQOnevTCExz7ehQWLqaCv22MDzUHyxla2ara9-bN4eWPwYdWQ2nhmMkV_w/exec";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [records, setRecords] = useState<EpiRecord[]>([]);
  const [catalog, setCatalog] = useState<EpiCatalogItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  
  // Configuração Padrão agora com URL fixa
  const [defaultConfig, setDefaultConfig] = useState<AutoDeleteConfig>({ 
    autoBackup: true,
    googleSheetsUrl: FIXED_SHEETS_URL
  });

  // Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  // Temporary state for transferring photo from Assignment to Registration
  const [tempRegisterPhoto, setTempRegisterPhoto] = useState<string | null>(null);

  // Reference for invisible file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIAL DATA LOADING (IndexedDB) ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await db.initDB();
        
        const [loadedRecords, loadedCatalog, loadedCollabs, loadedConfig] = await Promise.all([
          db.getAllData<EpiRecord>('records'),
          db.getAllData<EpiCatalogItem>('catalog'),
          db.getAllData<Collaborator>('collaborators'),
          db.getConfig()
        ]);

        // Fix legacy data structure if needed
        const processedRecords = loadedRecords.map((r: any) => ({
             ...r,
             items: r.items || (r.ppeName ? [{ id: 'legacy', name: r.ppeName, ca: r.caNumber }] : [])
        }));

        setRecords(processedRecords);
        setCatalog(loadedCatalog);
        setCollaborators(loadedCollabs);
        
        if (loadedConfig) {
          // Se já existe config salva, usa ela, mas garante a URL se estiver vazia
          setDefaultConfig((prev) => ({ 
            ...prev, 
            ...loadedConfig,
            googleSheetsUrl: loadedConfig.googleSheetsUrl || FIXED_SHEETS_URL
          }));
        } else {
          // Se não existe config (primeira vez), força o padrão com URL e salva
          const initialConfig = { 
            autoBackup: true,
            googleSheetsUrl: FIXED_SHEETS_URL
          };
          setDefaultConfig(initialConfig);
          await db.saveConfig(initialConfig);
        }

      } catch (error) {
        console.error("Erro ao carregar banco de dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // --- PERSISTENCE EFFECT (Save on Change) ---
  
  // Save Records
  useEffect(() => {
    if (!isLoading) {
      db.saveAllData('records', records).catch(e => console.error("Erro ao salvar registros:", e));
    }
  }, [records, isLoading]);

  // Save Catalog
  useEffect(() => {
    if (!isLoading) {
      db.saveAllData('catalog', catalog).catch(e => console.error("Erro ao salvar catálogo:", e));
    }
  }, [catalog, isLoading]);

  // Save Collaborators
  useEffect(() => {
    if (!isLoading) {
      db.saveAllData('collaborators', collaborators).catch(e => console.error("Erro ao salvar colaboradores:", e));
    }
  }, [collaborators, isLoading]);

  // Save Config
  useEffect(() => {
    if (!isLoading) {
      db.saveConfig(defaultConfig).catch(e => console.error("Erro ao salvar config:", e));
    }
  }, [defaultConfig, isLoading]);

  // --- HELPER PARA DOWNLOAD AUTOMÁTICO ---
  const downloadBackupData = (currentRecords: EpiRecord[], currentCatalog: EpiCatalogItem[], currentCollabs: Collaborator[], currentConfig: AutoDeleteConfig) => {
    const fullData = {
        records: currentRecords,
        catalog: currentCatalog,
        collaborators: currentCollabs,
        config: currentConfig
    };
    const dataStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // FORMATO DE DATA E HORA
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');

    link.href = url;
    link.download = `backup_gestao_epi_${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddRecord = (newRecord: EpiRecord) => {
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);

    // Decrease Stock Logic
    const updatedCatalog = catalog.map(catItem => {
      const countDelivered = newRecord.items.filter(deliveredItem => deliveredItem.code === catItem.code).length;
      
      if (countDelivered > 0) {
        const newStock = Math.max(0, (catItem.stock || 0) - countDelivered);
        return { ...catItem, stock: newStock };
      }
      return catItem;
    });

    setCatalog(updatedCatalog);

    // DOWNLOAD AUTOMÁTICO SE ATIVADO
    if (defaultConfig.autoBackup) {
        // Usamos um pequeno timeout para não travar a UI
        setTimeout(() => {
            downloadBackupData(updatedRecords, updatedCatalog, collaborators, defaultConfig);
        }, 500);
    }
  };

  // Função chamada pelo formulário para renovar o "visto" do colaborador
  const handleUpdateCollaboratorActivity = (collabId: string) => {
    setCollaborators(prev => prev.map(c => 
        c.id === collabId 
        ? { ...c, lastActivityDate: new Date().toISOString() } 
        : c
    ));
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Deseja realmente apagar este registro?")) {
        setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleImportBackup = (data: any) => {
    try {
        // Lógica de Substituição Total (Overwrite)
        if (confirm("ATENÇÃO: Restaurar o backup irá SUBSTITUIR TODOS os dados atuais pelos dados do arquivo. \n\nOs dados atuais serão apagados. Deseja continuar?")) {
            // Limpa estados primeiro para garantir
            setRecords([]);
            setCatalog([]);
            setCollaborators([]);

            // Aplica novos dados
            if (data.records) setRecords(data.records);
            if (data.catalog) setCatalog(data.catalog);
            if (data.collaborators) setCollaborators(data.collaborators);
            
            // Ao importar, mantém o autoBackup ligado se o usuário quiser, ou usa o do arquivo se preferir.
            // Também garante que a URL fixa seja mantida se o backup não tiver URL
            const newConfig = data.config || defaultConfig;
            setDefaultConfig({ 
                ...newConfig, 
                autoBackup: true,
                googleSheetsUrl: newConfig.googleSheetsUrl || FIXED_SHEETS_URL
            }); 
            
            alert('Backup restaurado com sucesso! Os dados antigos foram substituídos.');
        }
    } catch (e) {
        alert('Erro ao restaurar backup. Arquivo inválido.');
        console.error(e);
    }
  };

  // Handler para o input de arquivo oculto no cabeçalho
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);
            handleImportBackup(parsedData);
        } catch (error) {
            alert("Erro ao ler arquivo. Certifique-se de que é um backup válido.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Callback to open registration modal with a photo from assignment screen
  const handleRegisterWithPhoto = (photo: string) => {
    setTempRegisterPhoto(photo);
    setIsCollabOpen(true);
  };

  // --- RENDER ---
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <h2 className="text-xl font-semibold">Carregando Banco de Dados...</h2>
        <p className="text-zinc-500 mt-2 text-sm">Preparando ambiente offline.</p>
      </div>
    );
  }

  // Stats calculation
  const totalAssignments = records.length;
  const totalItems = records.reduce((acc, curr) => acc + (curr.items ? curr.items.length : 0), 0);
  const uniqueEmployees = new Set(records.map(r => r.employeeName)).size;

  return (
    <div className="min-h-screen bg-dark-950 pb-12 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Hidden File Input for Quick Restore */}
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".json"
      />

      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-30 backdrop-blur-md bg-opacity-95 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-brand-600 p-1.5 sm:p-2 rounded-lg shadow-lg shadow-brand-900/50">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            
            <div className="hidden min-[380px]:block">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">Gestão de EPI</h1>
              <div className="flex items-center gap-1.5 sm:hidden">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span className="text-xs text-zinc-400">Conectado</span>
              </div>
            </div>
            
            {/* Database Indicator & Quick Restore */}
            <div className="flex items-center gap-2 ml-1">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
                <Database className="w-3 h-3" />
                <span>Banco Local</span>
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-full text-amber-400 text-xs font-medium transition-colors"
                title="Restaurar Backup (Arquivo)"
              >
                <UploadCloud className="w-3 h-3" />
                <span className="hidden sm:inline">Restaurar</span>
                <span className="sm:hidden">Rest.</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 ml-2">
            
            {/* NOVO: Botão de Toggle do Histórico */}
            <button
                onClick={() => setIsHistorySidebarOpen(true)}
                className="p-2 sm:px-3 text-zinc-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent bg-dark-800/50"
            >
                <History className="w-5 h-5" />
                <span className="hidden md:inline">Histórico</span>
            </button>
            
            <div className="h-6 w-px bg-dark-700 mx-0.5 sm:mx-1"></div>

            <button 
              onClick={() => {
                setTempRegisterPhoto(null);
                setIsCollabOpen(true);
              }}
              className="p-2 sm:px-3 text-zinc-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent"
              title="Gerenciar Colaboradores"
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:inline">Colaboradores</span>
            </button>

            <button 
              onClick={() => setIsCatalogOpen(true)}
              className="p-2 sm:px-3 text-zinc-400 hover:text-amber-400 hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent"
              title="Catálogo de EPIs"
            >
              <Package className="w-5 h-5" />
              <span className="hidden md:inline">Catálogo</span>
            </button>

            <button 
              onClick={() => setIsStockOpen(true)}
              className="p-2 sm:px-3 text-zinc-400 hover:text-purple-400 hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent"
              title="Monitorar Estoque"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden md:inline">Estoque</span>
            </button>

            <div className="h-6 w-px bg-dark-700 mx-0.5 sm:mx-1"></div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg transition-colors flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-dark-800"
              title="Configurações do Sistema"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full relative z-10 flex flex-col gap-6">
        
        {/* Centralized Assignment Form (Full Focus) */}
        <div className="flex justify-center">
            {/* max-w-6xl para acomodar melhor as duas colunas */}
            <div className="w-full max-w-6xl">
                 <AssignmentForm 
                  onAdd={handleAddRecord} 
                  catalog={catalog}
                  collaborators={collaborators}
                  records={records}
                  onOpenCatalog={() => setIsCatalogOpen(true)}
                  onOpenCollaborators={() => {
                      setTempRegisterPhoto(null);
                      setIsCollabOpen(true);
                  }}
                  onRegisterNew={(photo) => handleRegisterWithPhoto(photo)}
                  onUpdateCollaboratorActivity={handleUpdateCollaboratorActivity}
                  defaultConfig={defaultConfig}
                />
            </div>
        </div>

        {/* Stats Section moved below form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 max-w-6xl mx-auto w-full">
          <StatsCard 
            title="Total de Fichas" 
            value={totalAssignments} 
            icon={FileCheck} 
            color="bg-emerald-500" 
          />
          <StatsCard 
            title="Colaboradores Ativos" 
            value={uniqueEmployees} 
            icon={Users} 
            color="bg-blue-500" 
          />
          <StatsCard 
            title="Itens Entregues (Total)" 
            value={totalItems} 
            icon={History} 
            color="bg-amber-500" 
          />
        </div>
      </main>

      {/* --- HISTORY SIDEBAR --- */}
      {/* Overlay Backdrop */}
      {isHistorySidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setIsHistorySidebarOpen(false)}
          />
      )}
      
      {/* Sliding Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-dark-900 border-l border-dark-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
            isHistorySidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950">
             <div className="flex items-center gap-2">
                 <History className="w-5 h-5 text-brand-500" />
                 <h2 className="text-lg font-bold text-white">Histórico de Entregas</h2>
             </div>
             <button 
                onClick={() => setIsHistorySidebarOpen(false)}
                className="p-2 hover:bg-dark-800 rounded-full text-zinc-400 hover:text-white transition-colors"
             >
                 <X className="w-5 h-5" />
             </button>
        </div>
        
        <div className="flex-1 overflow-hidden p-2 bg-dark-950/30">
            {/* Passando compact={true} para forçar o modo cartão */}
            <HistoryTable 
                records={records} 
                onDelete={handleDeleteRecord} 
                compact={true} 
            />
        </div>
      </div>


      {/* Modals */}
      <CollaboratorModal
        isOpen={isCollabOpen}
        onClose={() => setIsCollabOpen(false)}
        collaborators={collaborators}
        onUpdateCollaborators={setCollaborators}
        initialPhoto={tempRegisterPhoto}
        records={records} 
      />

      <CatalogModal 
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        catalog={catalog}
        onUpdateCatalog={setCatalog}
      />

      <StockModal 
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
        catalog={catalog}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={defaultConfig}
        onSaveConfig={setDefaultConfig}
        onRunCleanup={() => {}} 
        fullData={{ records, catalog, collaborators, config: defaultConfig }}
        onImportData={handleImportBackup}
      />
    </div>
  );
};

export default App;