
/**
 * SERVIÇO DE ARMAZENAMENTO (MOCK)
 * Este serviço abstrai o upload de arquivos. 
 * Futuramente, aqui será implementada a lógica do Supabase Storage.
 */

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  /**
   * Faz o upload de um arquivo e retorna sua URL pública.
   * @param file O arquivo vindo do input type="file"
   * @param bucket O nome da pasta/bucket no storage (ex: 'documents', 'profiles')
   */
  uploadFile: async (file: File, bucket: string): Promise<string> => {
    console.log(`[Storage] Iniciando upload de "${file.name}" para o bucket "${bucket}"...`);
    
    // Simula latência de rede (maior que o DB, pois arquivos são pesados)
    await simulateDelay(1500);

    // MOCK: Para o protótipo, usamos a URL local do navegador.
    // Em produção, isso seria a URL retornada pelo Supabase.
    const mockUrl = URL.createObjectURL(file);
    
    console.log(`[Storage] Upload concluído. URL gerada: ${mockUrl}`);
    return mockUrl;
  },

  /**
   * Remove um arquivo do storage.
   */
  deleteFile: async (path: string): Promise<void> => {
    await simulateDelay(500);
    console.log(`[Storage] Arquivo removido: ${path}`);
  }
};
