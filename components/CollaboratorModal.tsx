import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, FileText, Calendar } from 'lucide-react';
import { Collaborator } from '../types';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  onUpdateCollaborators: (collabs: Collaborator[]) => void;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  onUpdateCollaborators
}) => {
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabCpf, setNewCollabCpf] = useState('');
  const [newCollabShift, setNewCollabShift] = useState('1º Turno');
  const [newCollabAdmission, setNewCollabAdmission] = useState('');

  if (!isOpen) return null;

  const handleAddCollaborator = () => {
    if (!newCollabName) return;

    if (newCollabCpf && collaborators.some(c => c.cpf === newCollabCpf)) {
        alert("Já existe um colaborador com este CPF.");
        return;
    }

    const newCollab: Collaborator = {
        id: Date.now().toString(),
        name: newCollabName,
        cpf: newCollabCpf,
        shift: newCollabShift,
        admissionDate: newCollabAdmission
    };

    onUpdateCollaborators([...collaborators, newCollab]);
    setNewCollabName('');
    setNewCollabCpf('');
    setNewCollabShift('1º Turno');
    setNewCollabAdmission('');
  };

  const handleRemoveCollaborator = (id: string) => {
    onUpdateCollaborators(collaborators.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Gestão de Colaboradores
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-300">Adicionar Novo</h4>
            <div className="space-y-3">
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                      type="text"
                      placeholder="CPF"
                      value={newCollabCpf}
                      onChange={(e) => setNewCollabCpf(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={newCollabName}
                  onChange={(e) => setNewCollabName(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold absolute -top-2 left-2 bg-dark-950 px-1">Turno</span>
                    <select
                      value={newCollabShift}
                      onChange={(e) => setNewCollabShift(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none h-10 appearance-none"
                    >
                      <option value="1º Turno">1º Turno</option>
                      <option value="2º Turno">2º Turno</option>
                      <option value="3º Turno">3º Turno</option>
                    </select>
                  </div>
                  
                  <div className="relative">
                     <span className="text-[10px] text-zinc-500 uppercase font-bold absolute -top-2 left-2 bg-dark-950 px-1">Admissão</span>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="date"
                          value={newCollabAdmission}
                          onChange={(e) => setNewCollabAdmission(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none h-10 [color-scheme:dark]"
                        />
                     </div>
                  </div>
                </div>

            </div>
            <button
                onClick={handleAddCollaborator}
                disabled={!newCollabName}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-dark-800 disabled:text-zinc-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
                <UserPlus className="w-4 h-4" />
                Cadastrar
            </button>
            </div>

            <div className="space-y-2">
            <h4 className="text-sm font-bold text-zinc-400 flex items-center justify-between">
                <span>Lista de Colaboradores</span>
                <span className="text-xs font-normal text-zinc-600 bg-dark-800 px-2 py-0.5 rounded-full">{collaborators.length}</span>
            </h4>
            
            {collaborators.length === 0 ? (
                <div className="text-center py-8 bg-dark-950/50 rounded-lg border border-dashed border-dark-800">
                <Users className="w-8 h-8 text-dark-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-600">Nenhum colaborador.</p>
                </div>
            ) : (
                <div className="border border-dark-800 rounded-lg divide-y divide-dark-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                {collaborators.map(collab => (
                    <div key={collab.id} className="p-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                    <div>
                        <div className="flex items-center gap-2">
                            {collab.cpf && (
                            <span className="text-xs font-mono font-bold bg-dark-800 border border-dark-700 px-1.5 py-0.5 rounded text-zinc-400">{collab.cpf}</span>
                            )}
                            <p className="text-sm font-medium text-zinc-200">{collab.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-zinc-500">{collab.shift}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleRemoveCollaborator(collab.id)}
                        className="text-dark-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorModal;