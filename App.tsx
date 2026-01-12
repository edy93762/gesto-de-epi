import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Deliveries } from './components/Deliveries';
import { NewDeliveryForm } from './components/NewDeliveryForm';
import { CollaboratorsList } from './components/CollaboratorsList';
import { CollaboratorForm } from './components/CollaboratorForm';
import { EPIForm } from './components/EPIForm';
import { Inventory } from './components/Inventory';
import { Collaborator, EPI, Delivery, ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [epis, setEpis] = useState<EPI[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const handleAddCollaborator = (newCol: Collaborator) => {
    setCollaborators([...collaborators, newCol]);
    // Note: Não mudamos a view aqui se estivermos chamando isso de dentro da NewDeliveryForm
  };

  const handleAddEPI = (newEpi: EPI) => {
    setEpis([...epis, newEpi]);
    setCurrentView('epis');
  };

  const handleSaveDelivery = (delivery: Delivery) => {
    setDeliveries([delivery, ...deliveries]);
    setCurrentView('deliveries');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard deliveries={deliveries} epis={epis} collaborators={collaborators} />;
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
        return <CollaboratorsList collaborators={collaborators} onAddClick={() => setCurrentView('new-collaborator')} />;
      case 'new-collaborator':
        return <CollaboratorForm onSave={(c) => { handleAddCollaborator(c); setCurrentView('collaborators'); }} onCancel={() => setCurrentView('collaborators')} />;
      case 'epis':
        return <Inventory epis={epis} onAddClick={() => setCurrentView('new-epi')} />;
      case 'new-epi':
        return <EPIForm existingEpis={epis} onSave={handleAddEPI} onCancel={() => setCurrentView('epis')} />;
      default:
        return <Dashboard deliveries={deliveries} epis={epis} collaborators={collaborators} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;