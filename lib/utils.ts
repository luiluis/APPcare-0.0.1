
/**
 * Utilitários de formatação e manipulação de datas/moeda.
 * Preparado para lidar com strings ISO UTC e localidade pt-BR.
 */

/**
 * Sanitiza strings para prevenir XSS básico.
 * Remove tags HTML e caracteres perigosos.
 */
export const sanitizeInput = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
};

/**
 * Converte uma string YYYY-MM-DD (input date) para um objeto Date UTC (Meio-dia).
 * Evita problemas de timezone onde o dia volta para o anterior (ex: 2023-10-25 -> 2023-10-24T21:00).
 */
export const parseDateToUTC = (dateString: string): Date => {
  if (!dateString) return new Date();
  // Assume input YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  // Cria data ao meio-dia UTC para segurança contra offsets
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

/**
 * Retorna uma string ISO local (YYYY-MM-DD) para inputs de data.
 */
export const getLocalISOString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY).
 * Força o uso de UTC para garantir que a data exibida seja a data salva.
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC' // CRÍTICO: Garante que visualizamos a data do banco sem conversão para local
    }).format(date);
  } catch (e) {
    return '-';
  }
};

/**
 * Formata data e hora para o padrão brasileiro (DD/MM/YYYY HH:mm).
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return '-';
  }
};

/**
 * Extrai e formata apenas a hora (HH:mm).
 */
export const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    // Se for apenas uma string de hora (ex: "08:00"), retorna ela mesma ou valida
    if (/^([01]\d|2[0-3]):?([0-5]\d)$/.test(dateString)) return dateString;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return '-';
  }
};

/**
 * Aliases legados para compatibilidade com componentes existentes
 */
export const formatDateBr = formatDate;

/**
 * CONVERSÃO MONETÁRIA (INT/CENTS)
 * ------------------------------------------------------------------
 * O sistema opera internamente com centavos (inteiros) para evitar
 * erros de ponto flutuante (ex: 0.1 + 0.2 !== 0.3).
 */

/**
 * Converte valor monetário (string ou number) para Centavos (Inteiro) de forma SEGURA.
 * Evita erros de ponto flutuante (ex: 100.29 * 100 = 10028.999...) manipulando strings.
 * 
 * Ex: "R$ 1.250,50" -> 125050
 * Ex: "1250.50" -> 125050
 * Ex: "100" -> 10000
 */
export const safeCurrencyToCents = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;

  // Garante string
  let str = value.toString();

  // 1. Remove tudo que não for dígito, ponto, vírgula ou sinal negativo
  str = str.replace(/[^\d.,-]/g, '');

  if (!str) return 0;

  // 2. Detecta separador decimal
  // Assume que o último ponto ou vírgula é o separador decimal
  const lastDotIndex = str.lastIndexOf('.');
  const lastCommaIndex = str.lastIndexOf(',');
  const separatorIndex = Math.max(lastDotIndex, lastCommaIndex);

  let integerPart = '';
  let decimalPart = '';

  if (separatorIndex === -1) {
    // Sem separador: assumimos que é o valor inteiro (ex: "100" = R$ 100,00)
    integerPart = str.replace(/\D/g, ''); // Remove sinal se estiver no meio
    decimalPart = '00';
  } else {
    // Com separador
    // Parte inteira: tudo antes do separador (removemos pontuações de milhar se houver)
    integerPart = str.substring(0, separatorIndex).replace(/\D/g, '');
    // Parte decimal: tudo depois
    decimalPart = str.substring(separatorIndex + 1).replace(/\D/g, '');
  }

  // Tratamento de sinal
  const isNegative = str.includes('-');

  // Padronização da parte decimal para 2 dígitos
  if (decimalPart.length === 0) decimalPart = '00';
  else if (decimalPart.length === 1) decimalPart = decimalPart + '0';
  else if (decimalPart.length > 2) decimalPart = decimalPart.substring(0, 2); // Trunca milésimos

  // Concatena string e converte para inteiro (base 10)
  // Ex: "1250" + "50" -> 125050
  const cents = parseInt(integerPart + decimalPart, 10);

  if (isNaN(cents)) return 0;

  return isNegative ? -cents : cents;
};

/**
 * Converte valor (string ou float) para Centavos (Inteiro).
 * Wrapper para safeCurrencyToCents para compatibilidade.
 */
export const toCents = (amount: number | string): number => {
  return safeCurrencyToCents(amount);
};

/**
 * Converte Centavos para Float (apenas para inputs de formulário).
 * Ex: 1050 -> 10.50
 */
export const fromCents = (cents: number): number => {
  return cents / 100;
};

/**
 * Formata valor em Centavos para BRL.
 * Agora divide por 100 antes de formatar, pois recebe Inteiro.
 * Ex: 1050 -> R$ 10,50
 */
export const formatCurrency = (valInCents: number | string | undefined | null): string => {
  if (valInCents === undefined || valInCents === null) return 'R$ 0,00';
  
  const num = Number(valInCents);
  if (isNaN(num)) return 'R$ 0,00';
  
  // Divide por 100 pois o input é esperado em centavos
  return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
  }).format(num / 100);
};

/**
 * Remove caracteres especiais (máscaras), mantendo apenas números.
 */
export const stripSpecialChars = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export const formatCPF = (value: string): string => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos de novo (para o segundo bloco de números)
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca um hífen entre o terceiro e o quarto dígitos
    .replace(/(-\d{2})\d+?$/, '$1'); // Captura apenas os dois últimos dígitos
};

/**
 * Aplica máscara de Telefone ((00) 00000-0000)
 */
export const formatPhone = (value: string): string => {
  let r = value.replace(/\D/g, "");
  r = r.replace(/^0/, "");
  if (r.length > 10) {
    r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (r.length > 5) {
    r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (r.length > 2) {
    r = r.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
  } else {
    r = r.replace(/^(\d*)/, "($1");
  }
  return r;
};

/**
 * Aplica máscara de CEP (00000-000)
 */
export const formatCEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

/**
 * Retorna o primeiro dia do mês atual em formato ISO.
 */
export const getFirstDayOfMonth = (): string => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

/**
 * Retorna o último dia do mês atual em formato ISO.
 */
export const getLastDayOfMonth = (): string => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
};

/**
 * Remove acentos e caracteres especiais de uma string, substituindo espaços por underline.
 * Ex: "São Paulo" -> "Sao_Paulo"
 */
export const sanitizeString = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "")   // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, "_");           // Substitui espaços por underline
};

/**
 * Gera um caminho estruturado para armazenamento de arquivos.
 * Ex: 'Matriz/Enfermagem/Ana_Souza/Contratos'
 */
export const generateStoragePath = (branch: string, role: string, name: string, category: string): string => {
  return `${sanitizeString(branch)}/${sanitizeString(role)}/${sanitizeString(name)}/${sanitizeString(category)}`;
};
