import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, History, FileCheck, Settings, Package, BarChart3 } from 'lucide-react';
import AssignmentForm from './components/AssignmentForm';
import HistoryTable from './components/HistoryTable';
import StatsCard from './components/StatsCard';
import StockModal from './components/StockModal';
import SettingsModal from './components/SettingsModal';
import CatalogModal from './components/CatalogModal';
import CollaboratorModal from './components/CollaboratorModal';
import { EpiRecord, AutoDeleteConfig, EpiCatalogItem, Collaborator } from './types';

const App: React.FC = () => {
  // Load initial state from local storage or empty array
  const [records, setRecords] = useState<EpiRecord[]>(() => {
    try {
      const saved = localStorage.getItem('epi_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => ({
             ...r,
             items: r.items || (r.ppeName ? [{ id: 'legacy', name: r.ppeName, ca: r.caNumber }] : [])
        }));
      }
    } catch (e) {
      console.error("Erro ao processar registros salvos", e);
    }
    return [];
  });

  // Catalog State
  const [catalog, setCatalog] = useState<EpiCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('epi_catalog');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Collaborators State
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem('epi_collaborators');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Settings / Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);

  const [defaultConfig, setDefaultConfig] = useState<AutoDeleteConfig>(() => {
    try {
      const saved = localStorage.getItem('epi_config');
      return saved ? JSON.parse(saved) : { defaultEnabled: false, defaultValue: 30, defaultUnit: 'days' };
    } catch {
      return { defaultEnabled: false, defaultValue: 30, defaultUnit: 'days' };
    }
  });

  // Save to local storage whenever records change
  useEffect(() => {
    localStorage.setItem('epi_records', JSON.stringify(records));
  }, [records]);

  // Save config to local storage
  useEffect(() => {
    localStorage.setItem('epi_config', JSON.stringify(defaultConfig));
  }, [defaultConfig]);

  // Save catalog to local storage
  useEffect(() => {
    localStorage.setItem('epi_catalog', JSON.stringify(catalog));
  }, [catalog]);

  // Save collaborators to local storage
  useEffect(() => {
    localStorage.setItem('epi_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  // Individual cleanup logic
  const performCleanup = () => {
    const now = new Date().getTime();
    
    setRecords(prev => {
      const filtered = prev.filter(r => {
         if (!r.autoDeleteAt) return true; 
         const expiry = new Date(r.autoDeleteAt).getTime();
         return expiry > now; 
      });

      if (filtered.length !== prev.length) {
        console.log(`Limpeza realizada: ${prev.length - filtered.length} registros expirados removidos`);
      }
      return filtered;
    });
  };

  useEffect(() => {
    performCleanup();
    const interval = setInterval(performCleanup, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddRecord = (newRecord: EpiRecord) => {
    setRecords(prev => [newRecord, ...prev]);

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
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  // Stats calculation
  const totalAssignments = records.length;
  const totalItems = records.reduce((acc, curr) => acc + (curr.items ? curr.items.length : 0), 0);
  const uniqueEmployees = new Set(records.map(r => r.employeeName)).size;
  
  return (
    <div className="min-h-screen bg-dark-950 pb-12 text-zinc-100">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-900/50">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">Gestão EPI Luandre</h1>
            <h1 className="text-xl font-bold text-white tracking-tight sm:hidden">Luandre EPI</h1>
          </div>
          <div className="flex items-center gap-2">
            
            <button 
              onClick={() => setIsCollabOpen(true)}
              className="p-2 px-3 text-zinc-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent"
              title="Gerenciar Colaboradores"
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:inline">Colaboradores</span>
            </button>

            <button 
              onClick={() => setIsCatalogOpen(true)}
              className="p-2 px-3 text-zinc-400 hover:text-amber-400 hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent"
              title="Catálogo de EPIs"
            >
              <Package className="w-5 h-5" />
              <span className="hidden md:inline">Catálogo de EPI</span>
            </button>

            <button 
              onClick={() => setIsStockOpen(true)}
              className="p-2 px-3 text-zinc-400 hover:text-purple-400 hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent"
              title="Monitorar Estoque"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden md:inline">Estoque</span>
            </button>

            <div className="h-6 w-px bg-dark-700 mx-1"></div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2"
              title="Configurações do Sistema"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Assignment Form (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <AssignmentForm 
              onAdd={handleAddRecord} 
              catalog={catalog}
              collaborators={collaborators}
              onOpenCatalog={() => setIsCatalogOpen(true)}
              onOpenCollaborators={() => setIsCollabOpen(true)}
              defaultConfig={defaultConfig}
            />
          </div>

          {/* Right Column: History Table (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-[500px]">
             <HistoryTable records={records} onDelete={handleDeleteRecord} />
          </div>
        </div>
      </main>

      {/* Separate Modals */}
      <CollaboratorModal
        isOpen={isCollabOpen}
        onClose={() => setIsCollabOpen(false)}
        collaborators={collaborators}
        onUpdateCollaborators={setCollaborators}
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
        onRunCleanup={performCleanup}
      />
    </div>
  );
};

export default App;