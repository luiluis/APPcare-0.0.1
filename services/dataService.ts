
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
  ResidentDocument, Invoice, Staff, Branch, DocumentCategory,
  MedicationLog, IncidentReport
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
let db_medication_logs: MedicationLog[] = [];
let db_incidents: IncidentReport[] = [];

const simulateNetwork = async <T>(data: T, errorChance = 0.05): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorChance) {
        reject(new Error("Erro de conexão com o servidor."));
      } else {
        resolve(data);
      }
    }, 800);
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
  getMedicationLogs: async () => simulateNetwork(db_medication_logs, 0),
  getIncidents: async () => simulateNetwork(db_incidents, 0),
  getIncidentsByResident: async (resId: string) => simulateNetwork(db_incidents.filter(i => i.residentId === resId), 0),

  // --- MUTATIONS ---

  /**
   * Adiciona um novo relatório de incidente.
   */
  addIncident: async (incident: Omit<IncidentReport, 'id'>): Promise<IncidentReport> => {
    const newIncident: IncidentReport = {
      ...incident,
      id: `inc-${Date.now()}`
    };
    db_incidents.push(newIncident);
    return simulateNetwork(newIncident);
  },

  /**
   * Registra a administração de um medicamento e faz baixa automática no estoque.
   */
  registerMedicationAdmin: async (logData: Omit<MedicationLog, 'id'>): Promise<MedicationLog> => {
    const newLog: MedicationLog = {
      ...logData,
      id: `mlog-${Date.now()}`
    };

    // 1. Persiste o log
    db_medication_logs.push(newLog);

    // 2. Busca a prescrição para saber qual é o remédio e o residente
    const prescription = db_prescriptions.find(p => p.id === logData.prescriptionId);
    
    if (prescription && logData.status === 'administered') {
      // 3. Busca item no estoque para o mesmo residente e com nome similar
      const medNameLower = prescription.medication.toLowerCase();
      const stockItemIndex = db_stock.findIndex(s => 
        s.residentId === prescription.residentId && 
        (s.name.toLowerCase().includes(medNameLower) || medNameLower.includes(s.name.toLowerCase()))
      );

      if (stockItemIndex !== -1) {
        const item = db_stock[stockItemIndex];
        if (item.quantity > 0) {
          // 4. Realiza a baixa automática de 1 unidade
          db_stock[stockItemIndex] = {
            ...item,
            quantity: item.quantity - 1,
            status: (item.quantity - 1) <= item.minThreshold ? 'low' : 'ok'
          };
          console.log(`[DataService] Baixa automática no estoque: ${item.name} para residente ${prescription.residentId}. Nova qtd: ${db_stock[stockItemIndex].quantity}`);
        } else {
          console.warn(`[DataService] Estoque de ${item.name} está zerado. Registro feito mas sem baixa.`);
        }
      }
    }

    return simulateNetwork(newLog);
  },

  // Documentos (Integração com Storage)
  addDocument: async (residentId: string, title: string, category: DocumentCategory, file: File): Promise<ResidentDocument> => {
    const fileUrl = await storageService.uploadFile(file, 'resident-documents');
    const newDoc: ResidentDocument = {
      id: `doc-${Date.now()}`,
      residentId,
      title,
      category,
      url: fileUrl,
      type: file.type.startsWith('image/') ? 'image' : 'pdf',
      createdAt: new Date().toISOString().split('T')[0]
    };
    db_documents.push(newDoc);
    return simulateNetwork(newDoc);
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    db_documents = db_documents.filter(d => d.id !== id);
    return simulateNetwork(true);
  },

  // Prescrições
  addPrescription: async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
    const newId = `presc-${Date.now()}`;
    const data: Prescription = { ...prescription, id: newId };
    db_prescriptions.push(data);
    return simulateNetwork(data);
  },

  updatePrescription: async (id: string, updates: Partial<Prescription>): Promise<Prescription> => {
    const index = db_prescriptions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Não encontrada.");
    const updated = { ...db_prescriptions[index], ...updates };
    db_prescriptions[index] = updated;
    return simulateNetwork(updated);
  },

  deletePrescription: async (id: string): Promise<boolean> => {
    db_prescriptions = db_prescriptions.filter(p => p.id !== id);
    return simulateNetwork(true);
  }
};
