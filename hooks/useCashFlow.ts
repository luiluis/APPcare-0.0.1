
import { useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';

export const useCashFlow = (invoices: Invoice[], month: number, year: number) => {
  
  const cashFlowData = useMemo(() => {
    // 1. Filtrar apenas o que foi efetivamente pago (Regime de Caixa)
    // Precisamos garantir que tenha status PAID e uma data de pagamento registrada
    const paidInvoices = invoices.filter(inv => 
      (inv.status === InvoiceStatus.PAID || inv.paidAmount && inv.paidAmount > 0) && 
      inv.paymentDate
    );

    let totalIn = 0;
    let totalOut = 0;
    
    // Mapa para agrupar por dia do mês (1 a 31)
    const dailyMap: Record<number, { income: number; expense: number }> = {};

    // Inicializa todos os dias do mês com 0 para o gráfico não ficar buracado
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap[i] = { income: 0, expense: 0 };
    }

    paidInvoices.forEach(inv => {
      // Parse da data de pagamento (assumindo formato ISO YYYY-MM-DD ou DateTime)
      const pDate = new Date(inv.paymentDate!);
      
      // Ajuste de Fuso: Se a string for YYYY-MM-DD, o new Date() pode pegar dia anterior dependendo do timezone.
      // Melhor fazer split se não tiver hora, ou usar métodos UTC se tiver certeza do formato.
      // Aqui usaremos getMonth() local, assumindo que a paymentDate foi salva corretamente.
      // Nota: getMonth é 0-indexed (0 = Jan), month argumento é 1-indexed (1 = Jan).
      
      // Verificação manual de string para evitar problemas de timezone com new Date()
      const [pYearStr, pMonthStr, pDayStr] = inv.paymentDate!.split('T')[0].split('-');
      const pYear = parseInt(pYearStr);
      const pMonth = parseInt(pMonthStr);
      const pDay = parseInt(pDayStr);

      if (pYear === year && pMonth === month) {
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

    // Converte o mapa em array ordenado para gráficos
    const dailyMoves = Object.entries(dailyMap).map(([day, values]) => ({
      day: parseInt(day),
      income: values.income,
      expense: values.expense,
      balance: values.income - values.expense
    })).sort((a, b) => a.day - b.day);

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      dailyMoves
    };

  }, [invoices, month, year]);

  return cashFlowData;
};
