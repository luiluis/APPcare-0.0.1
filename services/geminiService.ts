
// Fix Gemini API implementation according to guidelines
import { GoogleGenAI } from "@google/genai";
import { FinancialRecord } from "../types";

// Initialize the client strictly as requested
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFinancialHealth = async (
  records: FinancialRecord[], 
  branchName: string
): Promise<string> => {
  try {
    // Basic verification of API Key presence
    if (!process.env.API_KEY) {
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

    // Use ai.models.generateContent directly with gemini-3-pro-preview for complex reasoning task
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
