
import { Invoice, InvoiceStatus, PaymentConfirmDTO, InvoicePayment } from '../types';

interface UsePaymentProcessingProps {
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
}

export const usePaymentProcessing = ({ invoices, onUpdateInvoices }: UsePaymentProcessingProps) => {

  /**
   * Registra um pagamento (parcial ou total).
   * Input 'amountInput' pode vir como float da UI, convertemos para centavos aqui.
   */
  const registerPayment = (invoiceId: string, amountInput: number, method: string, date: string, notes?: string) => {
    // Conversão Float UI -> Int Centavos
    const amountCents = Math.round(amountInput * 100);

    const updatedInvoices = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;

      const newPayment: InvoicePayment = {
        id: `pay-${Date.now()}`,
        amount: amountCents,
        date: date,
        method: method,
        notes: notes
      };

      const currentPayments = inv.payments || [];
      const updatedPayments = [...currentPayments, newPayment];
      
      // Soma de inteiros
      const totalPaidCents = updatedPayments.reduce((acc, curr) => acc + curr.amount, 0);
      
      // Verifica se quitou (comparação exata de inteiros)
      // Se total pago >= total da fatura
      const isFullyPaid = totalPaidCents >= inv.totalAmount;

      return {
        ...inv,
        payments: updatedPayments,
        paidAmount: totalPaidCents,
        status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
        // Atualiza campos de último pagamento para facilidade de visualização
        paymentDate: date,
        paymentMethod: method
      };
    });
    
    onUpdateInvoices(updatedInvoices);
  };

  /**
   * Baixa em lote.
   * Registra o valor restante integral como pagamento para cada fatura selecionada.
   */
  const markAsPaidBatch = (invoiceIds: string[], paymentDetails: PaymentConfirmDTO) => {
    const updatedInvoices = invoices.map(inv => {
      if (!invoiceIds.includes(inv.id)) return inv;

      // Calcula quanto falta pagar em centavos
      const alreadyPaidCents = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
      const remainingCents = inv.totalAmount - alreadyPaidCents;

      // Se já está pago ou saldo negativo, apenas garante o status e retorna
      if (remainingCents <= 0) {
          return { ...inv, status: InvoiceStatus.PAID };
      }

      const newPayment: InvoicePayment = {
        id: `pay-batch-${Date.now()}-${inv.id}`,
        amount: remainingCents,
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
    registerPayment,
    markAsPaidBatch
  };
};
