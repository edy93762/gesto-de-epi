import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, FileText, Calendar, Clock, ScanFace, Check, Camera } from 'lucide-react';
import { Collaborator } from '../types';
import FaceRecognitionModal from './FaceRecognitionModal';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  onUpdateCollaborators: (collabs: Collaborator[]) => void;
  initialPhoto?: string | null; // Novo prop para foto vinda do form de entrega
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  onUpdateCollaborators,
  initialPhoto
}) => {
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabCpf, setNewCollabCpf] = useState('');
  const [newCollabShift, setNewCollabShift] = useState('');
  const [newCollabAdmission, setNewCollabAdmission] = useState('');
  const [newCollabFace, setNewCollabFace] = useState<string | null>(null);
  
  // Estado para controlar a edição de foto
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

  // Preencher com foto inicial se houver
  useEffect(() => {
    if (isOpen && initialPhoto) {
      setNewCollabFace(initialPhoto);
    }
  }, [isOpen, initialPhoto]);

  if (!isOpen) return null;

  const handleAddCollaborator = () => {
    if (!newCollabName) return;

    if (!newCollabFace) {
      alert("O cadastro da biometria facial é obrigatório.");
      return;
    }

    if (newCollabCpf && collaborators.some(c => c.cpf === newCollabCpf)) {
        alert("Já existe um colaborador com este CPF.");
        return;
    }

    const newCollab: Collaborator = {
        id: Date.now().toString(),
        name: newCollabName,
        cpf: newCollabCpf,
        shift: newCollabShift || 'Geral',
        admissionDate: newCollabAdmission,
        faceReference: newCollabFace || undefined,
        lastActivityDate: new Date().toISOString() // Inicializa com a data de criação
    };

    onUpdateCollaborators([...collaborators, newCollab]);
    
    // Reset Form
    setNewCollabName('');
    setNewCollabCpf('');
    setNewCollabShift('');
    setNewCollabAdmission('');
    setNewCollabFace(null);

    // Se veio de uma foto inicial, talvez queira fechar
    if (initialPhoto) {
        onClose();
    }
  };

  const handleRemoveCollaborator = (id: string) => {
    if (confirm("Tem certeza que deseja remover este colaborador?")) {
        onUpdateCollaborators(collaborators.filter(c => c.id !== id));
    }
  };

  const handleUpdatePhoto = (id: string) => {
    setEditingCollabId(id);
    setIsFaceModalOpen(true);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove tudo que não for dígito
      const val = e.target.value.replace(/\D/g, '');
      setNewCollabCpf(val);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
              <h4 className="text-sm font-bold text-zinc-300">
                  {initialPhoto ? "Finalizar Cadastro (Foto Capturada)" : "Adicionar Novo"}
              </h4>
              <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                          type="text"
                          placeholder="CPF (Números)"
                          value={newCollabCpf}
                          onChange={handleCpfChange}
                          maxLength={11}
                          className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                      />
                    </div>
                    
                    {/* Botão de Biometria no Cadastro */}
                    <button
                      onClick={() => {
                        setEditingCollabId(null);
                        setIsFaceModalOpen(true);
                      }}
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all ${
                        newCollabFace 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50'
                      }`}
                      title={newCollabFace ? "Biometria Capturada" : "Cadastrar Biometria (Obrigatório)"}
                    >
                      {newCollabFace ? <Check className="w-4 h-4" /> : <ScanFace className="w-4 h-4" />}
                      {newCollabFace ? "Face OK" : "Face *"}
                    </button>
                  </div>
                  
                  {newCollabFace && initialPhoto && (
                      <div className="text-xs text-emerald-500 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Foto importada da captura.
                      </div>
                  )}
                  
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={newCollabName}
                    onChange={(e) => setNewCollabName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Turno"
                        value={newCollabShift}
                        onChange={(e) => setNewCollabShift(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none"
                      />
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
                  disabled={!newCollabName || !newCollabFace}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-dark-800 disabled:text-zinc-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Colaborador
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
                              {collab.faceReference ? (
                                <span title="Biometria Cadastrada" className="flex items-center gap-1">
                                  <ScanFace className="w-3 h-3 text-emerald-500" />
                                </span>
                              ) : (
                                <span title="Sem Biometria" className="flex items-center gap-1">
                                  <ScanFace className="w-3 h-3 text-red-500" />
                                </span>
                              )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-zinc-500">{collab.shift}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                            onClick={() => handleUpdatePhoto(collab.id)}
                            className="text-zinc-400 hover:text-brand-400 p-2 hover:bg-brand-500/10 rounded-lg transition-colors"
                            title="Atualizar Foto"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleRemoveCollaborator(collab.id)}
                            className="text-dark-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remover"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      </div>
                  ))}
                  </div>
              )}
              </div>
          </div>
        </div>
      </div>

      <FaceRecognitionModal
        isOpen={isFaceModalOpen}
        onClose={() => {
            setIsFaceModalOpen(false);
            setEditingCollabId(null);
        }}
        onCapture={(photo) => {
            if (editingCollabId) {
                // Atualizar colaborador existente
                const updatedList = collaborators.map(c => 
                    c.id === editingCollabId ? { ...c, faceReference: photo } : c
                );
                onUpdateCollaborators(updatedList);
                setEditingCollabId(null);
            } else {
                // Novo cadastro
                setNewCollabFace(photo);
            }
        }}
        employeeName={editingCollabId 
            ? (collaborators.find(c => c.id === editingCollabId)?.name || "Colaborador") 
            : (newCollabName || "Novo Colaborador")}
      />
    </>
  );
};

export default CollaboratorModal;