import React, { useState, useEffect, useRef } from 'react';
import { HardHat, Eraser, User, ListPlus, Trash, Save, Search, CalendarClock, Plus, AlertCircle, Clock } from 'lucide-react';
import { EpiRecord, EpiItem, EpiCatalogItem, AutoDeleteConfig, AutoDeleteUnit, Collaborator } from '../types';

interface AssignmentFormProps {
  onAdd: (record: EpiRecord) => void;
  catalog: EpiCatalogItem[];
  collaborators: Collaborator[];
  onOpenCatalog: () => void;
  onOpenCollaborators: () => void;
  defaultConfig: AutoDeleteConfig;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ onAdd, catalog, collaborators, onOpenCatalog, onOpenCollaborators, defaultConfig }) => {
  // Header Data
  const [employeeName, setEmployeeName] = useState('');
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [employeeAdmission, setEmployeeAdmission] = useState('');
  const [shift, setShift] = useState(''); 
  
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
  };

  const handleClearAll = () => {
    setEmployeeName('');
    setCollabSearchQuery('');
    setEmployeeCpf('');
    setShift('');
    setEmployeeAdmission('');
    setItems([]);
    setSearchQuery('');
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
    
    if (!finalName || items.length === 0) {
      alert("Preencha o nome do colaborador e adicione pelo menos um EPI.");
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
      autoDeleteAt: deleteDate
    };

    onAdd(newRecord);
    handleClearAll();
  };

  return (
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
                  }}
                  onFocus={() => setShowCollabSuggestions(true)}
                  className="w-full pl-9 pr-4 py-3 bg-dark-950 border border-dark-700 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-zinc-600 text-zinc-200"
                  placeholder="Buscar colaborador..."
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Search className="w-4 h-4" />
              </div>
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
                      <div className="px-4 py-3 text-sm text-zinc-500">
                         Nenhum colaborador encontrado.
                      </div>
                  )}
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
          disabled={items.length === 0 || (!employeeName && !collabSearchQuery)}
          className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-brand-500/20 transform active:scale-[0.99] ${
            items.length === 0 || (!employeeName && !collabSearchQuery)
              ? 'bg-dark-700 text-zinc-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500'
          }`}
        >
          <Save className="w-5 h-5" />
          <span>Registrar Entrega</span>
        </button>
      </div>
    </div>
  );
};

export default AssignmentForm;