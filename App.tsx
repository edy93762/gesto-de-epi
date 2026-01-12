
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
import { DatabaseService } from './services/db';
import { Loader2 } from 'lucide-react';

const INITIAL_EPI: EPI = {
    id: 'CAP-01',
    description: 'Capacete de Proteção Jugular',
    active: true,
    createdAt: new Date().toISOString(),
    stock: 100 // Estoque Inicial Padrão
};

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPublicRegister, setIsPublicRegister] = useState(false);
  
  // App State
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [epis, setEpis] = useState<EPI[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  // Inicialização do Banco de Dados
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        // 1. Inicializa DB (Cria tabelas se necessário)
        await DatabaseService.init();

        // 3. Carrega dados
        const dbCollaborators = await DatabaseService.getCollaborators();
        const dbEpis = await DatabaseService.getEpis();
        const dbDeliveries = await DatabaseService.getDeliveries();

        setCollaborators(dbCollaborators);
        setDeliveries(dbDeliveries);

        // Se não houver EPIs, cria o inicial
        if (dbEpis.length === 0) {
            await DatabaseService.addEpi(INITIAL_EPI);
            setEpis([INITIAL_EPI]);
        } else {
            setEpis(dbEpis);
        }

        // Verifica auth local (apenas visual, segurança real seria no backend)
        const savedAuth = localStorage.getItem('epi_auth');
        if (savedAuth === 'true') setIsAuthenticated(true);

      } catch (error) {
        console.error("Falha ao inicializar app:", error);
        alert("Erro ao conectar ao Banco de Dados Neon. Verifique o console.");
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
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

  const handleAddCollaborator = async (newCol: Collaborator) => {
    try {
      await DatabaseService.addCollaborator(newCol);
      setCollaborators(prev => [...prev, newCol]);
      
      if (isPublicRegister) {
        alert("Cadastro salvo no Banco de Dados! Solicite seu EPI.");
        setIsPublicRegister(false);
      }
    } catch (e) {
      alert("Erro ao salvar colaborador no banco.");
    }
  };

  const handleDeleteCollaborator = async (id: string) => {
      try {
          await DatabaseService.deleteCollaborator(id);
          setCollaborators(prev => prev.filter(c => c.id !== id));
      } catch (e) {
          alert("Erro ao excluir colaborador.");
      }
  };

  const handleSaveDeliveries = async (newDeliveries: Delivery[]) => {
    try {
      // Salva um por um no banco (inclui decremento de estoque no backend)
      for (const d of newDeliveries) {
          await DatabaseService.addDelivery(d);
      }
      
      // Atualiza entregas
      setDeliveries(prev => [...newDeliveries, ...prev]);

      // Atualiza estoque localmente (para a UI refletir imediatamente)
      const usedEpiIds = newDeliveries.map(d => d.epiId);
      setEpis(prev => prev.map(epi => {
          if (usedEpiIds.includes(epi.id)) {
              return { ...epi, stock: Math.max(0, epi.stock - 1) };
          }
          return epi;
      }));

      setCurrentView('deliveries');
    } catch (e) {
        alert("Erro ao salvar entregas no banco.");
    }
  };

  const handleAddEpi = async (newEpi: EPI) => {
      try {
          await DatabaseService.addEpi(newEpi);
          setEpis(prev => [...prev, newEpi]);
          setCurrentView('epis');
      } catch (e) {
          alert("Erro ao salvar EPI.");
      }
  };

  const handleDeleteEpi = async (id: string) => {
      try {
          await DatabaseService.deleteEpi(id);
          setEpis(prev => prev.filter(e => e.id !== id));
      } catch (e) {
          alert("Erro ao excluir EPI.");
      }
  };

  // Função utilitária para limpar entregas manualmente (se necessário)
  const handleWipeDeliveries = async () => {
      if(confirm("Tem certeza que deseja APAGAR TODAS as fichas de entrega do banco de dados?")) {
          await DatabaseService.deleteAllDeliveries();
          setDeliveries([]);
          alert("Banco de entregas limpo.");
      }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="uppercase font-black tracking-widest text-xs">Conectando ao Banco de Dados...</p>
      </div>
    );
  }

  // --- RENDERIZAÇÃO PÚBLICA (LOGIN / REGISTRO) ---

  if (!isAuthenticated) {
    if (isPublicRegister) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300">
             <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Auto-Cadastro</h2>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Seus dados serão salvos no Banco de Dados</p>
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
        return (
             <div className="relative">
                 <button 
                    onClick={handleWipeDeliveries} 
                    className="absolute top-0 right-0 z-10 text-[9px] bg-red-900/20 text-red-500 border border-red-900/50 px-3 py-2 rounded-lg hover:bg-red-900/50 uppercase font-black tracking-widest"
                 >
                    Apagar Tudo (Admin)
                 </button>
                 <Deliveries deliveries={deliveries} epis={epis} collaborators={collaborators} />
             </div>
        );
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
            onDelete={handleDeleteCollaborator}
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
        return <EPIList epis={epis} onAddClick={() => setCurrentView('new-epi')} onDelete={handleDeleteEpi} />;
      case 'new-epi':
        return <EPIForm existingEpis={epis} onSave={handleAddEpi} onCancel={() => setCurrentView('epis')} />;
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
