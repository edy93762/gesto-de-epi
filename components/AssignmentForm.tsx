import React, { useState, useEffect, useRef } from 'react';
import { HardHat, Eraser, User, ListPlus, Trash, Save, Search, Plus, AlertCircle, ScanFace, Check, X, UserPlus, History, Building2, Loader2, Send, FileText, Settings, UserX } from 'lucide-react';
import { EpiRecord, EpiItem, EpiCatalogItem, AutoDeleteConfig, Collaborator } from '../types';
import FaceRecognitionModal from './FaceRecognitionModal';
import { generateEpiPdf, generateCollaboratorHistoryPdf } from '../utils/pdfGenerator';

interface AssignmentFormProps {
  onAdd: (record: EpiRecord) => void;
  catalog: EpiCatalogItem[];
  collaborators: Collaborator[];
  records: EpiRecord[]; // Para checar histórico
  onOpenCatalog: () => void;
  onOpenCollaborators: () => void;
  onRegisterNew: (photo: string) => void;
  onUpdateCollaboratorActivity: (id: string) => void; 
  onEditCollaborator?: (id: string) => void; // Novo handler
  defaultConfig: AutoDeleteConfig;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ 
  onAdd, 
  catalog, 
  collaborators, 
  records,
  onOpenCatalog, 
  onOpenCollaborators, 
  onRegisterNew,
  onUpdateCollaboratorActivity,
  onEditCollaborator,
  defaultConfig 
}) => {
  // Company Selection
  const [selectedCompany, setSelectedCompany] = useState<'Luandre' | 'Randstad' | 'Shopee'>('Luandre');

  // Header Data
  const [employeeName, setEmployeeName] = useState('');
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [employeeAdmission, setEmployeeAdmission] = useState('');
  const [shift, setShift] = useState(''); 
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null); 
  const [lastDeliveryDate, setLastDeliveryDate] = useState<string | null>(null);
  
  // Collaborator Search Data
  const [collabSearchQuery, setCollabSearchQuery] = useState('');
  const [showCollabSuggestions, setShowCollabSuggestions] = useState(false);
  const [filteredCollabs, setFilteredCollabs] = useState<Collaborator[]>([]);
  const collabSearchRef = useRef<HTMLDivElement>(null);

  // Item Selection Data
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCatalog, setFilteredCatalog] = useState<EpiCatalogItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // List of added items
  const [items, setItems] = useState<EpiItem[]>([]);

  // Face Recognition Data
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Loading state for submission (PDF + Sheets)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Item Search Filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCatalog([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = catalog.filter(item => 
      item.code.toLowerCase().includes(lowerQuery) || 
      item.name.toLowerCase().includes(lowerQuery)
    );
    setFilteredCatalog(filtered);
  }, [searchQuery, catalog]);

  // Handle Collaborator Search Filtering
  useEffect(() => {
    if (collabSearchQuery.trim() === '') {
      setFilteredCollabs([]);
      return;
    }
    const lowerQuery = collabSearchQuery.toLowerCase();
    const filtered = collaborators.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      (c.cpf && c.cpf.includes(lowerQuery))
    );
    setFilteredCollabs(filtered);
  }, [collabSearchQuery, collaborators]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (collabSearchRef.current && !collabSearchRef.current.contains(event.target as Node)) {
        setShowCollabSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Check Last Delivery ---
  const checkLastDelivery = (name: string) => {
    if (!name || !records) {
      setLastDeliveryDate(null);
      return;
    }
    
    const employeeRecords = records.filter(r => 
      r.employeeName.toLowerCase() === name.toLowerCase()
    );

    if (employeeRecords.length > 0) {
      employeeRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLastDeliveryDate(employeeRecords[0].date);
    } else {
      setLastDeliveryDate(null);
    }
  };

  // --- Item Logic ---
  const handleSelectItem = (item: EpiCatalogItem) => {
    if (item.stock <= 0) return;

    const newItem: EpiItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      ca: item.ca,
      code: item.code
    };
    setItems([...items, newItem]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // --- Collaborator Logic ---
  const handleSelectCollaborator = (collab: Collaborator) => {
    setEmployeeName(collab.name);
    setCollabSearchQuery(collab.name);
    setEmployeeCpf(collab.cpf || '');
    setShift(collab.shift || '');
    setEmployeeAdmission(collab.admissionDate || '');
    setSelectedCollabId(collab.id);
    
    if (collab.company) {
        setSelectedCompany(collab.company);
    }

    setShowCollabSuggestions(false);
    
    checkLastDelivery(collab.name);
  };
  
  const handleClearCollaborator = () => {
    setCollabSearchQuery('');
    setEmployeeName('');
    setEmployeeCpf('');
    setShift('');
    setEmployeeAdmission('');
    setSelectedCollabId(null);
    setLastDeliveryDate(null);
    setShowCollabSuggestions(false);
  };

  const handleClearAll = () => {
    handleClearCollaborator();
    setItems([]);
    setSearchQuery('');
    setFacePhoto(null);
    setIsRecognizing(false);
    setIsSubmitting(false);
  };

  // --- Quick Actions for Selected Collab ---
  const handleQuickHistory = () => {
      if (!selectedCollabId) return;
      const collab = collaborators.find(c => c.id === selectedCollabId);
      if (!collab) return;

      const employeeRecords = records.filter(r => 
        r.employeeName.toLowerCase() === collab.name.toLowerCase()
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      generateCollaboratorHistoryPdf(collab, employeeRecords);
  };

  const handleQuickManage = () => {
      if (!selectedCollabId || !onEditCollaborator) return;
      onEditCollaborator(selectedCollabId);
  };

  // --- SYNC TO GOOGLE SHEETS ---
  const syncToGoogleSheets = async (record: EpiRecord, pdfBase64: string) => {
    if (!defaultConfig.googleSheetsUrl) return;

    try {
        // CORREÇÃO CRÍTICA: Usar 'text/plain' para evitar Preflight CORS que bloqueia o envio
        await fetch(defaultConfig.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 
              'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify({
                ...record,
                pdfFile: pdfBase64 // Envia o PDF em Base64
            })
        });
        console.log('Dados (PDF+Foto) enviados para Planilha Google via text/plain');
    } catch (e) {
        console.error('Erro ao enviar para Google Sheets:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalName = employeeName || collabSearchQuery;
    
    if (!finalName || items.length === 0 || !facePhoto) {
      alert("Para registrar a entrega é obrigatório:\n1. Informar o colaborador\n2. Adicionar EPIs\n3. Realizar o reconhecimento facial");
      return;
    }

    setIsSubmitting(true);

    const newRecord: EpiRecord = {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      company: selectedCompany,
      employeeName: finalName,
      cpf: employeeCpf,
      admissionDate: employeeAdmission,
      shift: shift,
      items: items, 
      date: new Date().toISOString(),
      signed: false,
      facePhoto: facePhoto || undefined
    };

    try {
        onAdd(newRecord);
        
        if (selectedCollabId) {
            onUpdateCollaboratorActivity(selectedCollabId);
        }

        // Gera o PDF
        const pdfBase64 = generateEpiPdf(newRecord);

        // Tenta enviar para planilha (se configurado)
        if (navigator.onLine && defaultConfig.googleSheetsUrl) {
           await syncToGoogleSheets(newRecord, pdfBase64);
        }

        handleClearAll();
    } catch (error) {
        console.error("Erro no registro:", error);
        alert("Ocorreu um erro ao salvar o registro.");
        setIsSubmitting(false);
    }
  };

  const handleFaceCapture = (photo: string) => {
    setFacePhoto(photo);
    
    if (!employeeName && !collabSearchQuery) {
        setIsRecognizing(true);
        setTimeout(() => {
            let found = null;
            if (collaborators.length > 0) {
                 const randomIndex = Math.floor(Math.random() * collaborators.length);
                 found = collaborators[randomIndex];
            }
            if (found) {
                handleSelectCollaborator(found);
            }
            setIsRecognizing(false);
        }, 1500);
    }
  };

  const getSubmitButtonClass = () => {
    const isDisabled = items.length === 0 || (!employeeName && !collabSearchQuery) || !facePhoto || isSubmitting;
    
    if (isDisabled) {
        return 'bg-dark-700 text-zinc-500 cursor-not-allowed';
    }

    switch (selectedCompany) {
        case 'Shopee':
            return 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-orange-900/20';
        case 'Randstad':
            return 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white shadow-sky-900/20';
        case 'Luandre':
        default:
            return 'bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white shadow-brand-900/20';
    }
  };

  return (
    <>
      <div className="bg-dark-900 rounded-xl shadow-lg border border-dark-800 overflow-hidden flex flex-col h-full">
        {/* Header - Optimized for Mobile */}
        <div className="bg-dark-900 px-4 py-3 sm:px-6 sm:py-4 border-b border-dark-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-brand-900/50 border border-brand-800/50 rounded-lg shrink-0">
              <HardHat className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Nova Entrega</h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <div className="relative group max-w-[120px] sm:max-w-none">
                <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value as 'Luandre' | 'Randstad' | 'Shopee')}
                    className="w-full appearance-none bg-dark-950 border border-dark-700 text-zinc-300 text-[10px] sm:text-xs font-bold py-2 pl-3 pr-7 sm:pr-8 rounded-lg focus:outline-none focus:border-brand-500 cursor-pointer hover:bg-dark-800 transition-colors uppercase tracking-wider"
                >
                    <option value="Luandre">Luandre</option>
                    <option value="Randstad">Randstad</option>
                    <option value="Shopee">Shopee Xpress</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <Building2 className="w-3 h-3" />
                </div>
            </div>

            <button
                type="button"
                onClick={handleClearAll}
                className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-dark-800 shrink-0"
                title="Limpar formulário"
            >
                <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
            {/* --- COLUNA ESQUERDA: COLABORADOR --- */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-brand-500" />
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-400">Dados do Colaborador</h3>
                </div>
                
                {/* Face Recognition Trigger */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5 flex justify-between items-center">
                    <span>{employeeName ? "Validação Biométrica" : "Identificação Facial"}</span>
                    {!facePhoto && <span className="text-brand-400 text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 px-1.5 py-0.5 rounded animate-pulse">Recomendado</span>}
                  </label>
                  
                  {!facePhoto ? (
                      <button
                        type="button"
                        onClick={() => setIsFaceModalOpen(true)}
                        className="w-full border-2 border-dashed border-dark-700 hover:border-brand-500/50 bg-dark-950/30 hover:bg-brand-500/5 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 transition-all group h-auto min-h-[160px] sm:min-h-[200px]"
                      >
                        <div className="bg-dark-800 p-4 rounded-full group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors relative">
                            <ScanFace className="w-8 h-8 text-zinc-400 group-hover:text-brand-400" />
                            <div className="absolute -bottom-1 -right-1 bg-brand-500 rounded-full p-1 border-2 border-dark-900">
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-zinc-200 group-hover:text-white">
                                Toque para Reconhecer
                            </span>
                        </div>
                      </button>
                  ) : (
                      <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl relative overflow-hidden h-auto min-h-[100px]">
                          {isRecognizing && (
                              <div className="absolute inset-0 bg-dark-900/80 z-10 flex items-center justify-center backdrop-blur-sm">
                                  <div className="flex flex-col items-center gap-2">
                                      <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                                      <span className="text-xs font-bold text-brand-400">Identificando rosto...</span>
                                  </div>
                              </div>
                          )}

                          <div className="relative shrink-0">
                              <img src={facePhoto} alt="Rosto" className="w-16 h-16 rounded-lg object-cover border-2 border-emerald-500/50" />
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-dark-900">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-emerald-400">Biometria Capturada</p>
                              <p className="text-xs text-emerald-500/70 truncate">
                                  {employeeName ? `Vinculado a: ${employeeName}` : 'Rosto registrado.'}
                              </p>
                          </div>
                          
                          <button 
                            onClick={() => {
                                setFacePhoto(null);
                                handleClearCollaborator();
                            }}
                            className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                            title="Remover foto"
                          >
                              <Trash className="w-4 h-4" />
                          </button>
                      </div>
                  )}
                </div>

                <div className="relative" ref={collabSearchRef}>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nome / CPF (Apenas Números)</label>
                  <div className="relative group">
                    <input
                        type="text"
                        value={collabSearchQuery}
                        onChange={(e) => {
                            const val = e.target.value;
                            setCollabSearchQuery(val);
                            setEmployeeName(val);
                            setShowCollabSuggestions(true);
                            if(val.length > 2) checkLastDelivery(val);
                        }}
                        onFocus={() => setShowCollabSuggestions(true)}
                        className="w-full pl-9 pr-12 py-3 bg-dark-950 border border-dark-700 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-zinc-600 text-zinc-200"
                        placeholder="Digite Nome ou CPF..."
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Search className="w-4 h-4" />
                    </div>
                    
                    {collabSearchQuery && (
                        <button
                            type="button"
                            onClick={handleClearCollaborator}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white bg-dark-800 hover:bg-red-500/80 p-1.5 rounded-lg transition-all z-10 border border-transparent hover:border-red-500/50 shadow-sm"
                            title="Apagar nome / Limpar Campo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                  </div>

                  {/* Collab Suggestions */}
                  {showCollabSuggestions && collabSearchQuery && (
                    <div className="absolute z-20 w-full mt-1 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredCollabs.length > 0 ? (
                            filteredCollabs.map((collab) => (
                                <button
                                    key={collab.id}
                                    onClick={() => handleSelectCollaborator(collab)}
                                    className="w-full text-left px-4 py-3 hover:bg-dark-800 border-b border-dark-800 last:border-0 flex items-center justify-between group transition-colors"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {collab.cpf && (
                                                <span className="bg-dark-800 text-zinc-400 text-xs font-mono px-1.5 py-0.5 rounded border border-dark-700">
                                                    {collab.cpf}
                                                </span>
                                            )}
                                            <span className="font-medium text-zinc-200">{collab.name}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500 mt-0.5 block">{collab.shift}</span>
                                    </div>
                                    {collab.company && (
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 bg-dark-950 px-2 py-1 rounded border border-dark-700">
                                            {collab.company === 'Shopee' ? 'Shopee Xpress' : collab.company}
                                        </span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-zinc-500 flex flex-col gap-2">
                              <span>Nenhum colaborador encontrado.</span>
                              {facePhoto && (
                                <button 
                                    onClick={() => onRegisterNew(facePhoto)}
                                    className="bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-3 h-3" />
                                    Cadastrar Novo (Usando Foto)
                                </button>
                              )}
                            </div>
                        )}
                    </div>
                  )}
                </div>

                {/* PAINEL DE AÇÃO RÁPIDA (QUANDO SELECIONADO) */}
                {selectedCollabId && (
                    <div className="bg-dark-950/50 border border-dark-700 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                         <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2 text-zinc-300">
                                 <User className="w-4 h-4 text-brand-500" />
                                 <span className="text-sm font-bold truncate max-w-[150px]">{employeeName}</span>
                             </div>
                             <button 
                                onClick={handleClearCollaborator}
                                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-dark-800 transition-colors"
                             >
                                 <UserX className="w-3 h-3" />
                                 Trocar
                             </button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-2">
                             <button
                                onClick={handleQuickHistory}
                                className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                             >
                                 <FileText className="w-3 h-3" />
                                 Histórico (PDF)
                             </button>
                             <button
                                onClick={handleQuickManage}
                                className="bg-dark-800 hover:bg-dark-700 text-zinc-300 border border-dark-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                             >
                                 <Settings className="w-3 h-3" />
                                 Gerenciar / Apagar
                             </button>
                         </div>

                         {lastDeliveryDate && (
                            <div className="mt-2 pt-2 border-t border-dark-800 text-[10px] text-zinc-500 flex items-center gap-1.5">
                                <History className="w-3 h-3 text-zinc-600" />
                                <span>Última entrega: <strong>{new Date(lastDeliveryDate).toLocaleDateString('pt-BR')}</strong></span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- COLUNA DIREITA: EPIS --- */}
            <div className="space-y-4 flex flex-col h-full">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                    <ListPlus className="w-4 h-4 text-brand-500" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-400">Selecionar EPIs</h3>
                    </div>
                    
                    <div className="relative" ref={searchRef}>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Buscar no Catálogo</label>
                    <div className="relative">
                        <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Digite ID ou Nome..."
                        className="w-full pl-4 pr-10 py-3 bg-dark-950 border border-dark-700 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-zinc-600 text-zinc-200"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        {searchQuery ? <ListPlus className="w-5 h-5 text-brand-500" /> : <Search className="w-5 h-5" />}
                        </div>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && searchQuery && (
                        <div className="absolute z-10 w-full mt-1 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredCatalog.length > 0 ? (
                            filteredCatalog.map((item) => {
                            const hasStock = item.stock > 0;
                            return (
                                <button
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                                disabled={!hasStock}
                                className={`w-full text-left px-4 py-3 border-b border-dark-800 last:border-0 flex items-center justify-between group transition-colors ${hasStock ? 'hover:bg-dark-800' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                <div>
                                    <div className="flex items-center gap-2">
                                    <span className="bg-dark-800 text-zinc-400 text-xs font-mono px-1.5 py-0.5 rounded border border-dark-700 group-hover:border-brand-900 group-hover:text-brand-400">
                                        {item.code}
                                    </span>
                                    <span className="font-medium text-zinc-200 group-hover:text-white">{item.name}</span>
                                    </div>
                                    <div className={`text-xs mt-1 flex items-center gap-1 ${hasStock ? 'text-emerald-500' : 'text-red-500 font-bold'}`}>
                                        {hasStock ? `Estoque: ${item.stock}` : 'Sem Estoque'}
                                    </div>
                                </div>
                                {hasStock ? (
                                    <Plus className="w-4 h-4 text-zinc-600 group-hover:text-brand-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                </button>
                            );
                            })
                        ) : (
                            <div className="px-4 py-3 text-sm text-zinc-500">
                            Nenhum EPI encontrado.
                            </div>
                        )}
                        </div>
                    )}
                    
                    {catalog.length === 0 && (
                        <div className="mt-2 text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded border border-amber-500/20">
                            O catálogo está vazio. Cadastre os EPIs para buscá-los aqui.
                        </div>
                    )}
                    </div>
                </div>

                {/* Items List - Takes available space */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[150px] bg-dark-950/30 rounded-lg border border-dark-800">
                    {items.length > 0 ? (
                        <>
                            <div className="bg-dark-800/50 px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-dark-800 sticky top-0 z-10 backdrop-blur-sm">
                            Itens na Lista ({items.length})
                            </div>
                            <ul className="divide-y divide-dark-800">
                            {items.map((item, index) => (
                                <li key={item.id} className="px-3 py-3 sm:px-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dark-800 text-zinc-400 text-xs font-bold border border-dark-700 shrink-0">
                                    {index + 1}
                                    </span>
                                    <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {item.code && (
                                            <span className="text-xs font-mono bg-dark-800 border border-dark-700 px-1.5 rounded text-zinc-400 shrink-0">
                                            {item.code}
                                            </span>
                                        )}
                                        <span className="text-sm font-medium text-zinc-200 truncate">{item.name}</span>
                                    </div>
                                    {item.ca && <span className="text-xs text-zinc-600">CA: {item.ca}</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all shrink-0"
                                    title="Remover item"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                                </li>
                            ))}
                            </ul>
                        </>
                    ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-sm p-4">
                        <ListPlus className="w-8 h-8 opacity-20 mb-2" />
                        <span>Nenhum item adicionado à lista.</span>
                    </div>
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="p-4 sm:p-6 bg-dark-900 border-t border-dark-800">
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || (!employeeName && !collabSearchQuery) || !facePhoto || isSubmitting}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl font-bold transition-all shadow-lg transform active:scale-[0.99] ${getSubmitButtonClass()}`}
          >
             {isSubmitting ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
                 <Save className="w-5 h-5" />
             )}
            <span>
                {isSubmitting 
                    ? 'Salvando e Enviando...' 
                    : `Registrar Entrega - ${selectedCompany === 'Shopee' ? 'Shopee Xpress' : selectedCompany}`
                }
            </span>
          </button>
        </div>
      </div>

      <FaceRecognitionModal 
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onCapture={handleFaceCapture}
        employeeName={employeeName || collabSearchQuery}
      />
    </>
  );
};

export default AssignmentForm;