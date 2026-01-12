import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, HardHat, FileText, ClipboardList } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-delivery', label: 'Nova Entrega', icon: ClipboardList },
    { id: 'deliveries', label: 'Histórico Entregas', icon: FileText },
    { id: 'epis', label: 'Catálogo EPIs', icon: HardHat },
    { id: 'collaborators', label: 'Colaboradores', icon: Users },
  ] as const;

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-10">
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
  );
};