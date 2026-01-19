
// Fix Gemini API implementation according to guidelines
import { GoogleGenAI } from "@google/genai";
import { FinancialRecord } from "../types.ts";

// Always use the process.env.API_KEY directly as requested in the guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinancialHealth = async (
  records: FinancialRecord[], 
  branchName: string
): Promise<string> => {
  try {
    const summary = records.reduce((acc, curr) => {
      const key = curr.type === 'income' ? 'Receitas' : 'Despesas';
      acc[key] = (acc[key] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `
      Atue como um CFO especialista em casas de repouso.
      Analise os seguintes dados financeiros da unidade: ${branchName}.
      
      Dados Sumarizados: ${JSON.stringify(summary)}
      
      Por favor, forneça um resumo executivo curto (max 3 parágrafos) focando em:
      1. Saúde do Fluxo de Caixa.
      2. Uma oportunidade de otimização baseada no padrão de casas de repouso.
      3. Use tom profissional e direto.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com o serviço de inteligência artificial.";
  }
};

/**
 * Gera um resumo de plantão estruturado baseado em logs operacionais.
 * Identifica anomalias e ignora rotinas padrão.
 */
export const generateHandoverSummary = async (
  shiftLogs: string[]
): Promise<string> => {
  try {
    if (!shiftLogs || shiftLogs.length === 0) {
      return "Nenhum evento relevante registrado para este período.";
    }

    const context = shiftLogs.join('\n');

    const prompt = `
      Atue como Coordenador de Enfermagem sênior em uma casa de repouso. 
      Sua tarefa é analisar os logs operacionais das últimas 12 horas e gerar um resumo de passagem de plantão.

      LOGS DO PERÍODO:
      ${context}

      INSTRUÇÕES DE ANÁLISE:
      1. Identifique ANOMALIAS CRÍTICAS (Ex: 'Recusa de medicação', 'PA alta/instável', 'Queda', 'Febre', 'Alteração súbita de comportamento').
      2. IGNORE rotinas comuns que ocorreram sem intercorrências (Ex: 'Banho realizado', 'Aceitou dieta' - cite apenas se houver problema).
      3. Seja clínico, conciso e profissional.

      ESTRUTURA DO RESUMO (Obrigatório seguir estes 3 pontos):
      - **Destaques Clínicos**: Foque em alterações de saúde e intercorrências médicas.
      - **Pendências**: Informe o que precisa ser verificado ou concluído pela próxima equipe.
      - **Observações Gerais**: Notas sobre comportamento, visitas ou suprimentos.

      Caso não haja nada grave, informe que o plantão seguiu sem intercorrências relevantes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Plantão encerrado sem intercorrências críticas registradas.";
  } catch (error) {
    console.error("Gemini Handover Error:", error);
    // Fallback genérico para garantir que o usuário não fique sem resposta
    return "RESUMO AUTOMÁTICO INDISPONÍVEL:\n\n- **Destaques Clínicos**: Verificar evoluções individuais no prontuário.\n- **Pendências**: Conferir quadro de avisos e prescrições do próximo horário.\n- **Observações Gerais**: Equipe de enfermagem deve revisar as últimas anotações manuais.";
  }
};
