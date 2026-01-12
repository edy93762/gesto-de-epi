import React, { useState } from 'react';
import { EPI } from '../types';
import { Save, HardHat, X, AlertCircle, MapPin } from 'lucide-react';

interface EPIFormProps {
  existingEpis: EPI[];
  onSave: (epi: EPI) => void;
  onCancel: () => void;
}

export const EPIForm: React.FC<EPIFormProps> = ({ existingEpis, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    location: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const idUpper = formData.id.trim().toUpperCase();
    
    // Validação de ID único
    if (existingEpis.some(epi => epi.id.toUpperCase() === idUpper)) {
      setError('Este ID de EPI já está cadastrado. Escolha um ID único.');
      return;
    }

    if (!formData.id.trim() || !formData.description.trim() || !formData.location.trim()) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    const newEPI: EPI = {
      id: idUpper,
      description: formData.description.trim(),
      location: formData.location.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    onSave(newEPI);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HardHat className="text-orange-600" size={24} />
            Cadastrar Novo EPI
          </h2>
          <p className="text-sm text-slate-500 mt-1">Identificação e localização do equipamento.</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID do EPI (EPI_ID)</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="Ex: LUV-01, CAP-SEG-02"
            />
            <p className="text-xs text-slate-400 mt-1">Código identificador único.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do EPI</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Luva de Vaqueta Cano Curto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <MapPin size={14} className="text-slate-400" /> Local
            </label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Almoxarifado A, Prateleira 02"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 flex items-center gap-2 shadow-sm transition-all"
          >
            <Save size={18} />
            Salvar EPI
          </button>
        </div>
      </form>
    </div>
  );
};