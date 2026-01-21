
import { Invoice, InvoiceStatus, InvoiceCategory, Staff, PayrollCalculationResult, InvoiceItem } from '../types';

interface UsePayrollGenerationProps {
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
}

export const usePayrollGeneration = ({ invoices, onUpdateInvoices }: UsePayrollGenerationProps) => {

  /**
   * Helper privado para converter itens do cálculo de folha em itens de fatura.
   * Descontos tornam-se valores negativos para que a soma da fatura resulte no Líquido.
   */
  const mapCalculationToInvoiceItems = (
    invoiceId: string, 
    calculation: PayrollCalculationResult, 
    date: string
  ): InvoiceItem[] => {
    return calculation.items.map((item, index) => {
      // Se for desconto, o valor entra negativo na fatura para abater do total a pagar
      const signedAmount = item.type === 'deduction' ? -item.amount : item.amount;
      
      // Concatena referência na descrição (ex: "INSS (9.0%)")
      const description = item.reference 
        ? `${item.label} (${item.reference})`
        : item.label;

      return {
        id: `item-${invoiceId}-${index}`,
        invoiceId: invoiceId,
        description: description,
        amount: signedAmount,
        category: InvoiceCategory.SALARIO, // Mantém categoria macro, mas detalhado na descrição
        date: date
      };
    });
  };

  /**
   * Gera uma despesa de folha de pagamento detalhada.
   */
  const generatePayrollInvoice = (
    staff: Staff, 
    calculation: PayrollCalculationResult, 
    dueDate: string, 
    descriptionHeader: string
  ) => {
    // Criação do ID único
    const newInvoiceId = `inv-pay-${staff.id}-${Date.now()}`;
    const today = new Date();

    // Gera os itens baseados no cálculo (Base, Insalubridade, INSS, VT, etc)
    const invoiceItems = mapCalculationToInvoiceItems(newInvoiceId, calculation, dueDate);

    const newInvoice: Invoice = {
      id: newInvoiceId,
      type: 'expense',
      branchId: staff.branchId,
      staffId: staff.id, // Vínculo com RH
      month: today.getMonth() + 1, // Competência
      year: today.getFullYear(),
      status: InvoiceStatus.PENDING,
      dueDate: dueDate,
      // O total da fatura é o Líquido (soma dos positivos - soma dos negativos)
      totalAmount: calculation.netTotal, 
      supplier: staff.name, 
      items: invoiceItems, // Itens detalhados para histórico
      payments: []
    };

    onUpdateInvoices([...invoices, newInvoice]);
  };

  /**
   * Recalcula uma fatura de folha de pagamento existente.
   * Atualiza o valor total E recria os itens com base no novo cálculo.
   */
  const updatePayrollInvoice = (
    invoiceId: string,
    staff: Staff,
    calculation: PayrollCalculationResult,
    dueDate: string
  ) => {
    const updatedInvoices = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;

      // Proteção: Não alterar faturas já pagas
      if (inv.status === InvoiceStatus.PAID || (inv.paidAmount && inv.paidAmount > 0)) {
        console.warn(`[Payroll] Tentativa de recalcular fatura paga/parcial ignorada: ${inv.id}`);
        return inv;
      }

      // Recria os itens com o novo cálculo
      const newItems = mapCalculationToInvoiceItems(inv.id, calculation, dueDate);

      return {
        ...inv,
        dueDate: dueDate,
        totalAmount: calculation.netTotal,
        items: newItems // Substitui os itens antigos pelos novos
      };
    });

    onUpdateInvoices(updatedInvoices);
  };

  return {
    generatePayrollInvoice,
    updatePayrollInvoice
  };
};
