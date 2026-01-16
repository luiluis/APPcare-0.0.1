
import { useState } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceCategory, CreateInvoiceDTO, QuickConsumeDTO, PaymentConfirmDTO } from '../types';
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
        supplier: data.supplier // Mapeando fornecedor
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
    // Num sistema real, cada item poderia ter seu anexo, ou a fatura acumularia anexos.
    // Aqui vamos simplificar: se não tem anexo na fatura principal, esse passa a ser.
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
        attachmentUrl: mockAttachmentUrl
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

  const markAsPaidBatch = (invoiceIds: string[], paymentDetails: PaymentConfirmDTO) => {
    const updatedInvoices = invoices.map(inv => 
      invoiceIds.includes(inv.id) ? { 
        ...inv, 
        status: InvoiceStatus.PAID,
        paymentDate: paymentDetails.paymentDate,
        paymentMethod: paymentDetails.paymentMethod,
        paymentAccount: paymentDetails.paymentAccount
      } : inv
    );
    onUpdateInvoices(updatedInvoices);
  };

  return {
    createRecurringInvoices,
    addQuickConsume,
    updateInvoiceStatus,
    markAsPaidBatch
  };
};
