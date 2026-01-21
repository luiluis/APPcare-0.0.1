
import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { dataService } from '../services/dataService';
import { InvoiceStatus } from '../types';

export interface DREResult {
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  variableCosts: number;
  operationalExpenses: number;
  ebitda: number;
  netResult: number;
}

export const useFinancialReports = (month: number, year: number) => {
  const { invoices } = useData();
  const [dre, setDre] = useState<DREResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateDRE = async () => {
      setLoading(true);
      try {
        // 1. Receita Bruta (Faturamento de Mensalidades do Mês)
        const grossRevenue = invoices
          .filter(inv => 
            inv.type === 'income' && 
            inv.month === month && 
            inv.year === year &&
            inv.status !== InvoiceStatus.OVERDUE // Consideramos o faturado, exceto se já estiver perdido/cancelado (simplificado)
          )
          .reduce((acc, curr) => acc + curr.totalAmount, 0);

        // 2. Impostos (Simples Nacional estimado em 6% sobre Bruto)
        const taxes = Math.round(grossRevenue * 0.06);

        // 3. Receita Líquida
        const netRevenue = grossRevenue - taxes;

        // 4. Custos Variáveis (Consumo de Estoque/Farmácia)
        // Busca do backend pois está na tabela de movimentos
        const movements = await dataService.getFinancialMovements(month, year);
        const variableCosts = movements
          .filter(m => m.type === 'stock_usage')
          .reduce((acc, curr) => acc + curr.amount, 0);

        // 5. Despesas Operacionais (Contas Fixas + Folha + Manutenção)
        // Somar todas as invoices de 'expense' da competência
        const operationalExpenses = invoices
          .filter(inv => 
            inv.type === 'expense' && 
            inv.month === month && 
            inv.year === year
          )
          .reduce((acc, curr) => acc + curr.totalAmount, 0);

        // 6. EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)
        // Aqui simplificado como Resultado Operacional
        const ebitda = netRevenue - variableCosts - operationalExpenses;

        // 7. Resultado Líquido (Poderia incluir juros/amortizações aqui se houvesse)
        const netResult = ebitda;

        setDre({
          grossRevenue,
          taxes,
          netRevenue,
          variableCosts,
          operationalExpenses,
          ebitda,
          netResult
        });

      } catch (error) {
        console.error("Erro ao gerar DRE:", error);
      } finally {
        setLoading(false);
      }
    };

    generateDRE();
  }, [invoices, month, year]);

  return { dre, loading };
};
