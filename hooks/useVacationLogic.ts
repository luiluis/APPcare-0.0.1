
import { Staff } from '../types';

export interface VacationStatusResult {
  isDue: boolean;           // Férias vencidas (ultrapassou o período concessivo)
  deadline: string;         // Data limite para conceder (sem multa)
  remainingDays: number;    // Dias de saldo no período mais antigo
  referencePeriodLabel: string; // Ex: "2022-2023"
  isAccruing: boolean;      // Se está apenas acumulando (ainda não fechou 1 ano)
}

export const useVacationLogic = () => {

  const calculateVacationStatus = (staff: Staff): VacationStatusResult | null => {
    if (!staff.contractInfo?.admissionDate || !staff.active) return null;

    const admission = new Date(staff.contractInfo.admissionDate);
    // Ajuste fuso horário para garantir meia-noite
    admission.setMinutes(admission.getMinutes() + admission.getTimezoneOffset());
    
    const today = new Date();
    const history = staff.vacationHistory || [];

    // O loop começa na data de admissão e verifica ano a ano
    let currentRefStart = new Date(admission);
    
    // Safety break para evitar loop infinito em dados corrompidos
    const safetyLimitYear = today.getFullYear() + 2; 

    while (currentRefStart.getFullYear() <= safetyLimitYear) {
      // 1. Definição do Período Aquisitivo (Vesting)
      // Vai da data atual até 1 ano depois
      const currentRefEnd = new Date(currentRefStart);
      currentRefEnd.setFullYear(currentRefEnd.getFullYear() + 1);
      // Subtrai 1 dia para pegar o intervalo exato (ex: 01/01/22 a 31/12/22)
      currentRefEnd.setDate(currentRefEnd.getDate() - 1);

      // Se o período aquisitivo ainda não terminou (data final > hoje),
      // o funcionário está "acumulando" e não tem férias "vencíveis" ainda.
      // Retornamos status "Em dia" mas indicando que está acumulando.
      if (currentRefEnd > today) {
        return {
          isDue: false,
          deadline: '',
          remainingDays: 0, 
          referencePeriodLabel: 'Em aquisição',
          isAccruing: true
        };
      }

      // 2. Cálculo do Saldo deste Período
      // Filtra registros que pertencem a este período aquisitivo
      const refStartString = currentRefStart.toISOString().split('T')[0];
      
      const usedDays = history
        .filter(h => h.status !== 'canceled' && h.referencePeriodStart === refStartString)
        .reduce((acc, curr) => {
          const start = new Date(curr.periodStart);
          const end = new Date(curr.periodEnd);
          // Diferença em dias + 1 (inclusivo)
          const daysTaken = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return acc + daysTaken + (curr.soldDays || 0);
        }, 0);

      // 3. Verificação de Pendência
      // Se usou menos de 30 dias, este é o período pendente mais antigo
      if (usedDays < 30) {
        // Prazo Concessivo: 1 ano após o fim do período aquisitivo
        const concessionDeadline = new Date(currentRefEnd);
        concessionDeadline.setFullYear(concessionDeadline.getFullYear() + 1);

        // Prazo "Seguro": Deve tirar as férias 30 dias ANTES do fim do prazo concessivo
        // para não pagar dobra sobre os dias gozados fora do prazo.
        // Mas para simplificação do "Deadline", usamos o fim do concessivo.
        
        return {
          isDue: today > concessionDeadline, // Vencida se hoje passou do prazo concessivo
          deadline: concessionDeadline.toISOString().split('T')[0],
          remainingDays: 30 - usedDays,
          referencePeriodLabel: `${currentRefStart.getFullYear()}-${currentRefEnd.getFullYear()}`,
          isAccruing: false
        };
      }

      // Se este período foi totalmente gozado (30 dias ou mais), avança para o próximo ano
      currentRefStart.setFullYear(currentRefStart.getFullYear() + 1);
    }

    return null;
  };

  return {
    calculateVacationStatus
  };
};
