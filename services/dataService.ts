
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
  ResidentDocument, Invoice, Staff, Branch 
} from '../types';

/**
 * ESTADO LOCAL (Simulando tabelas do Banco de Dados)
 * Ao usar 'let', permitimos que as funções de mutação alterem os dados em memória.
 */
let db_residents = [...MOCK_RESIDENTS];
let db_prescriptions = [...MOCK_PRESCRIPTIONS];
let db_stock = [...MOCK_STOCK];
let db_evolutions = [...MOCK_EVOLUTIONS];
let db_documents = [...MOCK_DOCUMENTS];
let db_invoices = [...MOCK_INVOICES];

// Função auxiliar para simular latência e falhas aleatórias
const simulateNetwork = async <T>(data: T, errorChance = 0.1): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorChance) {
        reject(new Error("Falha na comunicação com o servidor. Tente novamente."));
      } else {
        resolve(data);
      }
    }, 1000);
  });
};

export const dataService = {
  // --- QUERIES (LEITURA) ---
  
  getResidents: async (): Promise<Resident[]> => {
    return simulateNetwork(db_residents, 0.05); // Menor chance de erro na leitura
  },
  
  getPrescriptionsByResident: async (residentId: string): Promise<Prescription[]> => {
    return simulateNetwork(db_prescriptions.filter(p => p.residentId === residentId), 0);
  },
  
  getStockByResident: async (residentId: string): Promise<StockItem[]> => {
    return simulateNetwork(db_stock.filter(s => s.residentId === residentId), 0);
  },
  
  getEvolutionsByResident: async (residentId: string): Promise<Evolution[]> => {
    return simulateNetwork(db_evolutions.filter(e => e.residentId === residentId), 0);
  },
  
  getDocumentsByResident: async (residentId: string): Promise<ResidentDocument[]> => {
    return simulateNetwork(db_documents.filter(d => d.residentId === residentId), 0);
  },

  getInvoices: async (): Promise<Invoice[]> => {
    return simulateNetwork(db_invoices, 0);
  },

  getStaff: async (): Promise<Staff[]> => {
      return simulateNetwork(MOCK_STAFF, 0);
  },

  getBranches: async (): Promise<Branch[]> => {
      return simulateNetwork(BRANCHES, 0);
  },

  // --- MUTATIONS (ESCRITA) ---

  // Prescrições
  addPrescription: async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `presc-${Date.now()}`;
    const newPrescription: Prescription = {
      ...prescription,
      id: newId
    };
    
    return simulateNetwork(newPrescription).then(data => {
      db_prescriptions.push(data);
      return data;
    });
  },

  updatePrescription: async (id: string, updates: Partial<Prescription>): Promise<Prescription> => {
    const index = db_prescriptions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Prescrição não encontrada.");

    const updatedPrescription = { ...db_prescriptions[index], ...updates };
    
    return simulateNetwork(updatedPrescription).then(data => {
      db_prescriptions[index] = data;
      return data;
    });
  },

  deletePrescription: async (id: string): Promise<boolean> => {
    return simulateNetwork(true).then(() => {
      const initialLength = db_prescriptions.length;
      db_prescriptions = db_prescriptions.filter(p => p.id !== id);
      return db_prescriptions.length < initialLength;
    });
  },

  // Evoluções
  addEvolution: async (evolution: Omit<Evolution, 'id'>): Promise<Evolution> => {
    const newId = `ev-${Date.now()}`;
    const newEv: Evolution = { ...evolution, id: newId };
    return simulateNetwork(newEv).then(data => {
      db_evolutions.push(data);
      return data;
    });
  }
};
