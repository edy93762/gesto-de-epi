import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, FileText, Calendar, Clock, ScanFace, Check, Camera, Building2, Briefcase, Users2, ShieldAlert, ArrowLeft, LayoutGrid, Loader2 } from 'lucide-react';
import { Collaborator, EpiRecord } from '../types';
import FaceRecognitionModal from './FaceRecognitionModal';
import { generateCollaboratorHistoryPdf } from '../utils/pdfGenerator';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  onUpdateCollaborators: (collabs: Collaborator[]) => void;
  initialPhoto?: string | null;
  initialCollaboratorId?: string | null;
  records: EpiRecord[]; 
  onSync?: (collab: Collaborator) => void;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen, onClose, collaborators, onUpdateCollaborators, initialPhoto, initialCollaboratorId, records, onSync
}) => {
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabCpf, setNewCollabCpf] = useState('');
  const [newCollabShift, setNewCollabShift] = useState('');
  const [newCollabFace, setNewCollabFace] = useState<string | null>(null);
  const [newCollabCompany, setNewCollabCompany] = useState<'Luandre' | 'Randstad' | 'Shopee'>('Luandre');
  const [newCollabRole, setNewCollabRole] = useState('');
  const [newCollabSector, setNewCollabSector] = useState('');
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [selectedCollabForHistory, setSelectedCollabForHistory] = useState<Collaborator | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (initialCollaboratorId) {
            const found = collaborators.find(c => c.id === initialCollaboratorId);
            if (found) setSelectedCollabForHistory(found);
        } else if (initialPhoto) {
            setNewCollabFace(initialPhoto);
            setSelectedCollabForHistory(null);
        } else {
            setSelectedCollabForHistory(null);
        }
    }
  }, [isOpen, initialPhoto, initialCollaboratorId, collaborators]);

  const handleAddCollaborator = () => {
    if (!newCollabName || !newCollabFace || !newCollabCpf) {
        alert("Preencha Nome, CPF e Biometria.");
        return;
    }
    const newCollab: Collaborator = {
        id: Date.now().toString(), name: newCollabName, cpf: newCollabCpf, shift: newCollabShift || 'Geral',
        faceReference: newCollabFace, lastActivityDate: new Date().toISOString(), company: newCollabCompany,
        role: newCollabRole, sector: newCollabSector
    };
    onUpdateCollaborators([...collaborators, newCollab]);
    if (onSync) onSync(newCollab);
    
    setNewCollabName(''); setNewCollabCpf(''); setNewCollabFace(null);
    if (initialPhoto) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-800 flex flex-col max-h-[90vh]">
          <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{selectedCollabForHistory ? "Perfil" : "Colaboradores"}</h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              {selectedCollabForHistory ? (
                  <div className="space-y-6">
                      <button onClick={() => setSelectedCollabForHistory(null)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Voltar</button>
                      <div className="bg-dark-950 p-5 rounded-xl border border-dark-800 flex items-center gap-4">
                           <img src={selectedCollabForHistory.faceReference} className="w-20 h-20 rounded-full object-cover border-2 border-brand-500" />
                           <div>
                               <h2 className="text-xl font-bold text-white">{selectedCollabForHistory.name}</h2>
                               <p className="text-sm text-zinc-400 font-mono">{selectedCollabForHistory.cpf}</p>
                           </div>
                      </div>
                      <button onClick={() => confirm("Apagar?") && onUpdateCollaborators(collaborators.filter(c => c.id !== selectedCollabForHistory.id))} className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl border border-red-500/30">Apagar Cadastro</button>
                  </div>
              ) : (
                  <div className="space-y-6">
                        <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="CPF" value={newCollabCpf} onChange={(e) => setNewCollabCpf(e.target.value.replace(/\D/g,''))} className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white" />
                                <button onClick={() => setIsFaceModalOpen(true)} className={`px-3 py-2 rounded-lg border text-xs font-bold ${newCollabFace ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{newCollabFace ? "Face OK" : "Biometria *"}</button>
                            </div>
                            <input type="text" placeholder="Nome Completo" value={newCollabName} onChange={(e) => setNewCollabName(e.target.value)} className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white" />
                            <select value={newCollabCompany} onChange={(e) => setNewCollabCompany(e.target.value as any)} className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white"><option value="Luandre">Luandre</option><option value="Randstad">Randstad</option><option value="Shopee">Shopee Xpress</option></select>
                            <button onClick={handleAddCollaborator} className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium">Cadastrar e Sincronizar</button>
                        </div>
                        <div className="border border-dark-800 rounded-lg divide-y divide-dark-800 max-h-[250px] overflow-y-auto">
                            {collaborators.map(c => (
                                <div key={c.id} className="p-3 flex items-center justify-between hover:bg-dark-800/50">
                                    <p className="text-sm font-medium text-zinc-200">{c.name}</p>
                                    <button onClick={() => setSelectedCollabForHistory(c)} className="text-brand-400 hover:text-white p-2"><FileText className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                  </div>
              )}
          </div>
        </div>
      </div>
      <FaceRecognitionModal isOpen={isFaceModalOpen} onClose={() => setIsFaceModalOpen(false)} onCapture={(photo) => setNewCollabFace(photo)} employeeName={newCollabName || "Novo Colaborador"} />
    </>
  );
};

export default CollaboratorModal;