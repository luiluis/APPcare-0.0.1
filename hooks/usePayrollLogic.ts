
import { Staff, StaffIncident } from '../types';

export const usePayrollLogic = () => {
  const MINIMUM_WAGE = 1412; // Salário mínimo base 2024

  const calculateEstimatedSalary = (
    staff: Staff, 
    incidents: StaffIncident[], 
    month: number, 
    year: number
  ) => {
    // 1. Salário Base
    const base = staff.financialInfo?.baseSalary || 0;

    // 2. Insalubridade (Baseada no Salário Mínimo)
    // Níveis comuns: 10% (mínimo), 20% (médio), 40% (máximo)
    const level = staff.financialInfo?.insalubridadeLevel || 0;
    const insalubrity = (MINIMUM_WAGE * level) / 100;

    // 3. Processar Ocorrências (Descontos e Adicionais)
    let totalDiscounts = 0;
    let totalAdditions = 0;

    const relevantIncidents = incidents.filter(inc => {
      if (!inc.date) return false;
      // inc.date formato YYYY-MM-DD
      const [incYear, incMonth] = inc.date.split('-').map(Number);
      return incYear === year && incMonth === month;
    });

    relevantIncidents.forEach(inc => {
      const impact = inc.financialImpact || 0;
      if (impact < 0) {
        totalDiscounts += Math.abs(impact); // Soma como valor positivo para exibição de 'Total Descontos'
      } else {
        totalAdditions += impact;
      }
    });

    // Cálculo Final
    const finalEstimate = base + insalubrity + totalAdditions - totalDiscounts;

    return {
      base,
      insalubrity,
      totalDiscounts,
      totalAdditions,
      finalEstimate,
      incidentCount: relevantIncidents.length
    };
  };

  return {
    calculateEstimatedSalary
  };
};
