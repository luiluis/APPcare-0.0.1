
import { Invoice } from "../types";
import { formatCurrency } from "../lib/utils";

/**
 * Utilitários para formatação CNAB (Campos de tamanho fixo)
 */
const padLeft = (val: string | number, length: number, char: string = '0'): string => {
    return String(val).padStart(length, char).substring(0, length);
};

const padRight = (val: string, length: number, char: string = ' '): string => {
    // Remove acentos antes de preencher
    const normalized = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized.padEnd(length, char).substring(0, length);
};

export const bankService = {

    /**
     * Gera arquivo de REMESSA (CNAB 240 Simplificado)
     * Header + Lote de Detalhes (Faturas) + Trailer
     */
    generateRemittanceFile: (invoices: Invoice[]): string => {
        if (invoices.length === 0) return '';

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
        
        // 1. Header do Arquivo (240 posições)
        // Banco (3) + Lote (4) + Tipo (1) + CNPJ (14) + Nome Empresa (30) + ...
        let content = `0010000027798361000100APPCARE SOLUCOES LTDA       ${padRight('MATRIZ', 30)}  ${dateStr}${timeStr}${padLeft(1, 6)}08700\n`;

        // 2. Detalhes (1 linha por fatura - Segmento P simplificado)
        // Nosso Numero (20) + Vencimento (8) + Valor (15) + Sacado (30)
        invoices.forEach((inv, index) => {
            const nossoNumero = padLeft(inv.boleto?.nossoNumero || index + 1, 20);
            const vencimento = inv.dueDate.replace(/-/g, '');
            const valor = padLeft(inv.totalAmount, 15); // Centavos
            const nomeSacado = padRight(inv.supplier || 'RESIDENTE APPCARE', 30);
            
            // Simulação de linha de detalhe
            content += `00100013${padLeft(index + 1, 5)}P 01${nossoNumero}   ${vencimento}${valor}000000000000000A${dateStr}00000000000${nomeSacado}\n`;
        });

        // 3. Trailer do Arquivo
        // Total de Registros (6)
        content += `00199999${padLeft(invoices.length + 2, 6)}`;

        return content;
    },

    /**
     * Processa arquivo de RETORNO
     * Simula a leitura e extrai quais faturas foram pagas
     */
    parseReturnFile: (fileContent: string): { paidInvoiceIds: string[], totalPaid: number } => {
        const lines = fileContent.split('\n');
        const paidInvoiceIds: string[] = [];
        let totalPaid = 0;

        lines.forEach(line => {
            // Ignora Header/Trailer por tamanho ou identificador
            if (line.length < 50 || line.startsWith('0010000') || line.startsWith('0019999')) return;

            // Simulação de parsing da linha de detalhe (Segmento T/U)
            // Assumindo que nosso gerador coloca o 'Nosso Numero' numa posição fixa
            // No CNAB 240 real, seria muito mais complexo. Aqui, buscamos pelo padrão do gerador.
            
            // Exemplo de linha gerada: ...P 0100000000000000000005...
            // Vamos tentar extrair o ID sequencial ou Nosso Número
            const nossoNumeroMatch = line.substr(20, 20); // Posição hipotética
            const valorMatch = line.substr(58, 15);       // Posição hipotética

            if (nossoNumeroMatch && valorMatch) {
                // Em um cenário real, usaríamos o Nosso Número para buscar o Invoice ID no banco.
                // Como este é um mock, vamos extrair o Invoice ID "escondido" ou simular o retorno.
                
                // HACK PROTOTIPO: O mock assume que o Nosso Numero é o Invoice Index ou ID numérico.
                // Na vida real, o `BoletoRecord` faria esse de-para.
                const idFromNumber = parseInt(nossoNumeroMatch).toString();
                if (!isNaN(parseInt(idFromNumber))) {
                    // Simula ID do boleto pago
                    paidInvoiceIds.push(idFromNumber); 
                    totalPaid += parseInt(valorMatch);
                }
            }
        });

        return { paidInvoiceIds, totalPaid };
    }
};
