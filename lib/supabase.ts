
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * CLIENTE SUPABASE
 * Inicializado com valores centralizados do lib/config.ts.
 */
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.anonKey;

// Se não houver URL, usamos um placeholder para não quebrar a inicialização do SDK em modo Protótipo
export const supabase = createClient(
  supabaseUrl || 'https://sua-url-do-projeto.supabase.co', 
  supabaseKey || 'sua-chave-anonima'
);

/**
 * GUIA DE MIGRAÇÃO:
 * 
 * Para substituir o Mock pelo Banco Real:
 * No services/dataService.ts, altere as funções de Mutation/Query:
 * 
 * Exemplo:
 * const { data, error } = await supabase.from('residents').select('*');
 */
