import React, { useState } from 'react';
import { X, Package, Plus, Barcode, Trash2, Box, Pencil, Check, Search } from 'lucide-react';
import { EpiCatalogItem } from '../types';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: EpiCatalogItem[];
  onUpdateCatalog: (items: EpiCatalogItem[]) => void;
  onSync?: (item: EpiCatalogItem) => void;
}

const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onUpdateCatalog,
  onSync
}) => {
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState<string>('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleAddOrUpdateCatalogItem = () => {
    if (!newItemName || !newItemCode) return;
    
    if (!editingId && catalog.some(i => i.code === newItemCode)) {
      alert("Já existe um item com este Código.");
      return;
    }

    const stockValue = newItemStock === '' ? 0 : parseInt(newItemStock);
    let updatedItem: EpiCatalogItem;

    if (editingId) {
        updatedItem = { id: editingId, code: newItemCode, name: newItemName, stock: stockValue };
        onUpdateCatalog(catalog.map(item => item.id === editingId ? updatedItem : item));
    } else {
        updatedItem = { id: Date.now().toString(), code: newItemCode, name: newItemName, stock: stockValue };
        onUpdateCatalog([...catalog, updatedItem]);
    }
    
    if (onSync) onSync(updatedItem);
    
    setNewItemCode('');
    setNewItemName('');
    setNewItemStock('0');
    setEditingId(null);
  };

  const filteredCatalog = catalog.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-800 flex flex-col max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-white">{editingId ? 'Editar EPI' : 'Catálogo de EPIs'}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            <div className={`p-4 rounded-xl border border-dark-800 space-y-3 ${editingId ? 'bg-brand-900/20' : 'bg-dark-950'}`}>
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Código" value={newItemCode} onChange={(e) => setNewItemCode(e.target.value)} className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white" />
                    <input type="number" placeholder="Estoque" value={newItemStock} onChange={(e) => setNewItemStock(e.target.value)} className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white" />
                </div>
                <input type="text" placeholder="Nome do EPI" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white" />
                <button onClick={handleAddOrUpdateCatalogItem} className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-all">
                    {editingId ? 'Atualizar e Sincronizar' : 'Cadastrar e Sincronizar'}
                </button>
            </div>

            <div className="space-y-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input type="text" placeholder="Filtrar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white" /></div>
                <div className="border border-dark-800 rounded-lg divide-y divide-dark-800 max-h-[300px] overflow-y-auto">
                    {filteredCatalog.map(item => (
                        <div key={item.id} className="p-3 flex items-center justify-between hover:bg-dark-800/50">
                            <div><p className="text-sm font-medium text-zinc-200">{item.name}</p><p className="text-xs text-zinc-500">Cód: {item.code} • Estoque: {item.stock}</p></div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEditingId(item.id); setNewItemCode(item.code); setNewItemName(item.name); setNewItemStock(item.stock.toString()); }} className="p-2 text-zinc-500 hover:text-brand-400"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => confirm("Apagar?") && onUpdateCatalog(catalog.filter(i => i.id !== item.id))} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogModal;