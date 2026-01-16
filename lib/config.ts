
/**
 * SERVIÇO DE CONFIGURAÇÃO (ENV)
 * Centraliza o acesso às variáveis de ambiente de forma segura para o navegador.
 */

// Acesso seguro ao process.env para evitar ReferenceError no navegador
const safeProcessEnv = typeof process !== 'undefined' ? process.env : {};

const getEnv = (key: string, defaultValue: string = ''): string => {
  // Tenta pegar de import.meta.env (Vite) ou do shim process.env
  const env = (import.meta as any).env || {};
  const value = env[key] || (safeProcessEnv as any)[key];

  if (!value && typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
    console.warn(`[Config] Aviso: Variável de ambiente "${key}" não foi definida.`);
  }

  return value || defaultValue;
};

export const config = {
  supabase: {
    url: getEnv('VITE_SUPABASE_URL'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  },
  gemini: {
    // Obedece estritamente a diretriz de usar process.env.API_KEY diretamente se disponível
    apiKey: (safeProcessEnv as any).API_KEY || getEnv('VITE_GEMINI_API_KEY'),
  },
  isDev: !!(import.meta as any).env?.DEV,
  isProd: !!(import.meta as any).env?.PROD,
};
