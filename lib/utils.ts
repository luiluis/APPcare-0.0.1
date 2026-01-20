
/**
 * Utilitários de formatação e manipulação de datas/moeda.
 * Preparado para lidar com strings ISO UTC e localidade pt-BR.
 */

/**
 * Retorna uma string ISO local (YYYY-MM-DD) para inputs de data.
 */
export const getLocalISOString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY).
 * Aceita ISO strings (UTC ou local).
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
      timeZone: 'UTC' // Forçamos UTC se a string vier do banco sem hora (YYYY-MM-DD)
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
 * Formata valores monetários para BRL.
 */
export const formatCurrency = (val: number | string): string => {
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
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
