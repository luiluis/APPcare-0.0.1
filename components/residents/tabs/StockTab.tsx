
import React, { useState, useMemo } from 'react';
import { Resident, StockItem } from '../../../types';
import { Package, AlertTriangle, MinusCircle, PlusCircle, ShoppingCart, Send, Edit2, Trash2, X, CheckCircle, Clock, AlertOctagon, Calendar } from 'lucide-react';

interface StockTabProps {
  resident: Resident;
  onUpdateResident: (updated: Resident) => void;
}

export const StockTab: React.FC<StockTabProps> = ({ resident, onUpdateResident }) => {
  const { stock } = resident;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Added residentId to satisfy StockItem interface
  const initialFormState: StockItem = { 
    id: '', 
    residentId: resident.id,
    name: '', 
    category: 'hygiene', 
    quantity: 0, 
    unit: 'unidades', 
    minThreshold: 5, 
    avgConsumption: '',
    batch: '',          
    expirationDate: ''  
  };
  const [form, setForm] = useState<StockItem>(initialFormState);

  // --- SORTING & LOGIC ---
  const sortedStock = useMemo(() => {
    if (!stock) return [];
    
    return [...stock].sort((a, b) => {
        // Prioridade 1: Itens com validade definida aparecem antes
        if (a.expirationDate && !b.expirationDate) return -1;
        if (!a.expirationDate && b.expirationDate) return 1;

        // Prioridade 2: Menor data de validade primeiro (Vencidos -> A Vencer)
        if (a.expirationDate && b.expirationDate) {
            return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        }

        // Prioridade 3: Estoque baixo
        const aLow = a.quantity <= a.minThreshold;
        const bLow = b.quantity <= b.minThreshold;
        if (aLow && !bLow) return -1;
        if (!aLow && bLow) return 1;

        return 0;
    });
  }, [stock]);

  // --- ACTIONS ---

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm(initialFormState);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setForm(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Remover este item do estoque?")) {
        const updatedStock = (stock || []).filter(s => s.id !== id);
        onUpdateResident({ ...resident, stock: updatedStock });
    }
  };

  const handleSave = () => {
    let updatedStock = [...(stock || [])];

    if (editingItem) {
        updatedStock = updatedStock.map(s => s.id === editingItem.id ? { ...form, id: editingItem.id } : s);
    } else {
        updatedStock.push({ ...form, id: `stock-${Date.now()}` });
    }

    onUpdateResident({ ...resident, stock: updatedStock });
    setIsEditModalOpen(false);
  };

  const handleQuickSubtract = (item: StockItem) => {
     if (item.quantity > 0) {
        const updatedStock = (stock || []).map(s => s.id === item.id ? { ...s, quantity: s.quantity - 1 } : s);
        onUpdateResident({ ...resident, stock: updatedStock });
     }
  };

  const handleRequestReposition = (item: StockItem) => {
     // Persist Order Status locally on the item
     const updatedStock = (stock || []).map(s => 
        s.id === item.id ? { 
            ...s, 
            status: 'ordered', 
            lastOrderDate: new Date().toLocaleDateString('pt-BR') 
        } as StockItem : s
     );
     onUpdateResident({ ...resident, stock: updatedStock });
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStock.map(item => {
          const isLow = item.quantity <= item.minThreshold;
          const isOrdered = item.status === 'ordered';

          // Lógica de Vencimento
          const today = new Date();
          today.setHours(0,0,0,0);
          
          let isExpired = false;
          let isExpiringSoon = false;

          if (item.expirationDate) {
              const expDate = new Date(item.expirationDate);
              // Ajuste simples para garantir comparação correta da string YYYY-MM-DD
              expDate.setHours(0,0,0,0);
              
              isExpired = expDate < today;
              
              const thirtyDaysFromNow = new Date(today);
              thirtyDaysFromNow.setDate(today.getDate() + 30);
              
              isExpiringSoon = !isExpired && expDate <= thirtyDaysFromNow;
          }

          // Definição de Estilos baseada na prioridade: Vencido > Vencendo > Baixo > Normal
          let cardClasses = "bg-white border-gray-100";
          if (isExpired) cardClasses = "bg-red-50 border-red-300 ring-1 ring-red-200";
          else if (isExpiringSoon) cardClasses = "bg-amber-50 border-amber-300 ring-1 ring-amber-200";
          else if (isLow && !isOrdered) cardClasses = "bg-rose-50 border-rose-200";

          return (
            <div key={item.id} className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative ${cardClasses}`}>
              
              {/* Edit Controls (Hover) */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-white/80 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded-lg shadow-sm"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-white/80 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>

              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg ${isExpired ? 'bg-red-200 text-red-700' : isExpiringSoon ? 'bg-amber-200 text-amber-700' : isLow ? 'bg-white/60 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
                      {isExpired ? <AlertOctagon className="w-6 h-6" /> : isExpiringSoon ? <Calendar className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  
                  {/* Badges de Status */}
                  <div className="flex flex-col items-end gap-1 mr-14">
                      {isExpired && (
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm animate-pulse">
                          <X className="w-3 h-3" /> VENCIDO
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="bg-amber-500 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3 h-3" /> VENCE EM BREVE
                        </span>
                      )}
                      {isOrdered ? (
                         <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Solicitado
                         </span>
                      ) : isLow && !isExpired && (
                        <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> BAIXO ESTOQUE
                        </span>
                      )}
                  </div>
                </div>

                <h4 className="font-bold text-gray-800 text-lg mb-1 pr-2 truncate">{item.name}</h4>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">{item.category}</p>
                  {item.expirationDate && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isExpired ? 'bg-red-200 text-red-800' : isExpiringSoon ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                          Val: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                      </span>
                  )}
                </div>
                
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity}</span>
                  <span className={`text-sm font-medium mb-1.5 ${isLow ? 'text-red-400' : 'text-gray-500'}`}>{item.unit}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-2">
                 <button 
                    onClick={() => handleQuickSubtract(item)}
                    disabled={isExpired}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors border
                        ${isExpired 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                            : 'bg-white border-rose-200 hover:bg-rose-50 text-rose-700'
                        }`}
                 >
                    <MinusCircle className="w-4 h-4" /> Registrar Uso (-1)
                 </button>
                 
                 {isLow && !isOrdered && !isExpired && (
                    <button 
                        onClick={() => handleRequestReposition(item)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 py-2.5 rounded-lg text-sm font-bold transition-colors border border-amber-200" 
                        title="Notificar família ou financeiro"
                    >
                        <Send className="w-4 h-4" /> Solicitar Reposição
                    </button>
                 )}
                 
                 {isOrdered && (
                    <div className="w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 py-2 rounded-lg text-xs font-medium border border-gray-100">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Aguardando Chegada</span>
                        <span className="text-[10px] text-gray-400">Solicitado em: {item.lastOrderDate}</span>
                    </div>
                 )}
              </div>
            </div>
          );
        })}
        
        {/* Card Adicionar Novo */}
        <button 
           onClick={handleOpenAdd}
           className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all min-h-[250px]"
        >
           <PlusCircle className="w-8 h-8 mb-2" />
           <span className="font-semibold">Cadastrar Item</span>
        </button>
      </div>

      {/* --- MODAL EDIT/ADD --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</h3>
                 <button onClick={() => setIsEditModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className={labelStyle}>Nome do Item</label>
                    <input 
                      className={inputStyle} 
                      placeholder="Ex: Fralda Geriátrica G"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className={labelStyle}>Categoria</label>
                        <select 
                            className={inputStyle}
                            value={form.category}
                            onChange={e => setForm({...form, category: e.target.value as any})}
                        >
                            <option value="hygiene">Higiene</option>
                            <option value="medication">Medicação</option>
                            <option value="other">Outros</option>
                        </select>
                     </div>
                     <div>
                        <label className={labelStyle}>Unidade de Medida</label>
                        <input 
                            className={inputStyle} 
                            placeholder="Ex: unidades, caixas"
                            value={form.unit}
                            onChange={e => setForm({...form, unit: e.target.value})}
                        />
                     </div>
                 </div>

                 {/* NOVOS CAMPOS: LOTE E VALIDADE */}
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className={labelStyle}>Lote (Opcional)</label>
                        <input 
                            className={inputStyle} 
                            placeholder="Ex: L8920"
                            value={form.batch || ''}
                            onChange={e => setForm({...form, batch: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className={labelStyle}>Validade</label>
                        <input 
                            type="date"
                            className={inputStyle} 
                            value={form.expirationDate || ''}
                            onChange={e => setForm({...form, expirationDate: e.target.value})}
                        />
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className={labelStyle}>Quantidade Atual</label>
                        <input 
                            type="number"
                            className={inputStyle} 
                            value={form.quantity}
                            onChange={e => setForm({...form, quantity: parseFloat(e.target.value) || 0})}
                        />
                     </div>
                     <div>
                        <label className={labelStyle}>Alerta Mínimo</label>
                        <input 
                            type="number"
                            className={inputStyle} 
                            value={form.minThreshold}
                            onChange={e => setForm({...form, minThreshold: parseFloat(e.target.value) || 0})}
                        />
                     </div>
                 </div>

                 <div>
                    <label className={labelStyle}>Consumo Médio (Texto Livre)</label>
                    <input 
                      className={inputStyle} 
                      placeholder="Ex: 4 por dia"
                      value={form.avgConsumption || ''}
                      onChange={e => setForm({...form, avgConsumption: e.target.value})}
                    />
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                    <button 
                      onClick={handleSave}
                      className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md"
                    >
                       Salvar Item
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
