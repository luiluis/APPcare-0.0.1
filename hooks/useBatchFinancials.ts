
import { useState } from 'react';
import { Resident, ResidentFinancialProfile, BatchReadjustmentPreview, BatchReadjustmentResult, FeeConfig, ContractRecord } from '../types';
import { dataService } from '../services/dataService';

export const useBatchFinancials = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Simula o reajuste para conferência (Sem salvar no banco).
   * @param percentage Percentual de aumento (ex: 5.0 para 5%)
   * @param residents Lista de residentes selecionados
   */
  const previewMassReadjustment = async (
    percentage: number, 
    residents: Resident[]
  ): Promise<BatchReadjustmentPreview[]> => {
    
    // Busca perfis financeiros em paralelo (ou usaria um endpoint de batch backend)
    const previews: BatchReadjustmentPreview[] = [];

    for (const resident of residents) {
      try {
        const profile = await dataService.getFinancialProfileByResidentId(resident.id);
        const currentFee = profile.feeConfig;

        if (!currentFee) continue;

        // Calcula total atual
        const currentTotal = (currentFee.baseValue || 0) + (currentFee.careLevelAdjustment || 0) + (currentFee.fixedExtras || 0) - (currentFee.discount || 0);

        // Calcula novo total baseando-se no percentual sobre o valor BASE e GRAU (Extras costumam ser fixos, mas depende da regra)
        // Regra aplicada: Reajusta Base e Grau. Mantém Extras e Descontos fixos.
        const factor = 1 + (percentage / 100);
        const newBase = Math.round(currentFee.baseValue * factor);
        const newCare = Math.round(currentFee.careLevelAdjustment * factor);
        
        const newTotal = newBase + newCare + (currentFee.fixedExtras || 0) - (currentFee.discount || 0);

        previews.push({
          residentId: resident.id,
          residentName: resident.name,
          currentTotal,
          newTotal,
          diff: newTotal - currentTotal,
          percentage
        });
      } catch (e) {
        console.error(`Erro ao calcular preview para ${resident.name}`, e);
      }
    }

    return previews;
  };

  /**
   * Aplica o reajuste oficialmente.
   * Cria histórico de contrato, fecha o anterior e atualiza a configuração vigente.
   */
  const applyMassReadjustment = async (
    selectedResidentIds: string[], 
    percentage: number, 
    reason: string, 
    startDate: string
  ): Promise<BatchReadjustmentResult> => {
    setIsProcessing(true);
    const result: BatchReadjustmentResult = { successCount: 0, errorCount: 0, details: [] };

    try {
      const factor = 1 + (percentage / 100);
      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1); // Dia anterior ao início do novo

      for (const resId of selectedResidentIds) {
        try {
          // 1. Fetch Atual
          const profile = await dataService.getFinancialProfileByResidentId(resId);
          
          if (!profile.feeConfig) {
             result.errorCount++;
             result.details.push(`Residente ${resId}: Sem configuração financeira inicial.`);
             continue;
          }

          // 2. Calcula Novos Valores
          const currentFee = profile.feeConfig;
          const newBase = Math.round(currentFee.baseValue * factor);
          const newCare = Math.round(currentFee.careLevelAdjustment * factor);
          
          // 3. Novo FeeConfig
          const newFeeConfig: FeeConfig = {
             ...currentFee,
             baseValue: newBase,
             careLevelAdjustment: newCare,
             notes: `Reajuste em massa (${reason}) - ${percentage}%`
          };

          // 4. Atualiza Histórico de Contratos
          const newContract: ContractRecord = {
             id: `ctr-mass-${Date.now()}-${resId}`,
             startDate: startDate,
             baseValue: newBase,
             careLevelAdjustment: newCare,
             fixedExtras: currentFee.fixedExtras,
             discount: currentFee.discount,
             readjustmentIndex: reason,
             notes: `Aplicado via processamento em lote`
          };

          // Fecha contratos anteriores abertos
          const updatedHistory = (profile.contractHistory || []).map(c => {
             if (!c.endDate && c.startDate < startDate) {
                 return { ...c, endDate: prevEndDate.toISOString().split('T')[0] };
             }
             return c;
          });
          
          updatedHistory.push(newContract);

          // 5. Persiste
          await dataService.updateFinancialProfile({
             ...profile,
             feeConfig: newFeeConfig,
             contractHistory: updatedHistory,
             benefitValue: (newBase + newCare + currentFee.fixedExtras - currentFee.discount) // Atualiza valor total estimado
          });

          result.successCount++;

        } catch (innerError) {
          console.error(`Falha ao reajustar residente ${resId}`, innerError);
          result.errorCount++;
        }
      }
    } catch (error) {
      console.error("Erro fatal no processo em lote", error);
    } finally {
      setIsProcessing(false);
    }

    return result;
  };

  return {
    isProcessing,
    previewMassReadjustment,
    applyMassReadjustment
  };
};
