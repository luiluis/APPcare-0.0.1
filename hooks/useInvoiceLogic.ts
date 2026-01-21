
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceCategory, CreateInvoiceDTO, QuickConsumeDTO } from '../types';
import { toCents, parseDateToUTC, sanitizeInput } from '../lib/utils';
import { storageService } from '../services/storageService';

interface UseInvoiceLogicProps {
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
}

export const useInvoiceLogic = ({ invoices, onUpdateInvoices }: UseInvoiceLogicProps) => {
  
  // --- Core Invoice Actions (CRUD) ---

  const createRecurringInvoices = async (data: CreateInvoiceDTO) => {
    // CONVERSÃO CRÍTICA: String Input -> Centavos
    const amountCents = toCents(data.amount);

    if (amountCents === 0 && parseFloat(data.amount) !== 0) {
        console.error("Valor inválido fornecido (zero ou NaN)");
    }

    // Sanitização para prevenir XSS
    const sanitizedDesc = sanitizeInput(data.description);
    const sanitizedSupplier = sanitizeInput(data.supplier);

    // FIX: Data segura em UTC para evitar deslocamento de dia
    const baseDate = parseDateToUTC(data.dueDate);
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth() + 1;
    const dueDateString = baseDate.toISOString().split('T')[0]; 
    const id = `inv-gen-${Date.now()}`;

    // Upload seguro via Service (Async) em vez de createObjectURL direto no render cycle
    let attachmentUrl: string | undefined = undefined;
    if (data.attachment) {
        try {
            attachmentUrl = await storageService.uploadFile(data.attachment, 'invoices');
        } catch (e) {
            console.error("Falha no upload do anexo", e);
        }
    }

    // Objeto de Fatura Única com Definição de Recorrência
    const newInvoice: Invoice = {
      id: id,
      type: data.type,
      residentId: data.type === 'income' ? data.residentId : undefined,
      branchId: data.branchId,
      month: month,
      year: year,
      status: data.status === InvoiceStatus.PAID ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
      dueDate: dueDateString,
      totalAmount: amountCents,
      items: [{
        id: `item-${id}`,
        invoiceId: id,
        description: sanitizedDesc + (data.isRecurring ? ' (Recorrente)' : ''),
        amount: amountCents,
        category: data.category as InvoiceCategory,
        date: dueDateString
      }],
      attachmentUrl: attachmentUrl,
      supplier: sanitizedSupplier,
      payments: [],
      // Nova estrutura de metadados
      recurrence: data.isRecurring ? {
          active: true,
          frequency: 'monthly',
          currentInstallment: 1,
          totalInstallments: data.recurrenceCount > 1 ? data.recurrenceCount : undefined, 
      } : undefined
    };

    onUpdateInvoices([...invoices, newInvoice]);
  };

  const addQuickConsume = async (data: QuickConsumeDTO) => {
    // Conversão para Centavos
    const amountCents = toCents(data.amount);

    if (amountCents <= 0) {
        console.error("Valor inválido");
        return;
    }

    const sanitizedDesc = sanitizeInput(data.description);
    const dateObj = parseDateToUTC(data.date);
    const month = dateObj.getUTCMonth() + 1;
    const year = dateObj.getUTCFullYear();

    // Lógica Inteligente: Busca fatura aberta do mês para agrupar
    const targetInvoiceIndex = invoices.findIndex(inv => 
      inv.type === 'income' &&
      inv.residentId === data.residentId &&
      inv.month === month &&
      inv.year === year &&
      inv.status !== InvoiceStatus.PAID
    );

    let updatedInvoices = [...invoices];
    
    // Upload seguro via Service
    let attachmentUrl: string | undefined = undefined;
    if (data.attachment) {
        try {
            attachmentUrl = await storageService.uploadFile(data.attachment, 'invoices');
        } catch (e) {
            console.error("Falha no upload do anexo", e);
        }
    }

    if (targetInvoiceIndex >= 0) {
      // Append to existing
      const targetInvoice = updatedInvoices[targetInvoiceIndex];
      const newItem: InvoiceItem = {
        id: `item-ext-${Date.now()}`,
        invoiceId: targetInvoice.id,
        description: sanitizedDesc,
        amount: amountCents, // Inteiro
        category: data.category as InvoiceCategory,
        date: data.date
      };

      updatedInvoices[targetInvoiceIndex] = {
        ...targetInvoice,
        items: [...targetInvoice.items, newItem],
        totalAmount: targetInvoice.totalAmount + amountCents, // Soma de inteiros
        attachmentUrl: targetInvoice.attachmentUrl || attachmentUrl
      };
    } else {
      // Create new invoice for the consumption
      const newInvoiceId = `inv-cons-${Date.now()}`;
      
      // Cria vencimento seguro para o próximo mês (dia 5)
      // Usamos UTC para garantir consistência
      const nextMonth = new Date(Date.UTC(year, month, 5));
      
      const newInvoice: Invoice = {
        id: newInvoiceId,
        type: 'income',
        residentId: data.residentId,
        branchId: data.branchId,
        month: month,
        year: year,
        status: InvoiceStatus.PENDING,
        dueDate: nextMonth.toISOString().split('T')[0],
        totalAmount: amountCents,
        items: [{
          id: `item-ext-${Date.now()}`,
          invoiceId: newInvoiceId,
          description: sanitizedDesc,
          amount: amountCents,
          category: data.category as InvoiceCategory,
          date: data.date
        }],
        attachmentUrl: attachmentUrl,
        payments: []
      };
      updatedInvoices.push(newInvoice);
    }

    onUpdateInvoices(updatedInvoices);
  };

  const updateInvoiceStatus = (invoiceId: string, newStatus: InvoiceStatus | string) => {
    const updatedInvoices = invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    );
    onUpdateInvoices(updatedInvoices);
  };

  return {
    createRecurringInvoices,
    addQuickConsume,
    updateInvoiceStatus
  };
};
