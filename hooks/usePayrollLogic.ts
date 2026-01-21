
import { Staff, StaffIncident, TaxTable, PayrollLineItem, PayrollCalculationResult } from '../types';
import { formatCurrency } from '../lib/utils';

// Tabela Padrão 2024 (Valores em Centavos)
const INSS_TABLE_2024: TaxTable = {
  year: 2024,
  minWage: 141200, // R$ 1.412,00
  ceiling: 778602, // R$ 7.786,02
  brackets: [
    { limit: 141200, rate: 0.075 }, // Até 1.412,00
    { limit: 266668, rate: 0.09 },  // De 1.412,01 até 2.666,68
    { limit: 400003, rate: 0.12 },  // De 2.666,69 até 4.000,03
    { limit: 778602, rate: 0.14 },  // De 4.000,04 até 7.786,02
  ]
};

export const usePayrollLogic = () => {

  /**
   * Calcula o INSS Progressivo e retorna detalhamento (memória de cálculo).
   */
  const calculateINSS = (grossSalaryCents: number, table: TaxTable = INSS_TABLE_2024): { total: number, breakdown: string[] } => {
    let totalTax = 0;
    let previousLimit = 0;
    const breakdown: string[] = [];

    // O salário de contribuição é limitado ao teto do INSS
    const contributionBase = Math.min(grossSalaryCents, table.ceiling);

    for (let i = 0; i < table.brackets.length; i++) {
        const bracket = table.brackets[i];
        
        // Se o salário não atinge nem o início desta faixa, paramos.
        if (contributionBase <= previousLimit) break;

        // Base de cálculo nesta faixa: 
        // Minimo entre (Salário ou Limite Faixa) MENOS o limite anterior
        const currentLimit = bracket.limit;
        const taxableAmountInBracket = Math.min(contributionBase, currentLimit) - previousLimit;
        
        if (taxableAmountInBracket > 0) {
            const taxInBracket = Math.round(taxableAmountInBracket * bracket.rate);
            totalTax += taxInBracket;
            
            breakdown.push(
                `Faixa ${i + 1}: ${formatCurrency(taxableAmountInBracket)} x ${(bracket.rate * 100).toFixed(1)}% = ${formatCurrency(taxInBracket)}`
            );
        }

        previousLimit = currentLimit;
    }

    return { total: totalTax, breakdown };
  };

  const calculateEstimatedSalary = (
    staff: Staff, 
    incidents: StaffIncident[], 
    month: number, 
    year: number,
    taxTable: TaxTable = INSS_TABLE_2024
  ): PayrollCalculationResult => {
    const items: PayrollLineItem[] = [];

    // 1. Salário Base (Earning)
    const base = staff.financialInfo?.baseSalary || 0;
    items.push({
        id: 'base-salary',
        label: 'Salário Base',
        type: 'earning',
        amount: base
    });

    // 2. Insalubridade (Earning)
    const level = staff.financialInfo?.insalubridadeLevel || 0;
    if (level > 0) {
        const insalubrityValue = Math.round((taxTable.minWage * level) / 100);
        items.push({
            id: 'insalubrity',
            label: 'Adicional Insalubridade',
            type: 'earning',
            amount: insalubrityValue,
            reference: `${level}%`,
            description: `Baseado no salário mínimo de ${formatCurrency(taxTable.minWage)}`
        });
    }

    // 3. Ocorrências (Variável)
    const relevantIncidents = incidents.filter(inc => {
      if (!inc.date) return false;
      const [incYear, incMonth] = inc.date.split('-').map(Number);
      return incYear === year && incMonth === month;
    });

    relevantIncidents.forEach((inc, idx) => {
      const impact = inc.financialImpact || 0;
      if (impact === 0) return;

      if (impact > 0) {
        items.push({
            id: `inc-pos-${idx}`,
            label: `Bônus/Hora Extra: ${inc.type}`,
            type: 'earning',
            amount: impact,
            description: inc.description
        });
      } else {
        items.push({
            id: `inc-neg-${idx}`,
            label: `Desc.: ${inc.type === 'falta' ? 'Faltas/Atrasos' : inc.type}`,
            type: 'deduction',
            amount: Math.abs(impact),
            description: inc.description
        });
      }
    });

    // 4. Subtotal Bruto para Cálculo de Impostos
    const earnings = items.filter(i => i.type === 'earning').reduce((acc, curr) => acc + curr.amount, 0);
    
    // 5. INSS (Deduction)
    const inssResult = calculateINSS(earnings, taxTable);
    if (inssResult.total > 0) {
        items.push({
            id: 'inss',
            label: 'INSS',
            type: 'deduction',
            amount: inssResult.total,
            reference: 'Progressivo',
            description: inssResult.breakdown.join(' | ')
        });
    }

    // 6. Vale Transporte (Deduction)
    if (staff.benefits?.receivesTransportVoucher) {
        // Desconto legal padrão de 6% sobre o salário base
        const vtValue = Math.round(base * 0.06);
        items.push({
            id: 'vt',
            label: 'Vale Transporte',
            type: 'deduction',
            amount: vtValue,
            reference: '6.00%'
        });
    }

    // 7. Descontos Fixos Personalizados (Ex: Convênio, Empréstimo)
    staff.financialInfo?.customDeductions?.forEach((ded, idx) => {
        if (ded.amount > 0) {
            items.push({
                id: `custom-ded-${idx}`,
                label: ded.description || 'Desconto Diverso',
                type: 'deduction',
                amount: ded.amount
            });
        }
    });

    // 8. Totais Finais
    const grossTotal = items.filter(i => i.type === 'earning').reduce((acc, i) => acc + i.amount, 0);
    const discountTotal = items.filter(i => i.type === 'deduction').reduce((acc, i) => acc + i.amount, 0);
    const netTotal = grossTotal - discountTotal;

    return {
      items,
      grossTotal,
      discountTotal,
      netTotal,
      baseSalary: base
    };
  };

  return {
    calculateEstimatedSalary,
    INSS_TABLE_2024
  };
};
