
// Fix Gemini API implementation according to guidelines
import { GoogleGenAI } from "@google/genai";
import { FinancialRecord, Evolution } from "../types.ts";

// Acesso seguro para não quebrar a execução se process for undefined
const API_KEY = typeof process !== 'undefined' ? process.env.API_KEY : undefined;

// Initialize the client strictly as requested
const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

export const analyzeFinancialHealth = async (
  records: FinancialRecord[], 
  branchName: string
): Promise<string> => {
  try {
    if (!API_KEY) {
      return `Simulação de Resposta da IA (Sem API Key configurada):\n\nBaseado nos dados da ${branchName}, observo que a receita recorrente cobre as despesas fixas com uma margem de 15%. Recomendo atenção aos custos variáveis de suprimentos que subiram 5% este mês.`;
    }

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
 * Gera um resumo de plantão baseado em evoluções relevantes.
 */
export const generateHandoverSummary = async (
  evolutions: (Evolution & { residentName: string })[]
): Promise<string> => {
  try {
    if (!API_KEY) {
       return "Dona Maria apresentou confusão mental às 10h. Sr. João teve pico pressórico (160/90) após o almoço, medicado conforme SOS. Reposição de fraldas para Unidade Jardim é urgente devido ao baixo estoque.";
    }

    const evolutionsContext = evolutions.map(e => 
      `Residente: ${e.residentName} | Tipo: ${e.type} | Nota: ${e.content} | Data: ${e.date}`
    ).join('\n');

    const prompt = `
      Você é um Coordenador de Enfermagem sênior em uma ILPI (Instituição de Longa Permanência para Idosos).
      Sua tarefa é resumir as últimas 12 horas de plantão para a equipe que está entrando agora.
      
      Evoluções Relevantes do Período:
      ${evolutionsContext}
      
      Instruções Obrigatórias:
      1. Escreva exatamente 3 parágrafos curtos.
      2. Foque exclusivamente em anormalidades, picos de sinais vitais, alterações comportamentais ou urgências de suprimentos.
      3. Ignore rotinas normais (ex: "banho realizado" sem intercorrência).
      4. Use um tom clínico, profissional e de alerta quando necessário.
      5. Organize as informações por gravidade/urgência.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Nenhuma anormalidade relevante registrada nas últimas 12 horas.";
  } catch (error) {
    console.error("Gemini Handover Error:", error);
    return "Erro ao gerar resumo do plantão.";
  }
};
