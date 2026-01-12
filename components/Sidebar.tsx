
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, HardHat, FileText, ClipboardList } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'new-delivery', label: 'Entrega', icon: ClipboardList },
    { id: 'deliveries', label: 'Histórico', icon: FileText },
    { id: 'epis', label: 'EPIs', icon: HardHat },
    { id: 'collaborators', label: 'Equipe', icon: Users },
  ] as const;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HardHat className="text-yellow-500" />
            Controle EPI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gestão de Segurança</p>
        </div>
        <nav className="flex-1 py-4">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onChangeView(item.id)}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white border-r-4 border-yellow-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-6 border-t border-slate-700 text-xs text-slate-500">
          <p>Usuário Logado:</p>
          <p className="text-slate-300 truncate">admin@empresa.com.br</p>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 pb-safe">
        <nav className="flex justify-around items-center h-16">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <Icon size={20} className={isActive ? 'animate-bounce-short' : ''} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {item.label}
                </span>
                {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
