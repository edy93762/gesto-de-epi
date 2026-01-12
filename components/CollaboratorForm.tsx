
import React, { useState, useMemo } from 'react';
import { Collaborator } from '../types';
import { generateId } from '../utils/helpers';
import { UserPlus, X, User, Briefcase, UserCheck, Building2, Save, Mail, Clock, ShieldAlert, Crown } from 'lucide-react';

interface CollaboratorFormProps {
  onSave: (collaborator: Collaborator) => void;
  onCancel: () => void;
  existingCollaborators?: Collaborator[]; // Para checar duplicidade e sugerir nomes
  isModal?: boolean;
}

const HSE_LIST = [
  "Denilson Carvalho",
  "Jessica M Silva",
  "Jonathan Holanda",
  "Matheus Silva",
  "Vinícius Brasileiro",
  "Vinícius Leme"
];

const BRANCH_LIST = [
  "Fulfillment SP1 Franco da Rocha",
  "Fulfillment SP2 Franco da Rocha"
];

export const CollaboratorForm: React.FC<CollaboratorFormProps> = ({ onSave, onCancel, existingCollaborators = [], isModal = false }) => {
  const [formData, setFormData] = useState<Omit<Collaborator, 'id' | 'active'>>({
    name: '',
    cpf: '',
    sector: '',
    role: '',
    branch: '',
    shift: 'T1',
    managerName: '',
    managerEmail: '',
    coordinatorName: '',
    hseName: '',
  });

  // Gera lista única de Gestores já cadastrados para sugestão
  const uniqueManagers = useMemo(() => {
    const names = existingCollaborators.map(c => c.managerName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [existingCollaborators]);

  // Gera lista única de Coordenadores já cadastrados para sugestão
  const uniqueCoordinators = useMemo(() => {
    const names = existingCollaborators.map(c => c.coordinatorName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [existingCollaborators]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificações Básicas
    if (!formData.branch) { alert("Selecione a Unidade (Branch)."); return; }
    if (!formData.hseName) { alert("Selecione o Responsável HSE."); return; }

    // Verificação de Duplicidade (CPF ou Nome Exato)
    const isDuplicate = existingCollaborators.some(
        c => c.cpf.replace(/\D/g, '') === formData.cpf.replace(/\D/g, '') || 
             c.name.toLowerCase() === formData.name.toLowerCase()
    );

    if (isDuplicate) {
        alert("ERRO: Este colaborador já está cadastrado no sistema (CPF ou Nome duplicado).");
        return;
    }

    onSave({ ...formData, id: generateId('COL'), active: true });
  };

  return (
    <div className={`bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden ${isModal ? "w-full max-h-[90vh] overflow-y-auto" : "max-w-2xl mx-auto mb-12"}`}>
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <UserPlus className="text-blue-500" size={24} /> Novo Cadastro
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Preencha seus dados corretamente</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors p-2"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* DADOS PESSOAIS E EMPRESA */}
        <section className="space-y-6">
          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
               <User size={14} className="text-emerald-500" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação Pessoal & Local</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Unidade</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-4 top-4.5 text-slate-500" />
                  <select 
                    required
                    className="w-full pl-10 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold appearance-none"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  >
                    <option value="" disabled>Selecione a Unidade...</option>
                    {BRANCH_LIST.map((b, i) => (
                        <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

               <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">CPF (Apenas números)</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          {/* DADOS OPERACIONAIS */}
          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
               <Briefcase size={14} className="text-orange-500" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados Operacionais & Liderança</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Setor</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} />
              </div>
              <div>
                 <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={10} /> Turno</label>
                 <select 
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                 >
                    <option value="T1">T1 - Manhã</option>
                    <option value="T2">T2 - Tarde</option>
                    <option value="T3">T3 - Noite</option>
                    <option value="T4">T4 - Madrugada</option>
                    <option value="T5">T5 - ADM/Geral</option>
                 </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                <input required type="text" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
              </div>

              {/* LIDERANÇA */}
              <div className="md:col-span-2 border-t border-slate-800/50 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GESTOR IMEDIATO */}
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><UserCheck size={10} /> Gestor Imediato</label>
                        <input 
                            required 
                            type="text" 
                            list="managers-list"
                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" 
                            value={formData.managerName} 
                            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })} 
                            placeholder="Líder direto (Selecione ou Digite)" 
                        />
                        <datalist id="managers-list">
                          {uniqueManagers.map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                    </div>
                     {/* COORDENADOR */}
                     <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Crown size={10} className="text-yellow-500"/> Coordenador</label>
                        <input 
                            required 
                            type="text" 
                            list="coordinators-list"
                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" 
                            value={formData.coordinatorName} 
                            onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })} 
                            placeholder="Coordenador (Selecione ou Digite)" 
                        />
                        <datalist id="coordinators-list">
                          {uniqueCoordinators.map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                    </div>
                    {/* EMAIL GESTOR */}
                    <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2 text-blue-400"><Mail size={10} /> E-mail do Gestor (Obrigatório)</label>
                        <input required type="email" className="w-full p-4 bg-slate-950 border border-blue-500/30 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-white text-sm font-bold" value={formData.managerEmail} onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })} placeholder="email@empresa.com" />
                    </div>
              </div>

              {/* HSE / TÉCNICO SEGURANÇA */}
              <div className="md:col-span-2">
                 <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldAlert size={10} className="text-orange-500"/> Responsável HSE</label>
                 <select
                    required 
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-orange-600 outline-none text-white text-sm font-bold appearance-none"
                    value={formData.hseName}
                    onChange={(e) => setFormData({ ...formData, hseName: e.target.value })}
                >
                    <option value="" disabled>Selecione o HSE responsável...</option>
                    {HSE_LIST.map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                    ))}
                </select>
              </div>

            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
          <button type="submit" className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 uppercase text-[11px] tracking-widest shadow-2xl flex items-center gap-3">
            <Save size={18} /> Salvar & Continuar
          </button>
        </div>
      </form>
    </div>
  );
};
