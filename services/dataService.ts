
import { 
  MOCK_RESIDENTS, 
  MOCK_PRESCRIPTIONS, 
  MOCK_STOCK, 
  MOCK_EVOLUTIONS, 
  MOCK_DOCUMENTS,
  MOCK_INVOICES,
  MOCK_STAFF,
  BRANCHES
} from '../constants';
import { 
  Resident, Prescription, StockItem, Evolution, 
  ResidentDocument, Invoice, Staff, Branch, DocumentCategory 
} from '../types';
import { storageService } from './storageService';

/**
 * ESTADO LOCAL (Simulando tabelas do Banco de Dados)
 */
let db_residents = [...MOCK_RESIDENTS];
let db_prescriptions = [...MOCK_PRESCRIPTIONS];
let db_stock = [...MOCK_STOCK];
let db_evolutions = [...MOCK_EVOLUTIONS];
let db_documents = [...MOCK_DOCUMENTS];
let db_invoices = [...MOCK_INVOICES];

const simulateNetwork = async <T>(data: T, errorChance = 0.1): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorChance) {
        reject(new Error("Erro de conexão com o servidor."));
      } else {
        resolve(data);
      }
    }, 1000);
  });
};

export const dataService = {
  // --- QUERIES ---
  getResidents: async () => simulateNetwork(db_residents, 0.02),
  getPrescriptionsByResident: async (resId: string) => simulateNetwork(db_prescriptions.filter(p => p.residentId === resId), 0),
  getStockByResident: async (resId: string) => simulateNetwork(db_stock.filter(s => s.residentId === resId), 0),
  getEvolutionsByResident: async (resId: string) => simulateNetwork(db_evolutions.filter(e => e.residentId === resId), 0),
  getDocumentsByResident: async (resId: string) => simulateNetwork(db_documents.filter(d => d.residentId === resId), 0),
  getInvoices: async () => simulateNetwork(db_invoices, 0),
  getStaff: async () => simulateNetwork(MOCK_STAFF, 0),
  getBranches: async () => simulateNetwork(BRANCHES, 0),

  // --- MUTATIONS ---

  // Documentos (Integração com Storage)
  addDocument: async (residentId: string, title: string, category: DocumentCategory, file: File): Promise<ResidentDocument> => {
    // 1. Primeiro faz o upload do arquivo para o storage
    const fileUrl = await storageService.uploadFile(file, 'resident-documents');

    // 2. Prepara o registro para o banco de dados
    const newDoc: ResidentDocument = {
      id: `doc-${Date.now()}`,
      residentId,
      title,
      category,
      url: fileUrl,
      type: file.type.startsWith('image/') ? 'image' : 'pdf',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // 3. Salva o registro no banco
    return simulateNetwork(newDoc).then(data => {
      db_documents.push(data);
      return data;
    });
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    return simulateNetwork(true).then(() => {
      db_documents = db_documents.filter(d => d.id !== id);
      return true;
    });
  },

  // Prescrições
  addPrescription: async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
    const newId = `presc-${Date.now()}`;
    const data: Prescription = { ...prescription, id: newId };
    return simulateNetwork(data).then(res => {
      db_prescriptions.push(res);
      return res;
    });
  },

  updatePrescription: async (id: string, updates: Partial<Prescription>): Promise<Prescription> => {
    const index = db_prescriptions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Não encontrada.");
    const updated = { ...db_prescriptions[index], ...updates };
    return simulateNetwork(updated).then(res => {
      db_prescriptions[index] = res;
      return res;
    });
  },

  deletePrescription: async (id: string): Promise<boolean> => {
    return simulateNetwork(true).then(() => {
      db_prescriptions = db_prescriptions.filter(p => p.id !== id);
      return true;
    });
  }
};
