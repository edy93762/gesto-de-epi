import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Users, History, FileCheck, Settings, Package, BarChart3, Loader2, X } from 'lucide-react';
import AssignmentForm from './components/AssignmentForm';
import HistoryTable from './components/HistoryTable';
import StatsCard from './components/StatsCard';
import StockModal from './components/StockModal';
import SettingsModal from './components/SettingsModal';
import CatalogModal from './components/CatalogModal';
import CollaboratorModal from './components/CollaboratorModal';
import { EpiRecord, AutoDeleteConfig, EpiCatalogItem, Collaborator } from './types';
import * as db from './utils/db';
import { generateEpiPdf } from './utils/pdfGenerator';

const FIXED_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxK6LFZpxcq0AhopiWk8_BEMgyiEvduYSlkd9b3tlxDKCQkt0Taz4uV7goK4RNKTEBF/exec";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<EpiRecord[]>([]);
  const [catalog, setCatalog] = useState<EpiCatalogItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<AutoDeleteConfig>({ 
    autoBackup: true,
    googleSheetsUrl: FIXED_SHEETS_URL
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [tempRegisterPhoto, setTempRegisterPhoto] = useState<string | null>(null);
  const [selectedCollabToEdit, setSelectedCollabToEdit] = useState<string | null>(null);

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
        setRecords(loadedRecords);
        setCatalog(loadedCatalog);
        setCollaborators(loadedCollabs);
        if (loadedConfig) {
          setDefaultConfig((prev) => ({ ...prev, ...loadedConfig, googleSheetsUrl: FIXED_SHEETS_URL }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => { if (!isLoading) db.saveAllData('records', records); }, [records, isLoading]);
  useEffect(() => { if (!isLoading) db.saveAllData('catalog', catalog); }, [catalog, isLoading]);
  useEffect(() => { if (!isLoading) db.saveAllData('collaborators', collaborators); }, [collaborators, isLoading]);
  useEffect(() => { if (!isLoading) db.saveConfig(defaultConfig); }, [defaultConfig, isLoading]);

  // --- SINCRONIZAÇÃO COM GOOGLE SHEETS ---
  const syncToSheets = async (payload: any) => {
    if (!defaultConfig.googleSheetsUrl) return false;
    try {
      await fetch(defaultConfig.googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const syncRecord = (record: EpiRecord) => syncToSheets(record);
  const syncCatalogItem = (item: EpiCatalogItem) => syncToSheets({ ...item, type: 'CATALOG_ITEM' });
  const syncCollaboratorItem = (collab: Collaborator) => syncToSheets({ ...collab, type: 'COLLABORATOR_ITEM' });

  const handleAddRecord = (newRecord: EpiRecord) => {
    setRecords([newRecord, ...records]);
    setCatalog(catalog.map(catItem => {
      const delivered = newRecord.items.filter(i => i.code === catItem.code).length;
      return delivered > 0 ? { ...catItem, stock: Math.max(0, catItem.stock - delivered) } : catItem;
    }));
  };

  const handleEditCollaborator = (id: string) => { setSelectedCollabToEdit(id); setIsCollabOpen(true); };
  const handleRegisterWithPhoto = (photo: string) => { setTempRegisterPhoto(photo); setSelectedCollabToEdit(null); setIsCollabOpen(true); };

  if (isLoading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-dark-950 pb-12 text-zinc-100 flex flex-col">
      <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-30 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold">Gestão de EPI</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsHistorySidebarOpen(true)} className="p-2 flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white"><History className="w-5 h-5" /> Histórico</button>
          <button onClick={() => { setTempRegisterPhoto(null); setSelectedCollabToEdit(null); setIsCollabOpen(true); }} className="p-2 flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white"><Users className="w-5 h-5" /> Colaboradores</button>
          <button onClick={() => setIsCatalogOpen(true)} className="p-2 flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-amber-400"><Package className="w-5 h-5" /> Catálogo</button>
          <button onClick={() => setIsStockOpen(true)} className="p-2 flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-purple-400"><BarChart3 className="w-5 h-5" /> Estoque</button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-400 hover:text-white"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-6">
        <AssignmentForm 
          onAdd={handleAddRecord} catalog={catalog} collaborators={collaborators} records={records}
          onOpenCatalog={() => setIsCatalogOpen(true)}
          onOpenCollaborators={() => setIsCollabOpen(true)}
          onRegisterNew={handleRegisterWithPhoto}
          onUpdateCollaboratorActivity={(id) => setCollaborators(prev => prev.map(c => c.id === id ? { ...c, lastActivityDate: new Date().toISOString() } : c))}
          onEditCollaborator={handleEditCollaborator}
          defaultConfig={defaultConfig}
          onSyncToSheets={syncRecord}
        />
        <div className="grid grid-cols-3 gap-6">
          <StatsCard title="Total de Fichas" value={records.length} icon={FileCheck} color="bg-emerald-500" />
          <StatsCard title="Colaboradores" value={new Set(records.map(r => r.employeeName)).size} icon={Users} color="bg-blue-500" />
          <StatsCard title="Catálogo" value={catalog.length} icon={Package} color="bg-amber-500" />
        </div>
      </main>

      {isHistorySidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsHistorySidebarOpen(false)} />}
      <div className={`fixed inset-y-0 right-0 w-[450px] bg-dark-900 border-l border-dark-800 transform transition-transform duration-300 z-50 flex flex-col ${isHistorySidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-dark-800 flex items-center justify-between"><h2 className="text-lg font-bold">Histórico</h2><button onClick={() => setIsHistorySidebarOpen(false)}><X className="w-5 h-5" /></button></div>
        <div className="flex-1 overflow-hidden p-2"><HistoryTable records={records} onDelete={(id) => confirm("Apagar?") && setRecords(records.filter(r => r.id !== id))} onResend={syncRecord} compact /></div>
      </div>

      <CollaboratorModal isOpen={isCollabOpen} onClose={() => setIsCollabOpen(false)} collaborators={collaborators} onUpdateCollaborators={setCollaborators} records={records} initialPhoto={tempRegisterPhoto} initialCollaboratorId={selectedCollabToEdit} onSync={syncCollaboratorItem} />
      <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} catalog={catalog} onUpdateCatalog={setCatalog} onSync={syncCatalogItem} />
      <StockModal isOpen={isStockOpen} onClose={() => setIsStockOpen(false)} catalog={catalog} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={defaultConfig} onSaveConfig={setDefaultConfig} onRunCleanup={() => {}} fullData={{ records, catalog, collaborators, config: defaultConfig }} onImportData={(d) => { setRecords(d.records || []); setCatalog(d.catalog || []); setCollaborators(d.collaborators || []); }} />
    </div>
  );
};

export default App;