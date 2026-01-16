import { createClient } from '@supabase/supabase-js';

// Estes valores viriam das suas variáveis de ambiente (.env)
// Por enquanto, deixamos placeholders para indicar onde configurar
const supabaseUrl = process.env.SUPABASE_URL || 'https://sua-url-do-projeto.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Exemplo de como seria a busca de dados reais vs Mock:
 * 
 * --- MODO ATUAL (Mock) ---
 * import { MOCK_RESIDENTS } from './constants';
 * const data = MOCK_RESIDENTS;
 * 
 * --- MODO SUPABASE (Real) ---
 * const { data, error } = await supabase
 *   .from('residents')
 *   .select('*')
 *   .eq('branch_id', branchId);
 * 
 * A migração é suave e pode ser feita arquivo por arquivo.
 */