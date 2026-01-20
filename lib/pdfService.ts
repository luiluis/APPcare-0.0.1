
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "../types";
import { formatCurrency, formatDateBr } from "./utils";

export const generateInvoiceReceipt = (invoice: Invoice, residentName: string) => {
  // Inicializa o documento (A4, retrato, milímetros)
  const doc = new jsPDF();

  // --- CABEÇALHO ---
  doc.setFillColor(243, 244, 246); // bg-gray-100
  doc.rect(0, 0, 210, 40, 'F'); // Faixa superior

  doc.setFontSize(22);
  doc.setTextColor(21, 128, 61); // Emerald-700
  doc.setFont("helvetica", "bold");
  doc.text("Lar AppCare", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFont("helvetica", "normal");
  doc.text("Comprovante de Pagamento", 105, 28, { align: "center" });

  // --- DETALHES DO RECIBO ---
  const startY = 55;
  const leftCol = 20;
  const rightCol = 110;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Recibo Referente: ${invoice.month.toString().padStart(2, '0')}/${invoice.year}`, leftCol, startY);

  doc.setFontSize(11);
  
  // Coluna Esquerda
  doc.setFont("helvetica", "normal");
  doc.text("Pagante / Residente:", leftCol, startY + 10);
  doc.setFont("helvetica", "bold");
  doc.text(residentName, leftCol, startY + 16);

  doc.setFont("helvetica", "normal");
  doc.text("Data do Pagamento:", leftCol, startY + 26);
  doc.setFont("helvetica", "bold");
  const payDate = invoice.paymentDate ? formatDateBr(invoice.paymentDate) : formatDateBr(new Date().toISOString());
  doc.text(payDate, leftCol, startY + 32);

  // Coluna Direita (Valores)
  doc.setFont("helvetica", "normal");
  doc.text("Valor Total Quitado:", rightCol, startY + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(21, 128, 61); // Emerald
  const finalAmount = invoice.paidAmount && invoice.paidAmount > 0 ? invoice.paidAmount : invoice.totalAmount;
  doc.text(formatCurrency(finalAmount), rightCol, startY + 18);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0); // Reset black

  // --- TABELA DE ITENS ---
  // Prepara os dados para o autotable
  const tableBody = invoice.items.map(item => [
    formatDateBr(item.date),
    item.description,
    item.category.toUpperCase(),
    { content: formatCurrency(item.amount), styles: { halign: 'right' } }
  ]);

  autoTable(doc, {
    startY: startY + 45,
    head: [['Data', 'Descrição', 'Categoria', 'Valor']],
    body: tableBody as any,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { cellWidth: 40, fontStyle: 'bold' }
    },
    // Rodapé da tabela com totais
    foot: [['', '', 'Total Original', { content: formatCurrency(invoice.totalAmount), styles: { halign: 'right' } }]],
    footStyles: { fillColor: [249, 250, 251], textColor: 0, fontStyle: 'bold' }
  });

  // --- RODAPÉ ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // Gray-400
  doc.setFont("helvetica", "italic");
  
  const now = new Date();
  doc.text(`Documento gerado eletronicamente em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 20, pageHeight - 15);
  doc.text("AppCare ERP - Gestão Inteligente para ILPIs", 190, pageHeight - 15, { align: "right" });

  // Salva o arquivo
  const safeName = residentName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Recibo_AppCare_${safeName}_${invoice.month}_${invoice.year}.pdf`);
};
