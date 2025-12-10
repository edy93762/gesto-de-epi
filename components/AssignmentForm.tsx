import React, { useState, useEffect, useRef } from 'react';
import { HardHat, Eraser, User, ListPlus, Trash, Save, Search, CalendarClock, Plus, AlertCircle, Clock, ScanFace, Check, X, UserPlus, History } from 'lucide-react';
import { EpiRecord, EpiItem, EpiCatalogItem, AutoDeleteConfig, AutoDeleteUnit, Collaborator } from '../types';
import FaceRecognitionModal from './FaceRecognitionModal';

interface AssignmentFormProps {
  onAdd: (record: EpiRecord) => void;
  catalog: EpiCatalogItem[];
  collaborators: Collaborator[];
  records: EpiRecord[]; // Para checar histórico
  onOpenCatalog: () => void;
  onOpenCollaborators: () => void;
  onRegisterNew: (photo: string) => void;
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
  defaultConfig 
}) => {
  // Header Data
  const [employeeName, setEmployeeName] = useState('');
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [employeeAdmission, setEmployeeAdmission] = useState('');
  const [shift, setShift] = useState(''); 
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

  // Expiration Logic
  const [enableExpiration, setEnableExpiration] = useState(defaultConfig.defaultEnabled);
  const [expireValue, setExpireValue] = useState(defaultConfig.defaultValue);
  const [expireUnit, setExpireUnit] = useState<AutoDeleteUnit>(defaultConfig.defaultUnit);

  // Face Recognition Data
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);

  useEffect(() => {
    setEnableExpiration(defaultConfig.defaultEnabled);
    setExpireValue(defaultConfig.defaultValue);
    setExpireUnit(defaultConfig.defaultUnit);
  }, [defaultConfig]);

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
      (c.cpf && c.cpf.toLowerCase().includes(lowerQuery))
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
    
    // Find all records for this employee
    const employeeRecords = records.filter(r => 
      r.employeeName.toLowerCase() === name.toLowerCase()
    );

    if (employeeRecords.length > 0) {
      // Sort desc by date
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
    setShowCollabSuggestions(false);
    
    // Check history
    checkLastDelivery(collab.name);

    // Reset photo if user changes manually
    // if (employeeName !== collab.name) setFacePhoto(null); 
    // Comentado para permitir que a foto tirada persista se selecionar o nome depois
  };

  const handleClearAll = () => {
    setEmployeeName('');
    setCollabSearchQuery('');
    setEmployeeCpf('');
    setShift('');
    setEmployeeAdmission('');
    setItems([]);
    setSearchQuery('');
    setFacePhoto(null);
    setLastDeliveryDate(null);
  };

  const calculateAutoDeleteDate = (): string | undefined => {
    if (!enableExpiration) return undefined;
    
    const date = new Date();
    switch (expireUnit) {
      case 'minutes': date.setMinutes(date.getMinutes() + expireValue); break;
      case 'days': date.setDate(date.getDate() + expireValue); break;
      case 'months': date.setMonth(date.getMonth() + expireValue); break;
    }
    return date.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = employeeName || collabSearchQuery;
    
    // Validation check updated to include facePhoto
    if (!finalName || items.length === 0 || !facePhoto) {
      alert("Para registrar a entrega é obrigatório:\n1. Informar o colaborador\n2. Adicionar EPIs\n3. Realizar o reconhecimento facial");
      return;
    }

    const deleteDate = calculateAutoDeleteDate();

    const newRecord: EpiRecord = {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      employeeName: finalName,
      cpf: employeeCpf,
      admissionDate: employeeAdmission,
      shift: shift,
      items: items, 
      date: new Date().toISOString(),
      signed: false,
      autoDeleteAt: deleteDate,
      facePhoto: facePhoto || undefined
    };

    onAdd(newRecord);
    handleClearAll();
  };

  const handleFaceCapture = (photo: string) => {
    setFacePhoto(photo);

    // Se ainda não selecionou um colaborador, tentar identificar
    if (!employeeName && !collabSearchQuery) {
        // Lógica de simulação de reconhecimento (simplificada)
        // Em um app real, compararia a foto com `collaborators.faceReference`
        const found = collaborators.find(c => c.faceReference); // Simulação: pega o primeiro que tem foto
        
        if (found && Math.random() > 0.7) { // 30% de chance de achar na simulação, senão pede cadastro
            handleSelectCollaborator(found);
        } else {
            // Não achou ninguem
        }
    }
  };

  return (
    <>
      <div className="bg-dark-900 rounded-xl shadow-lg border border-dark-800 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-brand-900/50 border border-brand-800/50 rounded-lg">
              <HardHat className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">Nova Entrega</h2>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-dark-800"
            title="Limpar formulário"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Employee Data */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-400">Dados do Colaborador</h3>
            </div>
            
            <div className="relative" ref={collabSearchRef}>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nome / CPF</label>
              <div className="relative">
                <input
                    type="text"
                    value={collabSearchQuery}
                    onChange={(e) => {
                        setCollabSearchQuery(e.target.value);
                        setEmployeeName(e.target.value);
                        setShowCollabSuggestions(true);
                        checkLastDelivery(e.target.value);
                    }}
                    onFocus={() => setShowCollabSuggestions(true)}
                    className="w-full pl-9 pr-10 py-3 bg-dark-950 border border-dark-700 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-zinc-600 text-zinc-200"
                    placeholder="Buscar colaborador..."
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search className="w-4 h-4" />
                </div>
                {collabSearchQuery && (
                    <button
                        type="button"
                        onClick={() => {
                            setCollabSearchQuery('');
                            setEmployeeName('');
                            setEmployeeCpf('');
                            setShift('');
                            setEmployeeAdmission('');
                            setLastDeliveryDate(null);
                            setShowCollabSuggestions(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-dark-800 transition-colors"
                        title="Apagar nome"
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
                                Cadastrar Novo com Foto Atual
                             </button>
                           )}
                        </div>
                    )}
                </div>
              )}
            </div>

            {/* Last Delivery Indicator */}
            {lastDeliveryDate && (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg text-blue-400 animate-in fade-in slide-in-from-top-1">
                 <History className="w-4 h-4 shrink-0" />
                 <div className="text-xs">
                    <span className="font-bold">Última Entrega:</span> {new Date(lastDeliveryDate).toLocaleDateString('pt-BR')} às {new Date(lastDeliveryDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                 </div>
              </div>
            )}
             {!lastDeliveryDate && employeeName && (
               <div className="flex items-center gap-2 bg-dark-800/50 border border-dark-700 p-2.5 rounded-lg text-zinc-400 text-xs">
                 <History className="w-4 h-4 shrink-0" />
                 <span>Primeira entrega registrada no sistema.</span>
               </div>
            )}

            {/* Face Recognition Trigger */}
            <div className="mt-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 flex justify-between items-center">
                <span>{employeeName ? "Validação Biométrica" : "Identificação Facial"}</span>
                <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded">* Obrigatório</span>
              </label>
              
              {!facePhoto ? (
                  <button
                    type="button"
                    onClick={() => setIsFaceModalOpen(true)}
                    className="w-full border-2 border-dashed border-dark-700 hover:border-brand-500/50 bg-dark-950/30 hover:bg-brand-500/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
                  >
                    <div className="bg-dark-800 p-3 rounded-full group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors">
                        <ScanFace className="w-6 h-6 text-zinc-400 group-hover:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">
                        {employeeName ? "Validar Rosto (Obrigatório)" : "Identificar via Câmera"}
                    </span>
                    <span className="text-xs text-zinc-600">Clique para abrir a câmera frontal</span>
                  </button>
              ) : (
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="relative shrink-0">
                          <img src={facePhoto} alt="Rosto" className="w-12 h-12 rounded-lg object-cover border border-emerald-500/50" />
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-dark-900">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-emerald-400">Biometria Capturada</p>
                          <p className="text-xs text-emerald-500/70 truncate">Foto anexada ao registro</p>
                      </div>
                      
                      {/* Botão para cadastrar novo usuário se não tiver nome selecionado */}
                      {!employeeName && (
                          <button
                            onClick={() => onRegisterNew(facePhoto)}
                            className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 shadow-sm"
                            title="Colaborador não encontrado? Cadastrar Novo"
                          >
                             <UserPlus className="w-4 h-4" />
                             <span>Cadastrar</span>
                          </button>
                      )}

                      <button 
                        onClick={() => setFacePhoto(null)}
                        className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover foto"
                      >
                          <Trash className="w-4 h-4" />
                      </button>
                  </div>
              )}
            </div>
          </div>

          <div className="border-t border-dark-800"></div>

          {/* Section 2: Add Items */}
          <div className="space-y-4">
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

            {/* Items List */}
            {items.length > 0 ? (
              <div className="mt-4 border border-dark-800 rounded-lg overflow-hidden bg-dark-950/30">
                <div className="bg-dark-800/50 px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-dark-800">
                  Itens na Lista ({items.length})
                </div>
                <ul className="divide-y divide-dark-800">
                  {items.map((item, index) => (
                    <li key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dark-800 text-zinc-400 text-xs font-bold border border-dark-700">
                          {index + 1}
                        </span>
                        <div>
                           <div className="flex items-center gap-2">
                               {item.code && (
                                 <span className="text-xs font-mono bg-dark-800 border border-dark-700 px-1.5 rounded text-zinc-400">
                                   {item.code}
                                 </span>
                               )}
                               <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                           </div>
                           {item.ca && <span className="text-xs text-zinc-600">CA: {item.ca}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                        title="Remover item"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
               <div className="text-center py-8 text-zinc-600 text-sm bg-dark-950/50 border border-dashed border-dark-800 rounded-xl">
                  Nenhum item adicionado à lista.
               </div>
            )}
          </div>

          {/* Section 3: Expiration Configuration */}
          <div className="bg-dark-950/50 p-4 rounded-xl border border-dark-800">
               <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                       <CalendarClock className="w-4 h-4 text-brand-500" />
                       <h3 className="text-sm font-bold text-zinc-300">Validade do Registro</h3>
                   </div>
                   <div className="flex items-center gap-2">
                      <label className="text-xs text-white mr-2 cursor-pointer select-none" htmlFor="autoDelete">Exclusão Automática</label>
                      <input 
                          id="autoDelete"
                          type="checkbox" 
                          checked={enableExpiration}
                          onChange={(e) => setEnableExpiration(e.target.checked)}
                          className="w-4 h-4 text-brand-600 rounded border-dark-600 bg-dark-800 focus:ring-brand-500"
                      />
                   </div>
               </div>
               
               {enableExpiration && (
                   <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                       <input 
                          type="number" 
                          min="1"
                          value={expireValue}
                          onChange={(e) => setExpireValue(parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-1.5 text-sm bg-dark-900 border border-dark-700 rounded text-white focus:ring-1 focus:ring-brand-500 outline-none"
                       />
                       <select 
                          value={expireUnit}
                          onChange={(e) => setExpireUnit(e.target.value as AutoDeleteUnit)}
                          className="px-3 py-1.5 text-sm bg-dark-900 border border-dark-700 rounded text-white focus:ring-1 focus:ring-brand-500 outline-none"
                       >
                          <option value="minutes">Minutos</option>
                          <option value="days">Dias</option>
                          <option value="months">Meses</option>
                       </select>
                   </div>
               )}
          </div>
        </div>

        {/* Footer Submit */}
        <div className="p-6 bg-dark-900 border-t border-dark-800">
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || (!employeeName && !collabSearchQuery) || !facePhoto}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-brand-500/20 transform active:scale-[0.99] ${
              items.length === 0 || (!employeeName && !collabSearchQuery) || !facePhoto
                ? 'bg-dark-700 text-zinc-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500'
            }`}
          >
            <Save className="w-5 h-5" />
            <span>Registrar Entrega</span>
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