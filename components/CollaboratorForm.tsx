
import React, { useState, useEffect } from 'react';
import { Collaborator } from '../types';
import { generateId } from '../utils/helpers';
import { UserPlus, X, User, Briefcase, UserCheck, Building2, Save, Mail } from 'lucide-react';

interface CollaboratorFormProps {
  onSave: (collaborator: Collaborator) => void;
  onCancel: () => void;
  isModal?: boolean;
}

interface SavedManager {
  name: string;
  email: string;
}

export const CollaboratorForm: React.FC<CollaboratorFormProps> = ({ onSave, onCancel, isModal = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    matricula: '',
    sector: '',
    role: '',
    branch: '',
    managerName: '',
    managerEmail: '',
  });

  const [savedManagers, setSavedManagers] = useState<SavedManager[]>([]);

  // Carrega gestores salvos ao abrir o formulário
  useEffect(() => {
    const stored = localStorage.getItem('saved_managers');
    if (stored) {
      setSavedManagers(JSON.parse(stored));
    }
  }, []);

  const handleManagerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Tenta encontrar o gestor na lista salva para preencher o email automaticamente
    const foundManager = savedManagers.find(m => m.name.toLowerCase() === val.toLowerCase());
    
    setFormData(prev => ({
      ...prev,
      managerName: val,
      managerEmail: foundManager ? foundManager.email : prev.managerEmail
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação extra caso o browser não pegue
    if (!formData.managerEmail) {
      alert("O E-mail do Gestor é obrigatório.");
      return;
    }

    // Salva o gestor atual na lista de recentes (evita duplicatas pelo nome)
    const newManager = { name: formData.managerName, email: formData.managerEmail };
    const updatedManagers = [
      newManager,
      ...savedManagers.filter(m => m.name.toLowerCase() !== newManager.name.toLowerCase())
    ];
    localStorage.setItem('saved_managers', JSON.stringify(updatedManagers));

    onSave({ ...formData, id: generateId('COL'), active: true });
  };

  return (
    <div className={`bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden ${isModal ? "w-full max-h-[90vh] overflow-y-auto" : "max-w-2xl mx-auto mb-12"}`}>
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <UserPlus className="text-blue-500" size={24} /> Novo Colaborador
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cadastro Administrativo</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors p-2"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* DADOS DO FORMULÁRIO */}
        <section className="space-y-6">
          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
               <User size={14} className="text-emerald-500" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação Pessoal</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Empresa / Agência</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-4 top-4.5 text-slate-500" />
                  <input required type="text" className="w-full pl-10 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} placeholder="Ex: Shopee, Mercado Livre..." />
                </div>
              </div>
               <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">CPF / Matrícula</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
               <Briefcase size={14} className="text-orange-500" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados Operacionais & Gestão</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Setor</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><UserCheck size={10} /> Nome do Gestor</label>
                        <input 
                            required 
                            type="text" 
                            list="managers-list"
                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" 
                            value={formData.managerName} 
                            onChange={handleManagerNameChange} 
                            placeholder="Nome do Responsável" 
                            autoComplete="off"
                        />
                        <datalist id="managers-list">
                            {savedManagers.map((mgr, idx) => (
                                <option key={idx} value={mgr.name} />
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2 text-blue-400"><Mail size={10} /> E-mail do Gestor (Obrigatório)</label>
                        <input required type="email" className="w-full p-4 bg-slate-950 border border-blue-500/30 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.managerEmail} onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })} placeholder="email@empresa.com" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
          <button type="submit" className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase text-[11px] tracking-widest shadow-2xl flex items-center gap-3">
            <Save size={18} /> Salvar Cadastro
          </button>
        </div>
      </form>
    </div>
  );
};
