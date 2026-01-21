
import { Staff, StaffIncident, TaxTable, PayrollLineItem, PayrollCalculationResult } from '../types';
import { formatCurrency } from '../lib/utils';

// Tabela INSS 2024 (Valores em Centavos)
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

// Tabela IRRF 2024 (Valores em Centavos)
// Vigência a partir de Maio/2024 (MP 1.206/2024 convertida na Lei 14.848/2024)
const IRRF_TABLE_2024: TaxTable = {
  year: 2024,
  minWage: 141200, 
  ceiling: 0, // Não existe teto de contribuição para IR, apenas faixas
  brackets: [
    { limit: 225920, rate: 0, deduction: 0 },           // Isento até 2.259,20
    { limit: 282665, rate: 0.075, deduction: 16944 },   // 7,5% (Deduz 169,44)
    { limit: 375105, rate: 0.15, deduction: 38144 },    // 15% (Deduz 381,44)
    { limit: 466468, rate: 0.225, deduction: 66277 },   // 22,5% (Deduz 662,77)
    { limit: 999999999, rate: 0.275, deduction: 89600 } // 27,5% (Deduz 896,00) - Acima de 4.664,68
  ]
};

const DEDUCTION_PER_DEPENDENT = 18959; // R$ 189,59 por dependente

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

  /**
   * Calcula o IRRF (Imposto de Renda Retido na Fonte).
   * Base de Cálculo = Bruto - INSS - (Dependentes * 189,59)
   */
  const calculateIRRF = (
    grossSalaryCents: number, 
    inssValueCents: number, 
    dependentsCount: number,
    table: TaxTable = IRRF_TABLE_2024
  ): { value: number, rate: number, breakdown: string } => {
    
    const dependentsDeduction = dependentsCount * DEDUCTION_PER_DEPENDENT;
    
    // Base de cálculo legal
    let baseCalculation = grossSalaryCents - inssValueCents - dependentsDeduction;
    
    // Proteção contra base negativa
    if (baseCalculation < 0) baseCalculation = 0;

    let irrfValue = 0;
    let effectiveRate = 0;
    let breakdown = '';

    // Encontra a faixa correta na tabela progressiva
    for (const bracket of table.brackets) {
        if (baseCalculation <= bracket.limit) {
            const rawTax = Math.round(baseCalculation * bracket.rate);
            const deduction = bracket.deduction || 0;
            
            irrfValue = rawTax - deduction;
            effectiveRate = bracket.rate;
            
            if (irrfValue < 0) irrfValue = 0; // Imposto não pode ser negativo

            if (irrfValue > 0) {
                breakdown = `Base: ${formatCurrency(baseCalculation)} | Alíquota: ${(bracket.rate * 100).toFixed(1)}% | Dedução: ${formatCurrency(deduction)}`;
                if (dependentsCount > 0) {
                    breakdown += ` | Deps: -${formatCurrency(dependentsDeduction)}`;
                }
            } else {
                breakdown = 'Isento';
            }
            
            break;
        }
    }

    return { value: irrfValue, rate: effectiveRate, breakdown };
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

    // 6. IRRF (Deduction) - NOVO
    const dependentsCount = staff.dependents?.length || staff.personalInfo?.childrenCount || 0;
    const irrfResult = calculateIRRF(earnings, inssResult.total, dependentsCount);
    
    if (irrfResult.value > 0) {
        items.push({
            id: 'irrf',
            label: 'IRRF',
            type: 'deduction',
            amount: irrfResult.value,
            reference: `${(irrfResult.rate * 100).toFixed(1)}%`,
            description: irrfResult.breakdown
        });
    }

    // 7. Vale Transporte (Deduction)
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

    // 8. Descontos Fixos Personalizados (Ex: Convênio, Empréstimo)
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

    // 9. Totais Finais
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
