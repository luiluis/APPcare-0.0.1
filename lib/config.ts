
/**
 * SERVIÇO DE CONFIGURAÇÃO (ENV)
 * Este arquivo centraliza o acesso às variáveis de ambiente.
 * Garante que chaves ausentes não quebrem a aplicação silenciosamente.
 */

const getEnv = (key: string, defaultValue: string = ''): string => {
  // Fix: Cast import.meta to any to avoid "Property 'env' does not exist on type 'ImportMeta'" errors in standard TypeScript
  const env = (import.meta as any).env;
  const value = env ? env[key] : undefined;

  // Fix: Use optional chaining on casted env object to safely check DEV mode
  if (!value && typeof window !== 'undefined' && env?.DEV) {
    console.warn(`[Config] Aviso: Variável de ambiente "${key}" não foi definida. Verifique seu arquivo .env.`);
  }

  return value || defaultValue;
};

export const config = {
  supabase: {
    url: getEnv('VITE_SUPABASE_URL'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  },
  gemini: {
    // Priorizamos process.env.API_KEY injetado pela plataforma, 
    // conforme as diretrizes obrigatórias do SDK @google/genai.
    apiKey: process.env.API_KEY || getEnv('VITE_GEMINI_API_KEY'),
  },
  // Fix: Cast import.meta to any to access Vite-specific DEV flag
  isDev: !!(import.meta as any).env?.DEV,
  // Fix: Cast import.meta to any to access Vite-specific PROD flag
  isProd: !!(import.meta as any).env?.PROD,
};
