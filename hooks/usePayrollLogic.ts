import { Staff, StaffIncident } from '../types';

export const usePayrollLogic = () => {
  const MINIMUM_WAGE = 1412; // Salário mínimo base 2024

  /**
   * Calcula o INSS Progressivo (Tabela 2024)
   * Base de cálculo: Salário Base + Adicionais Tributáveis (Insalubridade entra aqui)
   */
  const calculateINSS = (grossSalary: number): number => {
    // Teto do INSS 2024: 7.786,02 -> Teto de contribuição: ~908,85
    if (grossSalary > 7786.02) return 908.85;

    let tax = 0;
    
    // Faixa 1: Até 1.412,00 (7.5%)
    const f1 = 1412.00;
    // Faixa 2: 1.412,01 até 2.666,68 (9%)
    const f2 = 2666.68;
    // Faixa 3: 2.666,69 até 4.000,03 (12%)
    const f3 = 4000.03;
    // Faixa 4: 4.000,04 até 7.786,02 (14%)

    if (grossSalary <= f1) {
        return grossSalary * 0.075;
    } else {
        tax += f1 * 0.075; // 105.90
        
        if (grossSalary <= f2) {
            tax += (grossSalary - f1) * 0.09;
            return tax;
        } else {
            tax += (f2 - f1) * 0.09; // + 112.92
            
            if (grossSalary <= f3) {
                tax += (grossSalary - f2) * 0.12;
                return tax;
            } else {
                tax += (f3 - f2) * 0.12; // + 160.00
                tax += (grossSalary - f3) * 0.14;
                return tax;
            }
        }
    }
  };

  const calculateEstimatedSalary = (
    staff: Staff, 
    incidents: StaffIncident[], 
    month: number, 
    year: number
  ) => {
    // 1. Proventos Fixos
    const base = staff.financialInfo?.baseSalary || 0;
    const level = staff.financialInfo?.insalubridadeLevel || 0;
    const insalubrity = (MINIMUM_WAGE * level) / 100;

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
    // Base para INSS geralmente inclui Insalubridade e Adicionais tributáveis
    const grossForTax = base + insalubrity + totalAdditions; 
    const inssValue = calculateINSS(grossForTax);

    // Vale Transporte: 6% do Salário Base (limitado ao custo, mas simplificado aqui como 6% fixo se recebe)
    const vtDiscount = staff.benefits?.receivesTransportVoucher
        ? base * 0.06
        : 0;

    // 4. Consolidação
    // Total de descontos visíveis (Ocorrências + Impostos)
    const totalDeductions = totalIncidentDiscounts + inssValue + vtDiscount;

    // Líquido
    const finalEstimate = (base + insalubrity + totalAdditions) - totalDeductions;

    return {
      base,
      insalubrity,
      totalAdditions,
      totalDiscounts: totalIncidentDiscounts, // Mantém separado para a UI saber o que é "extra" vs "fixo"
      inssValue,
      vtDiscount,
      finalEstimate,
      incidentCount: relevantIncidents.length
    };
  };

  return {
    calculateEstimatedSalary
  };
};