import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, FileText, Calendar, Clock, ScanFace, Check, Camera, Building2, Briefcase, Users2, ShieldAlert, ArrowLeft, LayoutGrid } from 'lucide-react';
import { Collaborator, EpiRecord } from '../types';
import FaceRecognitionModal from './FaceRecognitionModal';
import { generateCollaboratorHistoryPdf } from '../utils/pdfGenerator';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  onUpdateCollaborators: (collabs: Collaborator[]) => void;
  initialPhoto?: string | null;
  initialCollaboratorId?: string | null; // Nova prop para abrir direto no perfil
  records: EpiRecord[]; 
}

const ROLE_OPTIONS = [
  "Representante de Envios",
  "Operador de Máquinas",
  "Problem Solver",
  "Team Leader",
  "Supervisor",
  "Gerente",
  "Analista",
  "Outro"
];

const SECTOR_OPTIONS = [
  "Picking",
  "Packing",
  "Put Away",
  "Inventário",
  "Qualidade",
  "Expedição",
  "Recebimento",
  "HSE",
  "Security",
  "Treinamento",
  "Pátio",
  "Ambulatório",
  "Manutenção",
  "Administrativo",
  "Returns",
  "T.I",
  "Shipping",
  "Outro"
];

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  onUpdateCollaborators,
  initialPhoto,
  initialCollaboratorId,
  records
}) => {
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabCpf, setNewCollabCpf] = useState('');
  const [newCollabShift, setNewCollabShift] = useState('');
  const [newCollabAdmission, setNewCollabAdmission] = useState('');
  const [newCollabFace, setNewCollabFace] = useState<string | null>(null);
  const [newCollabCompany, setNewCollabCompany] = useState<'Luandre' | 'Randstad' | 'Shopee'>('Luandre');
  
  // Novos campos operacionais
  const [newCollabRole, setNewCollabRole] = useState('');
  const [newCollabSector, setNewCollabSector] = useState('');
  const [newCollabLeader, setNewCollabLeader] = useState('');
  const [newCollabCoordinator, setNewCollabCoordinator] = useState('');
  const [newCollabHse, setNewCollabHse] = useState('');

  // Estado para controlar se está no modo de digitação de setor (Outro)
  const [isCustomSectorMode, setIsCustomSectorMode] = useState(false);
  // Estado para controlar se está no modo de digitação de função (Outro)
  const [isCustomRoleMode, setIsCustomRoleMode] = useState(false);

  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

  const [selectedCollabForHistory, setSelectedCollabForHistory] = useState<Collaborator | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (initialCollaboratorId) {
            const found = collaborators.find(c => c.id === initialCollaboratorId);
            if (found) {
                setSelectedCollabForHistory(found);
            }
        } else if (initialPhoto) {
            setNewCollabFace(initialPhoto);
            setSelectedCollabForHistory(null);
        } else {
            // Reset normal
            setSelectedCollabForHistory(null);
        }
    }
  }, [isOpen, initialPhoto, initialCollaboratorId, collaborators]);

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
        lastActivityDate: new Date().toISOString(),
        company: newCollabCompany,
        // Novos Campos
        role: newCollabRole,
        sector: newCollabSector,
        teamLeader: newCollabLeader,
        coordinator: newCollabCoordinator,
        hse: newCollabHse
    };

    onUpdateCollaborators([...collaborators, newCollab]);
    
    // Reset Form
    setNewCollabName('');
    setNewCollabCpf('');
    setNewCollabShift('');
    setNewCollabAdmission('');
    setNewCollabFace(null);
    setNewCollabCompany('Luandre');
    setNewCollabRole('');
    setIsCustomRoleMode(false);
    setNewCollabSector('');
    setIsCustomSectorMode(false); 
    setNewCollabLeader('');
    setNewCollabCoordinator('');
    setNewCollabHse('');

    if (initialPhoto) {
        onClose();
    }
  };

  const handleRemoveCollaborator = (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente APAGAR este colaborador do cadastro? \n(O histórico de entregas passadas será mantido, mas o vínculo será perdido)")) {
        onUpdateCollaborators(collaborators.filter(c => c.id !== id));
        if (selectedCollabForHistory?.id === id) {
            setSelectedCollabForHistory(null);
        }
        // Se abriu especificamente para este user, fecha o modal
        if (initialCollaboratorId === id) {
            onClose();
        }
    }
  };

  const handleUpdatePhoto = (id: string) => {
    setEditingCollabId(id);
    setIsFaceModalOpen(true);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '');
      setNewCollabCpf(val);
  };

  const collaboratorRecords = selectedCollabForHistory 
      ? records.filter(r => r.employeeName.toLowerCase() === selectedCollabForHistory.name.toLowerCase()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

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
                {selectedCollabForHistory ? "Perfil e Histórico" : "Colaboradores"}
              </h3>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              
              {selectedCollabForHistory ? (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                      <button 
                        onClick={() => setSelectedCollabForHistory(null)}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                          <ArrowLeft className="w-4 h-4" /> Voltar para lista
                      </button>

                      <div className="bg-dark-950 p-5 rounded-xl border border-dark-800 flex items-center gap-4">
                           <div className="relative">
                               {selectedCollabForHistory.faceReference ? (
                                   <img src={selectedCollabForHistory.faceReference} alt="Face" className="w-20 h-20 rounded-full object-cover border-2 border-brand-500" />
                               ) : (
                                   <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center border-2 border-dark-700">
                                       <Users className="w-10 h-10 text-zinc-600" />
                                   </div>
                               )}
                               <button 
                                onClick={() => handleUpdatePhoto(selectedCollabForHistory.id)}
                                className="absolute bottom-0 right-0 bg-brand-600 p-1.5 rounded-full text-white border-2 border-dark-950 hover:bg-brand-500"
                               >
                                   <Camera className="w-3 h-3" />
                               </button>
                           </div>
                           <div>
                               <h2 className="text-xl font-bold text-white">{selectedCollabForHistory.name}</h2>
                               <p className="text-sm text-zinc-400 font-mono">{selectedCollabForHistory.cpf || 'Sem CPF'}</p>
                               <div className="flex gap-2 mt-2">
                                   <span className="text-xs bg-dark-800 px-2 py-0.5 rounded text-zinc-300 border border-dark-700">{selectedCollabForHistory.shift}</span>
                                   <span className="text-xs bg-brand-900/30 px-2 py-0.5 rounded text-brand-300 border border-brand-500/20">{selectedCollabForHistory.company === 'Shopee' ? 'Shopee Xpress' : selectedCollabForHistory.company}</span>
                               </div>
                               {/* Exibir detalhes adicionais se existirem */}
                               {(selectedCollabForHistory.role || selectedCollabForHistory.sector) && (
                                   <p className="text-xs text-zinc-500 mt-2">
                                       {selectedCollabForHistory.role} - {selectedCollabForHistory.sector}
                                   </p>
                               )}
                           </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                           <button 
                             onClick={() => generateCollaboratorHistoryPdf(selectedCollabForHistory, collaboratorRecords)}
                             className="bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-600/20"
                           >
                               <FileText className="w-4 h-4" />
                               Baixar Histórico
                           </button>
                           <button 
                             onClick={() => handleRemoveCollaborator(selectedCollabForHistory.id)}
                             className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                           >
                               <Trash2 className="w-4 h-4" />
                               Apagar Nome
                           </button>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-dark-800">
                          <h4 className="text-sm font-bold text-zinc-300 flex items-center justify-between">
                              <span>Entregas Realizadas</span>
                              <span className="text-xs bg-dark-800 px-2 py-0.5 rounded-full">{collaboratorRecords.length}</span>
                          </h4>
                          
                          <div className="border border-dark-800 rounded-lg divide-y divide-dark-800 max-h-[200px] overflow-y-auto custom-scrollbar">
                              {collaboratorRecords.length === 0 ? (
                                  <div className="p-8 text-center text-zinc-500 text-sm">
                                      Nenhum registro encontrado.
                                  </div>
                              ) : (
                                  collaboratorRecords.map(rec => (
                                      <div key={rec.id} className="p-3 hover:bg-dark-800/30 transition-colors">
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="text-xs font-bold text-zinc-300">{new Date(rec.date).toLocaleDateString('pt-BR')}</span>
                                              <span className="text-xs text-zinc-500">{new Date(rec.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <div className="space-y-1">
                                              {rec.items.map((item, idx) => (
                                                  <div key={idx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                                                      <div className="w-1 h-1 rounded-full bg-brand-500"></div>
                                                      {item.name}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-6 animate-in slide-in-from-left duration-300">
                        {/* Formulário de Cadastro Existente ... */}
                        <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                        <h4 className="text-sm font-bold text-zinc-300">
                            {initialPhoto ? "Finalizar Cadastro (Foto Capturada)" : "Adicionar Novo"}
                        </h4>
                        <div className="space-y-3">
                            {/* CPF e Face */}
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
                            
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <select
                                    value={newCollabCompany}
                                    onChange={(e) => setNewCollabCompany(e.target.value as 'Luandre' | 'Randstad' | 'Shopee')}
                                    className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none appearance-none"
                                >
                                    <option value="Luandre">Agência: Luandre</option>
                                    <option value="Randstad">Agência: Randstad</option>
                                    <option value="Shopee">Agência: Shopee Xpress</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
                            </div>

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

                            {/* --- NOVOS CAMPOS OPERACIONAIS --- */}
                            <div className="pt-2 border-t border-dark-800">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Dados Operacionais</label>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {/* SELETOR DE FUNÇÃO */}
                                    <div className="relative flex flex-col gap-2">
                                        <div className="relative w-full">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                            <select
                                                value={isCustomRoleMode ? 'Outro' : newCollabRole}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Outro') {
                                                        setIsCustomRoleMode(true);
                                                        setNewCollabRole(''); // Limpa para digitar
                                                    } else {
                                                        setIsCustomRoleMode(false);
                                                        setNewCollabRole(val);
                                                    }
                                                }}
                                                className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none appearance-none"
                                            >
                                                <option value="" disabled>Selecione a Função</option>
                                                {ROLE_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">▼</div>
                                        </div>
                                        
                                        {/* Campo de Texto para 'Outro' na Função */}
                                        {isCustomRoleMode && (
                                            <input
                                                type="text"
                                                placeholder="Digite o nome da função..."
                                                value={newCollabRole}
                                                onChange={(e) => setNewCollabRole(e.target.value)}
                                                autoFocus
                                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none animate-in fade-in slide-in-from-top-1"
                                            />
                                        )}
                                    </div>
                                    
                                    {/* SELETOR DE SETOR */}
                                    <div className="relative flex flex-col gap-2">
                                        <div className="relative w-full">
                                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                            <select
                                                value={isCustomSectorMode ? 'Outro' : newCollabSector}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Outro') {
                                                        setIsCustomSectorMode(true);
                                                        setNewCollabSector(''); // Limpa para digitar
                                                    } else {
                                                        setIsCustomSectorMode(false);
                                                        setNewCollabSector(val);
                                                    }
                                                }}
                                                className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none appearance-none"
                                            >
                                                <option value="" disabled>Selecione o Setor</option>
                                                {SECTOR_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">▼</div>
                                        </div>
                                        
                                        {/* Campo de Texto para 'Outro' no Setor */}
                                        {isCustomSectorMode && (
                                            <input
                                                type="text"
                                                placeholder="Digite o nome do setor..."
                                                value={newCollabSector}
                                                onChange={(e) => setNewCollabSector(e.target.value)}
                                                autoFocus
                                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none animate-in fade-in slide-in-from-top-1"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            placeholder="Team Leader / Supervisor"
                                            value={newCollabLeader}
                                            onChange={(e) => setNewCollabLeader(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Coordenador"
                                            value={newCollabCoordinator}
                                            onChange={(e) => setNewCollabCoordinator(e.target.value)}
                                            className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none"
                                        />
                                        <div className="relative">
                                            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="HSE"
                                                value={newCollabHse}
                                                onChange={(e) => setNewCollabHse(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
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
                            <div className="border border-dark-800 rounded-lg divide-y divide-dark-800 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {collaborators.map(collab => (
                                <div key={collab.id} className="p-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-zinc-200">{collab.name}</p>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">{collab.company} • {collab.role || '-'}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedCollabForHistory(collab)}
                                    className="text-brand-400 hover:text-white p-2 hover:bg-brand-500/20 rounded-lg transition-colors"
                                    title="Editar / Histórico"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                  </div>
              )}
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
                const updatedList = collaborators.map(c => 
                    c.id === editingCollabId ? { ...c, faceReference: photo } : c
                );
                onUpdateCollaborators(updatedList);
                setEditingCollabId(null);
            } else {
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