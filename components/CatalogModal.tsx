import React, { useState } from 'react';
import { X, Package, Plus, Barcode, Trash2, Box, Pencil, Check } from 'lucide-react';
import { EpiCatalogItem } from '../types';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: EpiCatalogItem[];
  onUpdateCatalog: (items: EpiCatalogItem[]) => void;
}

const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onUpdateCatalog
}) => {
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState<string>('0');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setNewItemCode('');
    setNewItemName('');
    setNewItemStock('0');
    setEditingId(null);
  };

  const handleAddOrUpdateCatalogItem = () => {
    if (!newItemName || !newItemCode) return;
    
    // Check for duplicates only if adding new or changing code
    if (!editingId && catalog.some(i => i.code === newItemCode)) {
      alert("Já existe um item com este Código/ID.");
      return;
    }
    // If editing, check if code changed to one that already exists (excluding itself)
    if (editingId && catalog.some(i => i.code === newItemCode && i.id !== editingId)) {
        alert("Já existe outro item com este Código/ID.");
        return;
    }

    const stockValue = newItemStock === '' ? 0 : parseInt(newItemStock);

    if (editingId) {
        // Update existing item
        const updatedCatalog = catalog.map(item => 
            item.id === editingId 
            ? { ...item, code: newItemCode, name: newItemName, stock: stockValue >= 0 ? stockValue : 0 }
            : item
        );
        onUpdateCatalog(updatedCatalog);
    } else {
        // Add new item
        const newItem: EpiCatalogItem = {
            id: Date.now().toString(),
            code: newItemCode,
            name: newItemName,
            stock: stockValue >= 0 ? stockValue : 0
        };
        onUpdateCatalog([...catalog, newItem]);
    }
    
    resetForm();
  };

  const handleEditClick = (item: EpiCatalogItem) => {
    setEditingId(item.id);
    setNewItemCode(item.code);
    setNewItemName(item.name);
    setNewItemStock(item.stock.toString());
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleRemoveCatalogItem = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item do catálogo?")) {
        onUpdateCatalog(catalog.filter(item => item.id !== id));
        if (editingId === id) resetForm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {editingId ? 'Editar EPI / Estoque' : 'Catálogo de EPIs'}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            <div className={`p-4 rounded-xl border border-dark-800 space-y-3 transition-colors ${editingId ? 'bg-brand-900/20 border-brand-500/30' : 'bg-dark-950'}`}>
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                {editingId ? <Pencil className="w-4 h-4 text-brand-500" /> : <Plus className="w-4 h-4 text-zinc-500" />}
                {editingId ? 'Editar Item' : 'Adicionar Novo EPI'}
            </h4>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Código / ID"
                            value={newItemCode}
                            onChange={(e) => setNewItemCode(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                        />
                    </div>
                     <div className="relative">
                        <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="number"
                            min="0"
                            placeholder="Estoque"
                            value={newItemStock}
                            onChange={(e) => setNewItemStock(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                        />
                    </div>
                </div>
                <input
                type="text"
                placeholder="Nome do EPI (ex: Botina)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-zinc-600"
                />
            </div>
            
            <div className="flex gap-2">
                {editingId && (
                    <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-dark-800 hover:bg-dark-700 text-zinc-300 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleAddOrUpdateCatalogItem}
                    disabled={!newItemName || !newItemCode}
                    className={`flex-1 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        editingId 
                        ? 'bg-brand-600 hover:bg-brand-500' 
                        : 'bg-brand-600 hover:bg-brand-500 disabled:bg-dark-800 disabled:text-zinc-600'
                    }`}
                >
                    {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingId ? 'Atualizar Item' : 'Cadastrar'}
                </button>
            </div>
            </div>

            <div className="space-y-2">
            <h4 className="text-sm font-bold text-zinc-400 flex items-center justify-between">
                <span>Itens Cadastrados</span>
                <span className="text-xs font-normal text-zinc-600 bg-dark-800 px-2 py-0.5 rounded-full">{catalog.length}</span>
            </h4>
            
            {catalog.length === 0 ? (
                <div className="text-center py-8 bg-dark-950/50 rounded-lg border border-dashed border-dark-800">
                <Package className="w-8 h-8 text-dark-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-600">Nenhum item no catálogo.</p>
                </div>
            ) : (
                <div className="border border-dark-800 rounded-lg divide-y divide-dark-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                {catalog.map(item => (
                    <div key={item.id} className={`p-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors ${editingId === item.id ? 'bg-brand-900/10' : ''}`}>
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-dark-800 border border-dark-700 px-1.5 py-0.5 rounded text-zinc-400">{item.code}</span>
                            <p className="text-sm font-medium text-zinc-200 truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <Box className="w-3 h-3 text-zinc-600" />
                            <span className="text-xs text-zinc-500">Estoque: <strong className={item.stock === 0 ? "text-red-500" : "text-zinc-400"}>{item.stock}</strong></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => handleEditClick(item)}
                            className="text-zinc-500 hover:text-brand-400 p-2 hover:bg-brand-500/10 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleRemoveCatalogItem(item.id)}
                            className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
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
  );
};

export default CatalogModal;