
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
    const TOTAL_CAPACITY = 50;

    // 1. Ocupação Física
    const activeResidents = residents.filter(r => r.status === 'Ativo' || r.status === 'Hospitalizado');
    const occupiedBeds = activeResidents.length;
    const occupancyRate = occupiedBeds > 0 ? (occupiedBeds / TOTAL_CAPACITY) * 100 : 0;

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

    // 2. Ticket Médio (Receita Bruta Realizada / Ocupação)
    const averageTicket = occupiedBeds > 0 ? Math.round(dre.grossRevenue / occupiedBeds) : 0;

    // 3. Custo por Leito (Total Despesas / Ocupação)
    // KPI Crítico: Quanto custa manter um idoso no mês atual?
    // Inclui Pessoal + Operacional + Adm + Impostos (Custo Total da Operação)
    const totalCost = dre.operationalExpenses + dre.taxes;
    const costPerBed = occupiedBeds > 0 ? Math.round(totalCost / occupiedBeds) : 0;

    // 4. Resultado por Leito (Margem unitária)
    const profitPerBed = averageTicket - costPerBed;

    // 5. Break Even (Ponto de Equilíbrio em Vidas)
    // Quantos idosos preciso ter (com esse ticket médio) para zerar o custo total?
    // Simplificação: Total Despesas / Ticket Médio
    const breakEvenPoint = averageTicket > 0 ? Math.ceil(totalCost / averageTicket) : 0;

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
