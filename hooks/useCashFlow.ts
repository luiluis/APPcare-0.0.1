
import { useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';

export const useCashFlow = (invoices: Invoice[], month: number, year: number) => {
  
  const cashFlowData = useMemo(() => {
    // 1. Filtrar apenas o que foi efetivamente pago
    const paidInvoices = invoices.filter(inv => 
      (inv.status === InvoiceStatus.PAID || (inv.paidAmount && inv.paidAmount > 0)) && 
      inv.paymentDate
    );

    let totalIn = 0;
    let totalOut = 0;
    
    // Mapa para agrupar por dia do mês
    const dailyMap: Record<number, { income: number; expense: number }> = {};

    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap[i] = { income: 0, expense: 0 };
    }

    paidInvoices.forEach(inv => {
      // FIX: Uso de UTC para garantir que o dia seja consistente
      const d = new Date(inv.paymentDate!);
      // getUTCFullYear e getUTCMonth evitam que 2023-10-01T00:00Z vire 30 de setembro no Brasil
      const pYear = d.getUTCFullYear();
      const pMonth = d.getUTCMonth() + 1; // Month 0-indexed
      const pDay = d.getUTCDate();

      if (pYear === year && pMonth === month) {
        // Usa paidAmount se existir (pagamento parcial), senão totalAmount.
        // Ambos agora são CENTAVOS.
        const amount = inv.paidAmount || inv.totalAmount;

        if (inv.type === 'income') {
          totalIn += amount;
          if (dailyMap[pDay]) dailyMap[pDay].income += amount;
        } else {
          totalOut += amount;
          if (dailyMap[pDay]) dailyMap[pDay].expense += amount;
        }
      }
    });

    const dailyMoves = Object.entries(dailyMap).map(([day, values]) => ({
      day: parseInt(day),
      income: values.income,
      expense: values.expense,
      balance: values.income - values.expense
    })).sort((a, b) => a.day - b.day);

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut, // Saldo em centavos
      dailyMoves
    };

  }, [invoices, month, year]);

  return cashFlowData;
};
