
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Deliveries } from './components/Deliveries';
import { NewDeliveryForm } from './components/NewDeliveryForm';
import { CollaboratorsList } from './components/CollaboratorsList';
import { CollaboratorForm } from './components/CollaboratorForm';
import { EPIForm } from './components/EPIForm';
import { EPIList } from './components/EPIList';
import { Login } from './components/Login';
import { Collaborator, EPI, Delivery, ViewState } from './types';
import { CheckCircle2 } from 'lucide-react';

const INITIAL_EPIS: EPI[] = [
  {
    id: 'CAP-01',
    description: 'Capacete de Proteção Jugular',
    category: 'Cabeça',
    active: true,
    createdAt: new Date().toISOString(),
    ca: '34.414',
    validityCA: '2026-10-15'
  }
];

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPublicRegister, setIsPublicRegister] = useState(false);
  
  // App State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [epis, setEpis] = useState<EPI[]>(INITIAL_EPIS);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  // Carrega dados locais
  useEffect(() => {
    const savedCols = localStorage.getItem('epi_cols');
    const savedEpis = localStorage.getItem('epi_data');
    const savedDels = localStorage.getItem('epi_deliveries');
    const savedAuth = localStorage.getItem('epi_auth');
    
    if (savedCols) setCollaborators(JSON.parse(savedCols));
    if (savedEpis) setEpis(JSON.parse(savedEpis));
    if (savedDels) setDeliveries(JSON.parse(savedDels));
    if (savedAuth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('epi_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('epi_auth');
    setCurrentView('dashboard');
  };

  const handleAddCollaborator = (newCol: Collaborator) => {
    const updated = [...collaborators, newCol];
    setCollaborators(updated);
    localStorage.setItem('epi_cols', JSON.stringify(updated));
    
    if (isPublicRegister) {
      alert("Cadastro realizado com sucesso! Solicite seu EPI no balcão.");
      setIsPublicRegister(false);
    }
  };

  const handleSaveDeliveries = (newDeliveries: Delivery[]) => {
    const updated = [...newDeliveries, ...deliveries];
    setDeliveries(updated);
    localStorage.setItem('epi_deliveries', JSON.stringify(updated));
    setCurrentView('deliveries');
  };

  // --- RENDERIZAÇÃO PÚBLICA (LOGIN / REGISTRO) ---

  if (!isAuthenticated) {
    if (isPublicRegister) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300">
             <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Auto-Cadastro</h2>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Preencha seus dados para retirada de EPI</p>
             </div>
             <CollaboratorForm 
                onSave={handleAddCollaborator} 
                onCancel={() => setIsPublicRegister(false)} 
                isModal={false}
             />
          </div>
        </div>
      );
    }
    return <Login onLogin={handleLogin} onPublicRegister={() => setIsPublicRegister(true)} />;
  }

  // --- RENDERIZAÇÃO PRIVADA (DASHBOARD) ---

  const renderContent = () => {
    const stats = {
      collaborators: collaborators.length,
      epis: epis.length,
      deliveries: deliveries.length
    };

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={setCurrentView} 
            stats={stats} 
            recentDeliveries={deliveries}
            allCollaborators={collaborators}
            allEpis={epis}
          />
        );
      case 'deliveries':
        return <Deliveries deliveries={deliveries} epis={epis} collaborators={collaborators} />;
      case 'new-delivery':
        return (
          <NewDeliveryForm 
            collaborators={collaborators} 
            epis={epis} 
            onSave={handleSaveDeliveries}
            onAddCollaborator={handleAddCollaborator}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'collaborators':
        return (
          <CollaboratorsList 
            collaborators={collaborators} 
            onAddClick={() => setCurrentView('new-collaborator')} 
            onDelete={(id) => {
              const updated = collaborators.filter(c => c.id !== id);
              setCollaborators(updated);
              localStorage.setItem('epi_cols', JSON.stringify(updated));
            }}
          />
        );
      case 'new-collaborator':
        return (
          <CollaboratorForm 
            onSave={(c) => { handleAddCollaborator(c); setCurrentView('collaborators'); }} 
            onCancel={() => setCurrentView('collaborators')} 
          />
        );
      case 'epis':
        return <EPIList epis={epis} onAddClick={() => setCurrentView('new-epi')} onDelete={(id) => {
          const updated = epis.filter(e => e.id !== id);
          setEpis(updated);
          localStorage.setItem('epi_data', JSON.stringify(updated));
        }} />;
      case 'new-epi':
        return <EPIForm existingEpis={epis} onSave={(e) => {
          const updated = [...epis, e];
          setEpis(updated);
          localStorage.setItem('epi_data', JSON.stringify(updated));
          setCurrentView('epis');
        }} onCancel={() => setCurrentView('epis')} />;
      default:
        return <Dashboard onNavigate={setCurrentView} stats={stats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100 pb-20 md:pb-0 selection:bg-blue-600/30">
      <Sidebar currentView={currentView} onChangeView={(v) => {
         setCurrentView(v);
      }} />
      
      {/* Botão Sair Flutuante (Mobile/Desktop) */}
      <button 
        onClick={handleLogout} 
        className="fixed top-6 right-6 z-50 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-colors"
      >
        Sair
      </button>

      <main className="flex-1 md:ml-64 p-4 md:p-10 transition-all overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
