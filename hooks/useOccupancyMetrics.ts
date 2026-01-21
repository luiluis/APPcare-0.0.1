
import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DREResult } from './useFinancialReports';

export interface OccupancyMetrics {
  totalCapacity: number;
  occupiedBeds: number;
  occupancyRate: number;
  activeResidentsCount: number;
  averageTicket: number;
  costPerBed: number;
  profitPerBed: number;
  breakEvenPoint: number;
}

export const useOccupancyMetrics = (dre: DREResult | null) => {
  const { residents } = useData();

  const metrics = useMemo<OccupancyMetrics>(() => {
    // Configuração Estática (Idealmente viria de uma tabela 'SystemSettings')
    const TOTAL_CAPACITY = 50;

    // 1. Ocupação
    const activeResidents = residents.filter(r => r.status === 'Ativo' || r.status === 'Hospitalizado');
    const occupiedBeds = activeResidents.length;
    const occupancyRate = occupiedBeds > 0 ? (occupiedBeds / TOTAL_CAPACITY) * 100 : 0;

    // Se não tiver DRE carregado, retorna parciais
    if (!dre) {
      return {
        totalCapacity: TOTAL_CAPACITY,
        occupiedBeds,
        occupancyRate,
        activeResidentsCount: occupiedBeds,
        averageTicket: 0,
        costPerBed: 0,
        profitPerBed: 0,
        breakEvenPoint: 0
      };
    }

    // 2. Ticket Médio (Receita Bruta / Ocupação)
    const averageTicket = occupiedBeds > 0 ? Math.round(dre.grossRevenue / occupiedBeds) : 0;

    // 3. Custo por Leito ( (Custos Variáveis + Despesas Operacionais) / Ocupação )
    // Representa quanto CUSTA manter cada idoso
    const totalCosts = dre.variableCosts + dre.operationalExpenses + dre.taxes;
    const costPerBed = occupiedBeds > 0 ? Math.round(totalCosts / occupiedBeds) : 0;

    // 4. Lucro por Leito
    const profitPerBed = averageTicket - costPerBed;

    // 5. Ponto de Equilíbrio (Break Even) em número de residentes
    // Quantos residentes preciso para pagar a conta?
    // BEP = Custos Fixos / (Ticket Médio - Custo Variável Unitário)
    // Simplificado: Total Despesas / Ticket Médio (aproximação)
    const breakEvenPoint = averageTicket > 0 ? Math.ceil(totalCosts / averageTicket) : 0;

    return {
      totalCapacity: TOTAL_CAPACITY,
      occupiedBeds,
      occupancyRate,
      activeResidentsCount: occupiedBeds,
      averageTicket,
      costPerBed,
      profitPerBed,
      breakEvenPoint
    };

  }, [residents, dre]);

  return metrics;
};
