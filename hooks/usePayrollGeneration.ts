
import { Invoice, InvoiceStatus, InvoiceCategory, Staff } from '../types';

interface UsePayrollGenerationProps {
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
}

export const usePayrollGeneration = ({ invoices, onUpdateInvoices }: UsePayrollGenerationProps) => {

  /**
   * Gera uma despesa de folha de pagamento vinculada ao funcionário.
   * Assume que o amount já vem em centavos do usePayrollLogic.
   */
  const generatePayrollInvoice = (
    staff: Staff, 
    amountCents: number, 
    dueDate: string, 
    description: string,
    category: InvoiceCategory | string = InvoiceCategory.SALARIO
  ) => {
    // Criação do ID único
    const newInvoiceId = `inv-pay-${staff.id}-${Date.now()}`;
    const today = new Date();

    const newInvoice: Invoice = {
      id: newInvoiceId,
      type: 'expense',
      branchId: staff.branchId,
      staffId: staff.id, // Vínculo com RH
      month: today.getMonth() + 1, // Competência = Mês atual de geração
      year: today.getFullYear(),
      status: InvoiceStatus.PENDING,
      dueDate: dueDate,
      totalAmount: amountCents, // Valor em Centavos (Inteiro)
      supplier: staff.name, // Nome do funcionário como "Fornecedor"
      items: [{
        id: `item-${newInvoiceId}`,
        invoiceId: newInvoiceId,
        description: description,
        amount: amountCents,
        category: category,
        date: dueDate
      }],
      payments: []
    };

    onUpdateInvoices([...invoices, newInvoice]);
  };

  return {
    generatePayrollInvoice
  };
};
