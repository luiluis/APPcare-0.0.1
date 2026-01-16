
import React from 'react';
import { X, Receipt, ArrowDownCircle, Clock, FileText, Home, ShoppingCart, Check, Download, Truck } from 'lucide-react';
import { Invoice, Resident, InvoiceStatus, InvoiceCategory } from '../../types';
import { formatCurrency, formatDateBr } from '../../lib/utils';

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  resident?: Resident;
  onPay: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice, onClose, resident, onPay }) => {
  if (!invoice) return null;

  const getStatusLabel = (status: string) => {
     if (status === InvoiceStatus.PAID) return 'Pago';
     if (status === InvoiceStatus.OVERDUE) return 'Atrasado';
     return 'Pendente';
  };

  const getStatusColor = (status: string) => {
    if (status === InvoiceStatus.PAID) return 'bg-emerald-500';
    if (status === InvoiceStatus.OVERDUE) return 'bg-rose-500';
    return 'bg-amber-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
           <div className="flex gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${invoice.type === 'income' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-rose-600 text-white shadow-rose-200'}`}>
                {invoice.type === 'income' ? <Receipt className="w-7 h-7" /> : <ArrowDownCircle className="w-7 h-7" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  {invoice.type === 'income' ? 'Demonstrativo' : 'Despesa'}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {resident ? resident.name : (invoice.supplier || invoice.items[0].description)}
                </h2>
                <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-2">
                   <Clock className="w-4 h-4" /> Vencimento: <span className="font-semibold text-gray-700">{formatDateBr(invoice.dueDate)}</span>
                </p>
              </div>
           </div>
           <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-auto bg-white">
           <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Status</p>
                 <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(invoice.status)}`}></span>
                    <span className="font-bold text-gray-800 text-lg">{getStatusLabel(invoice.status)}</span>
                 </div>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-right">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Valor Total</p>
                 <p className={`text-2xl font-extrabold ${invoice.type === 'income' ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(invoice.totalAmount)}
                 </p>
              </div>
           </div>

           {invoice.supplier && (
             <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Fornecedor</p>
                  <p className="font-semibold text-gray-800">{invoice.supplier}</p>
                </div>
             </div>
           )}

           <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
             <FileText className="w-5 h-5 text-gray-400" /> Detalhamento
           </h4>
           <div className="space-y-2">
              {invoice.items.map(item => (
                <div key={item.id} className="flex justify-between items-center py-4 px-3 hover:bg-gray-50 rounded-xl transition-colors">
                   <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.category === InvoiceCategory.MENSALIDADE ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.category === InvoiceCategory.MENSALIDADE ? <Home className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-base font-semibold text-gray-900">{item.description}</p>
                         <p className="text-xs text-gray-400 font-medium">{formatDateBr(item.date)} • {String(item.category).toUpperCase()}</p>
                      </div>
                   </div>
                   <span className="font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl">
           <div className="flex gap-3">
              {invoice.status !== InvoiceStatus.PAID ? (
                 <button onClick={onPay} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                    Confirmar Pagamento
                 </button>
              ) : (
                 <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Check className="w-5 h-5" /> Pago
                 </span>
              )}
           </div>
           <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-3 border border-gray-300 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
                 <Download className="w-5 h-5" /> PDF
              </button>
              <button onClick={onClose} className="px-5 py-3 text-gray-600 hover:text-gray-900 text-sm font-semibold">
                 Fechar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
