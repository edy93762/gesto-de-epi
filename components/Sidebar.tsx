
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
    { id: 'new-delivery', label: 'Registrar Saída', icon: ClipboardList },
    { id: 'deliveries', label: 'Histórico', icon: FileText },
    { id: 'epis', label: 'Cadastro EPI', icon: HardHat },
    { id: 'collaborators', label: 'Equipe', icon: Users },
  ] as const;

  return (
    <>
      <div className="hidden md:flex w-64 bg-slate-950 text-white flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20 border-r border-slate-900 shadow-2xl">
        <div className="p-8 border-b border-slate-900">
          <h1 className="text-xl font-black flex items-center gap-3 tracking-tighter italic uppercase">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
              <HardHat size={20} />
            </div>
            Gestão de EPI
          </h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Almoxarifado Digital</p>
        </div>
        <nav className="flex-1 py-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id} className="px-4">
                  <button
                    onClick={() => onChangeView(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-500 hover:text-white hover:bg-slate-900'
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
        <div className="p-8 border-t border-slate-900">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Usuário Logado</p>
            <p className="text-white text-[11px] truncate font-bold">ALMOX_MASTER</p>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 z-50 px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <nav className="flex justify-around items-center h-16">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive ? 'text-blue-500' : 'text-slate-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
