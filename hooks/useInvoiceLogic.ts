
import { useState } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceCategory, CreateInvoiceDTO, QuickConsumeDTO, PaymentConfirmDTO, InvoicePayment } from '../types';
import { getLocalISOString } from '../lib/utils';

interface UseInvoiceLogicProps {
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
}

export const useInvoiceLogic = ({ invoices, onUpdateInvoices }: UseInvoiceLogicProps) => {
  
  // --- Actions ---

  const createRecurringInvoices = (data: CreateInvoiceDTO) => {
    // Conversão Explícita de String para Number
    const amountFloat = parseFloat(data.amount.replace(',', '.'));

    if (isNaN(amountFloat)) {
        console.error("Valor inválido fornecido para criação de fatura");
        return;
    }

    const newInvoices: Invoice[] = [];
    const loopCount = data.isRecurring ? (data.recurrenceCount || 1) : 1;
    let baseDate = new Date(data.dueDate);
    
    // Mock de upload de arquivo (em produção, isso iria para um S3/Supabase Storage)
    const mockAttachmentUrl = data.attachment ? URL.createObjectURL(data.attachment) : undefined;

    for (let i = 0; i < loopCount; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setMonth(baseDate.getMonth() + i);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const id = `inv-gen-${Date.now()}-${i}`;
      // Fix: Adjust due date string manually to avoid timezone shifts
      const dueDateString = currentDate.toISOString().split('T')[0]; 

      newInvoices.push({
        id: id,
        type: data.type,
        residentId: data.type === 'income' ? data.residentId : undefined,
        branchId: data.branchId,
        month: month,
        year: year,
        status: (data.status === InvoiceStatus.PAID && i === 0) ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
        dueDate: dueDateString,
        totalAmount: amountFloat,
        items: [{
          id: `item-${id}`,
          invoiceId: id,
          description: data.description + (loopCount > 1 ? ` (${i+1}/${loopCount})` : ''),
          amount: amountFloat,
          category: data.category as InvoiceCategory,
          date: dueDateString
        }],
        attachmentUrl: mockAttachmentUrl,
        supplier: data.supplier, // Mapeando fornecedor
        payments: [] // Inicializado vazio
      });
    }

    onUpdateInvoices([...invoices, ...newInvoices]);
  };

  const addQuickConsume = (data: QuickConsumeDTO) => {
    const amountFloat = parseFloat(data.amount.replace(',', '.'));

    if (isNaN(amountFloat)) {
        console.error("Valor inválido fornecido para consumo rápido");
        return;
    }

    const dateObj = new Date(data.date);
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    // Lógica Inteligente: Busca fatura aberta
    const targetInvoiceIndex = invoices.findIndex(inv => 
      inv.type === 'income' &&
      inv.residentId === data.residentId &&
      inv.month === month &&
      inv.year === year &&
      inv.status !== InvoiceStatus.PAID
    );

    let updatedInvoices = [...invoices];
    
    // Mock URL se houver anexo (apenas para o item, embora o ERP mostre na fatura)
    const mockAttachmentUrl = data.attachment ? URL.createObjectURL(data.attachment) : undefined;

    if (targetInvoiceIndex >= 0) {
      // Append to existing
      const targetInvoice = updatedInvoices[targetInvoiceIndex];
      const newItem: InvoiceItem = {
        id: `item-ext-${Date.now()}`,
        invoiceId: targetInvoice.id,
        description: data.description,
        amount: amountFloat,
        category: data.category as InvoiceCategory,
        date: data.date
      };

      updatedInvoices[targetInvoiceIndex] = {
        ...targetInvoice,
        items: [...targetInvoice.items, newItem],
        totalAmount: targetInvoice.totalAmount + amountFloat,
        attachmentUrl: targetInvoice.attachmentUrl || mockAttachmentUrl // Mantém o antigo ou usa o novo
      };
    } else {
      // Create new invoice for the consumption
      const newInvoiceId = `inv-cons-${Date.now()}`;
      // Vence dia 05 do mês seguinte se criado hoje
      const nextMonth = new Date(year, month, 5);
      
      const newInvoice: Invoice = {
        id: newInvoiceId,
        type: 'income',
        residentId: data.residentId,
        branchId: data.branchId,
        month: month,
        year: year,
        status: InvoiceStatus.PENDING,
        dueDate: nextMonth.toISOString().split('T')[0],
        totalAmount: amountFloat,
        items: [{
          id: `item-ext-${Date.now()}`,
          invoiceId: newInvoiceId,
          description: data.description,
          amount: amountFloat,
          category: data.category as InvoiceCategory,
          date: data.date
        }],
        attachmentUrl: mockAttachmentUrl,
        payments: [] // Inicializado vazio
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

  /**
   * Registra um pagamento (parcial ou total) em uma fatura.
   * Calcula automaticamente o saldo e atualiza o status.
   */
  const registerPayment = (invoiceId: string, amount: number, method: string, date: string, notes?: string) => {
    const updatedInvoices = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;

      const newPayment: InvoicePayment = {
        id: `pay-${Date.now()}`,
        amount: amount,
        date: date,
        method: method,
        notes: notes
      };

      const currentPayments = inv.payments || [];
      const updatedPayments = [...currentPayments, newPayment];
      
      // Recalcula o total pago
      const totalPaid = updatedPayments.reduce((acc, curr) => acc + curr.amount, 0);
      
      // Verifica se quitou (com margem de segurança para float points)
      const isFullyPaid = totalPaid >= (inv.totalAmount - 0.01);

      return {
        ...inv,
        payments: updatedPayments,
        paidAmount: totalPaid,
        status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
        // Atualiza campos legados para facilidade de visualização na tabela principal
        paymentDate: date,
        paymentMethod: method
      };
    });
    
    onUpdateInvoices(updatedInvoices);
  };

  /**
   * Baixa em lote (compatibilidade com dashboard).
   * Registra o valor restante integral como pagamento.
   */
  const markAsPaidBatch = (invoiceIds: string[], paymentDetails: PaymentConfirmDTO) => {
    const updatedInvoices = invoices.map(inv => {
      if (!invoiceIds.includes(inv.id)) return inv;

      // Calcula quanto falta pagar
      const alreadyPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
      const remainingAmount = inv.totalAmount - alreadyPaid;

      if (remainingAmount <= 0) {
          // Se já está pago, apenas garante o status (idempotência)
          return { ...inv, status: InvoiceStatus.PAID };
      }

      const newPayment: InvoicePayment = {
        id: `pay-batch-${Date.now()}-${inv.id}`,
        amount: remainingAmount,
        date: paymentDetails.paymentDate,
        method: paymentDetails.paymentMethod,
        notes: 'Baixa em lote'
      };

      const updatedPayments = [...(inv.payments || []), newPayment];

      return { 
        ...inv, 
        status: InvoiceStatus.PAID,
        payments: updatedPayments,
        paidAmount: inv.totalAmount, // Agora está 100% pago
        paymentDate: paymentDetails.paymentDate,
        paymentMethod: paymentDetails.paymentMethod,
        paymentAccount: paymentDetails.paymentAccount
      };
    });
    onUpdateInvoices(updatedInvoices);
  };

  return {
    createRecurringInvoices,
    addQuickConsume,
    updateInvoiceStatus,
    markAsPaidBatch,
    registerPayment
  };
};
