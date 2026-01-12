import React, { useState } from 'react';
import { EPI } from '../types';
import { HardHat, X, AlertCircle, Package, Layers } from 'lucide-react';

interface EPIFormProps {
  existingEpis: EPI[];
  onSave: (epi: EPI) => void;
  onCancel: () => void;
}

export const EPIForm: React.FC<EPIFormProps> = ({ existingEpis, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    stock: 0
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const idUpper = formData.id.trim().toUpperCase();
    if (existingEpis.some(epi => epi.id.toUpperCase() === idUpper)) {
      setError('Este ID já está em uso.');
      return;
    }
    onSave({ 
        ...formData, 
        id: idUpper, 
        active: true, 
        createdAt: new Date().toISOString() 
    });
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <HardHat size={24} className="text-orange-500" /> Cadastrar EPI
        </h2>
        <button onClick={onCancel} className="p-2 text-slate-500 hover:text-white"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* GRUPO: DADOS BÁSICOS */}
        <section className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
             <Package size={14} className="text-blue-500" />
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grupo: Identificação do Item</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Código (ID)</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-black uppercase focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} placeholder="Ex: LUV-01" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Completa</label>
              <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Luva de Raspa G" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Layers size={12} className="text-emerald-500"/> Quantidade em Estoque
              </label>
              <input 
                required 
                type="number" 
                min="0"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-black uppercase focus:ring-2 focus:ring-blue-600 outline-none transition-all" 
                value={formData.stock} 
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} 
                placeholder="0" 
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
          <button type="submit" className="px-10 py-4 bg-white text-black font-black rounded-xl hover:bg-orange-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-widest shadow-lg">
            Salvar Equipamento
          </button>
        </div>
      </form>
    </div>
  );
};