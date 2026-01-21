
import { Staff, StaffIncident, TaxTable } from '../types';

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
   * Calcula o INSS Progressivo Dinamicamente.
   * Itera sobre as faixas da tabela fornecida.
   */
  const calculateINSS = (grossSalaryCents: number, table: TaxTable = INSS_TABLE_2024): number => {
    // 1. Aplica o teto se necessário
    if (grossSalaryCents > table.ceiling) {
        // Recalcula o teto exato baseado nas faixas para garantir precisão, 
        // ou retorna um valor fixo se conhecido. Vamos calcular para ser à prova de futuro.
        return calculateINSS(table.ceiling, table);
    }

    let totalTax = 0;
    let previousLimit = 0;

    for (const bracket of table.brackets) {
        // Se o salário não atinge nem o início desta faixa (já foi coberto pelas anteriores), paramos.
        // Mas como iteramos em ordem, verificamos se o salário ultrapassa o limite anterior.
        if (grossSalaryCents <= previousLimit) break;

        // Base de cálculo nesta faixa é: O menor valor entre (Salário ou Limite da Faixa) MENOS o limite anterior
        // Ex: Salário 3000. Faixa 2 (limite 2666).
        // Faixa 1: min(3000, 1412) - 0 = 1412. Taxa = 1412 * 0.075
        // Faixa 2: min(3000, 2666) - 1412 = 1254. Taxa = 1254 * 0.09
        // Faixa 3: min(3000, 4000) - 2666 = 334. Taxa = 334 * 0.12
        
        const currentLimit = bracket.limit;
        const taxableAmountInBracket = Math.min(grossSalaryCents, currentLimit) - previousLimit;
        
        if (taxableAmountInBracket > 0) {
            totalTax += Math.round(taxableAmountInBracket * bracket.rate);
        }

        previousLimit = currentLimit;
    }

    return totalTax;
  };

  const calculateEstimatedSalary = (
    staff: Staff, 
    incidents: StaffIncident[], 
    month: number, 
    year: number,
    taxTable: TaxTable = INSS_TABLE_2024
  ) => {
    // 1. Proventos Fixos (Valores já vêm em Centavos do DB/Mock)
    const base = staff.financialInfo?.baseSalary || 0;
    const level = staff.financialInfo?.insalubridadeLevel || 0;
    
    // Insalubridade: Percentual sobre o Mínimo da tabela vigente
    const insalubrity = Math.round((taxTable.minWage * level) / 100);

    // 2. Processar Ocorrências (Variáveis)
    let totalIncidentDiscounts = 0;
    let totalAdditions = 0;

    const relevantIncidents = incidents.filter(inc => {
      if (!inc.date) return false;
      const [incYear, incMonth] = inc.date.split('-').map(Number);
      return incYear === year && incMonth === month;
    });

    relevantIncidents.forEach(inc => {
      const impact = inc.financialImpact || 0;
      if (impact < 0) {
        totalIncidentDiscounts += Math.abs(impact);
      } else {
        totalAdditions += impact;
      }
    });

    // 3. Cálculo de Impostos e Benefícios Legais
    const grossForTax = base + insalubrity + totalAdditions; 
    const inssValue = calculateINSS(grossForTax, taxTable);

    // Vale Transporte: 6% do Salário Base
    const vtDiscount = staff.benefits?.receivesTransportVoucher
        ? Math.round(base * 0.06)
        : 0;

    // 4. Consolidação
    const totalDeductions = totalIncidentDiscounts + inssValue + vtDiscount;

    // Líquido
    const finalEstimate = (base + insalubrity + totalAdditions) - totalDeductions;

    return {
      base,
      insalubrity,
      totalAdditions,
      totalDiscounts: totalIncidentDiscounts,
      inssValue,
      vtDiscount,
      finalEstimate,
      incidentCount: relevantIncidents.length
    };
  };

  return {
    calculateEstimatedSalary,
    INSS_TABLE_2024
  };
};
