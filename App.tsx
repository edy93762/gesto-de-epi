
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Deliveries } from './components/Deliveries';
import { NewDeliveryForm } from './components/NewDeliveryForm';
import { CollaboratorsList } from './components/CollaboratorsList';
import { CollaboratorForm } from './components/CollaboratorForm';
import { EPIForm } from './components/EPIForm';
import { Inventory } from './components/Inventory';
import { Collaborator, EPI, Delivery, ViewState } from './types';

const INITIAL_EPIS: EPI[] = [
  {
    id: 'LUV-01',
    description: 'Luva de Vaqueta Cano Curto',
    category: 'Proteção das Mãos',
    ca: '12345',
    validityCA: '2026-12-31',
    shelfLifeDays: 90,
    location: 'Prateleira A-10',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'CAP-01',
    description: 'Capacete de Segurança com Aba',
    category: 'Proteção de Cabeça',
    ca: '54321',
    validityCA: '2025-06-15',
    shelfLifeDays: 365,
    location: 'Estante B-02',
    active: true,
    createdAt: new Date().toISOString()
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [epis, setEpis] = useState<EPI[]>(INITIAL_EPIS);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    const savedCols = localStorage.getItem('epi_cols');
    const savedEpis = localStorage.getItem('epi_data');
    const savedDels = localStorage.getItem('epi_deliveries');
    
    if (savedCols) setCollaborators(JSON.parse(savedCols));
    if (savedEpis) setEpis(JSON.parse(savedEpis));
    if (savedDels) setDeliveries(JSON.parse(savedDels));
  }, []);

  const handleAddCollaborator = (newCol: Collaborator) => {
    const updated = [...collaborators, newCol];
    setCollaborators(updated);
    localStorage.setItem('epi_cols', JSON.stringify(updated));
  };

  const handleDeleteCollaborator = (id: string) => {
    if (window.confirm('Deseja realmente excluir este colaborador? O histórico de entregas permanecerá intacto.')) {
      const updated = collaborators.filter(c => c.id !== id);
      setCollaborators(updated);
      localStorage.setItem('epi_cols', JSON.stringify(updated));
    }
  };

  const handleAddEPI = (newEpi: EPI) => {
    const updated = [...epis, newEpi];
    setEpis(updated);
    localStorage.setItem('epi_data', JSON.stringify(updated));
    setCurrentView('epis');
  };

  const handleDeleteEPI = (id: string) => {
    if (window.confirm('Deseja realmente excluir este EPI?')) {
      const updated = epis.filter(e => e.id !== id);
      setEpis(updated);
      localStorage.setItem('epi_data', JSON.stringify(updated));
    }
  };

  const handleSaveDelivery = (delivery: Delivery) => {
    const updated = [delivery, ...deliveries];
    setDeliveries(updated);
    localStorage.setItem('epi_deliveries', JSON.stringify(updated));
    setCurrentView('deliveries');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard deliveries={deliveries} epis={epis} collaborators={collaborators} onNavigate={setCurrentView} />;
      case 'deliveries':
        return <Deliveries deliveries={deliveries} epis={epis} collaborators={collaborators} />;
      case 'new-delivery':
        return (
          <NewDeliveryForm 
            collaborators={collaborators} 
            epis={epis} 
            onSave={handleSaveDelivery}
            onAddCollaborator={handleAddCollaborator}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'collaborators':
        return (
          <CollaboratorsList 
            collaborators={collaborators} 
            onAddClick={() => setCurrentView('new-collaborator')} 
            onDelete={handleDeleteCollaborator}
          />
        );
      case 'new-collaborator':
        return <CollaboratorForm onSave={(c) => { handleAddCollaborator(c); setCurrentView('collaborators'); }} onCancel={() => setCurrentView('collaborators')} />;
      case 'epis':
        return <Inventory epis={epis} onAddClick={() => setCurrentView('new-epi')} onDelete={handleDeleteEPI} />;
      case 'new-epi':
        return <EPIForm existingEpis={epis} onSave={handleAddEPI} onCancel={() => setCurrentView('epis')} />;
      default:
        return <Dashboard deliveries={deliveries} epis={epis} collaborators={collaborators} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all overflow-x-hidden">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
