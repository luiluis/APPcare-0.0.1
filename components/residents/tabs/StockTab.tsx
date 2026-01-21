
import React, { useState, useMemo } from 'react';
import { Resident, StockItem } from '../../../types';
import { Package, AlertTriangle, MinusCircle, PlusCircle, ShoppingCart, Send, Edit2, Trash2, X, CheckCircle, Clock, AlertOctagon, Calendar, Layers, ArrowRight } from 'lucide-react';

interface StockTabProps {
  resident: Resident;
  onUpdateResident: (updated: Resident) => void;
}

export const StockTab: React.FC<StockTabProps> = ({ resident, onUpdateResident }) => {
  const { stock } = resident;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Estado para Seleção de Lote (Rastreabilidade)
  const [batchModal, setBatchModal] = useState<{
      isOpen: boolean;
      itemName: string;
      candidates: StockItem[];
  }>({ isOpen: false, itemName: '', candidates: [] });

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

  // --- GROUPING LOGIC (Aggregation) ---
  // Agrupa itens pelo Nome + Categoria para visualização unificada
  const groupedStock = useMemo(() => {
    if (!stock) return [];
    
    const groups: Record<string, { 
        items: StockItem[], 
        totalQty: number, 
        nearestExpiration: string | null,
        hasExpired: boolean,
        hasLowStock: boolean 
    }> = {};

    stock.forEach(item => {
        // Normaliza chave para agrupar (Case insensitive)
        const key = `${item.name.trim().toLowerCase()}|${item.category}`;
        
        if (!groups[key]) {
            groups[key] = { 
                items: [], 
                totalQty: 0, 
                nearestExpiration: null,
                hasExpired: false,
                hasLowStock: false
            };
        }

        groups[key].items.push(item);
        groups[key].totalQty += item.quantity;

        // Lógica de validade do grupo (pega a pior situação)
        if (item.expirationDate) {
            const expDate = new Date(item.expirationDate);
            const today = new Date();
            today.setHours(0,0,0,0);

            if (expDate < today) groups[key].hasExpired = true;
            
            // Atualiza a validade mais próxima
            if (!groups[key].nearestExpiration || new Date(groups[key].nearestExpiration!) > expDate) {
                groups[key].nearestExpiration = item.expirationDate;
            }
        }

        // Se a soma total for baixa, marca (mas verificado individualmente na UI)
        if (item.quantity <= item.minThreshold) groups[key].hasLowStock = true;
    });

    // Converte de volta para array para renderização
    return Object.values(groups).sort((a, b) => {
        // Prioridade visual: Vencidos > Baixo Estoque > Normal
        if (a.hasExpired && !b.hasExpired) return -1;
        if (!a.hasExpired && b.hasExpired) return 1;
        if (a.totalQty <= a.items[0].minThreshold && b.totalQty > b.items[0].minThreshold) return -1;
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
    if (confirm("Remover este lote do estoque?")) {
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

  /**
   * LÓGICA DE BAIXA INTELIGENTE (FEFO Compliance)
   * 1. Se houver apenas 1 lote com saldo: Baixa direto.
   * 2. Se houver múltiplos lotes com saldo: Abre Modal de Seleção.
   */
  const handleSmartSubtract = (groupItems: StockItem[]) => {
     // Filtra apenas lotes que têm saldo para baixar
     const activeBatches = groupItems.filter(i => i.quantity > 0);

     if (activeBatches.length === 0) {
         alert("Estoque zerado. Não é possível registrar uso.");
         return;
     }

     if (activeBatches.length === 1) {
         // Caso Simples: Só tem 1 lote disponível, baixa direto.
         executeDecrement(activeBatches[0].id);
     } else {
         // Caso Complexo: Múltiplos lotes. Obriga o usuário a escolher (Rastreabilidade).
         // Ordena por FEFO (First Expired, First Out)
         const sortedCandidates = activeBatches.sort((a, b) => {
             if (a.expirationDate && !b.expirationDate) return -1;
             if (!a.expirationDate && b.expirationDate) return 1;
             if (a.expirationDate && b.expirationDate) {
                 return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
             }
             return 0; // Se não tiver validade, mantém ordem
         });

         setBatchModal({
             isOpen: true,
             itemName: activeBatches[0].name,
             candidates: sortedCandidates
         });
     }
  };

  const executeDecrement = (itemId: string) => {
      const updatedStock = (stock || []).map(s => s.id === itemId ? { ...s, quantity: s.quantity - 1 } : s);
      onUpdateResident({ ...resident, stock: updatedStock });
      setBatchModal({ isOpen: false, itemName: '', candidates: [] });
  };

  const handleRequestReposition = (item: StockItem) => {
     // Marca todos os itens do grupo como 'ordered' (simplificação)
     // Na prática, criaria um pedido de compra
     const updatedStock = (stock || []).map(s => 
        s.name === item.name ? { 
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 relative pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupedStock.map(group => {
          const mainItem = group.items[0]; // Item de referência para dados estáticos (nome, unidade)
          const isMultiple = group.items.length > 1;
          const isLow = group.totalQty <= mainItem.minThreshold;
          
          // Verifica status de pedido (se qualquer um do grupo foi pedido)
          const isOrdered = group.items.some(i => i.status === 'ordered');

          // Definição de Estilos baseada na prioridade: Vencido > Vencendo > Baixo > Normal
          let cardClasses = "bg-white border-gray-100";
          if (group.hasExpired) cardClasses = "bg-red-50 border-red-300 ring-1 ring-red-200";
          else if (isLow && !isOrdered) cardClasses = "bg-rose-50 border-rose-200";

          return (
            <div key={mainItem.id} className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative ${cardClasses}`}>
              
              {/* Controls (Show Individual Items on Edit) */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {/* Se for multiplo, o edit precisa abrir uma lista ou algo mais complexo. 
                      Para este protótipo, editamos o primeiro ou abrimos o modal de add como 'novo lote' */}
                  <button onClick={() => handleOpenAdd()} className="p-1.5 bg-white/80 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded-lg shadow-sm" title="Adicionar Novo Lote"><PlusCircle className="w-3.5 h-3.5"/></button>
              </div>

              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg ${group.hasExpired ? 'bg-red-200 text-red-700' : isLow ? 'bg-white/60 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
                      {group.hasExpired ? <AlertOctagon className="w-6 h-6" /> : isMultiple ? <Layers className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  
                  {/* Badges de Status */}
                  <div className="flex flex-col items-end gap-1 mr-10">
                      {group.hasExpired && (
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm animate-pulse">
                          <X className="w-3 h-3" /> VENCIDO
                        </span>
                      )}
                      {isMultiple && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {group.items.length} Lotes
                        </span>
                      )}
                      {isLow && !isOrdered && !group.hasExpired && (
                        <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> BAIXO
                        </span>
                      )}
                  </div>
                </div>

                <h4 className="font-bold text-gray-800 text-lg mb-1 pr-2 truncate">{mainItem.name}</h4>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">{mainItem.category}</p>
                  {group.nearestExpiration && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${group.hasExpired ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                          {isMultiple ? 'Vence próx: ' : 'Val: '} 
                          {new Date(group.nearestExpiration).toLocaleDateString('pt-BR')}
                      </span>
                  )}
                </div>
                
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{group.totalQty}</span>
                  <span className={`text-sm font-medium mb-1.5 ${isLow ? 'text-red-400' : 'text-gray-500'}`}>{mainItem.unit}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-2">
                 <button 
                    onClick={() => handleSmartSubtract(group.items)}
                    disabled={group.totalQty <= 0}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors border shadow-sm
                        ${group.hasExpired
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                            : 'bg-white border-rose-200 hover:bg-rose-50 text-rose-700'
                        }`}
                 >
                    <MinusCircle className="w-4 h-4" /> Registrar Uso (-1)
                 </button>
                 
                 {/* Visualizar Lotes (Se Multiplo) ou Editar (Se Único) */}
                 {isMultiple ? (
                     <button 
                        onClick={() => handleSmartSubtract(group.items)} // Reutiliza o modal de seleção para visualização rápida também
                        className="w-full text-xs text-blue-600 font-bold hover:underline py-1"
                     >
                         Ver Detalhes dos Lotes
                     </button>
                 ) : (
                     <button 
                        onClick={() => handleOpenEdit(mainItem)}
                        className="w-full text-xs text-gray-400 hover:text-gray-600 font-medium py-1 flex items-center justify-center gap-1"
                     >
                         <Edit2 className="w-3 h-3"/> Editar Detalhes
                     </button>
                 )}

                 {isLow && !isOrdered && !group.hasExpired && (
                    <button 
                        onClick={() => handleRequestReposition(mainItem)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 py-2.5 rounded-lg text-sm font-bold transition-colors border border-amber-200 mt-1" 
                    >
                        <Send className="w-4 h-4" /> Solicitar Reposição
                    </button>
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

      {/* --- MODAL DE SELEÇÃO DE LOTE (RASTREABILIDADE) --- */}
      {batchModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <Layers className="w-5 h-5" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-gray-900">Selecione o Lote</h3>
                              <p className="text-xs text-gray-500">Qual lote será utilizado?</p>
                          </div>
                      </div>
                      <button onClick={() => setBatchModal({isOpen: false, itemName: '', candidates: []})}><X className="w-6 h-6 text-gray-400" /></button>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 text-sm text-blue-800">
                      <strong>Item:</strong> {batchModal.itemName}
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {batchModal.candidates.map((batch, idx) => {
                          const isRecommended = idx === 0; // Primeiro item é o FEFO (mais antigo)
                          return (
                              <button 
                                key={batch.id}
                                onClick={() => executeDecrement(batch.id)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all relative group
                                    ${isRecommended ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                                `}
                              >
                                  {isRecommended && (
                                      <span className="absolute -top-2.5 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                          RECOMENDADO (FEFO)
                                      </span>
                                  )}
                                  
                                  <div className="flex justify-between items-center">
                                      <div>
                                          <p className="font-bold text-gray-800 text-sm">Lote: {batch.batch || 'S/N'}</p>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                              Validade: {batch.expirationDate ? new Date(batch.expirationDate).toLocaleDateString('pt-BR') : 'N/A'}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-lg font-bold text-gray-900">{batch.quantity}</p>
                                          <p className="text-[10px] text-gray-400 uppercase">{batch.unit}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="mt-2 pt-2 border-t border-gray-200/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-[10px] font-bold text-blue-600">Clique para baixar 1 unid.</span>
                                      <ArrowRight className="w-3 h-3 text-blue-600" />
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
