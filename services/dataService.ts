
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
import { Resident, Prescription, StockItem, Evolution, ResidentDocument, Invoice, Staff, Branch } from '../types';

/**
 * Nota: Todas as funções retornam Promises para simular comportamento assíncrono (Network latency).
 * Quando você tiver o Supabase, basta substituir o corpo dessas funções.
 */

export const dataService = {
  // Residents
  getResidents: async (): Promise<Resident[]> => {
    return new Promise(res => setTimeout(() => res(MOCK_RESIDENTS), 400));
  },
  
  // Relational Data by Resident ID
  getPrescriptionsByResident: async (residentId: string): Promise<Prescription[]> => {
    return new Promise(res => res(MOCK_PRESCRIPTIONS.filter(p => p.residentId === residentId)));
  },
  
  getStockByResident: async (residentId: string): Promise<StockItem[]> => {
    return new Promise(res => res(MOCK_STOCK.filter(s => s.residentId === residentId)));
  },
  
  getEvolutionsByResident: async (residentId: string): Promise<Evolution[]> => {
    return new Promise(res => res(MOCK_EVOLUTIONS.filter(e => e.residentId === residentId)));
  },
  
  getDocumentsByResident: async (residentId: string): Promise<ResidentDocument[]> => {
    return new Promise(res => res(MOCK_DOCUMENTS.filter(d => d.residentId === residentId)));
  },

  // Global Lists
  getInvoices: async (): Promise<Invoice[]> => {
    return new Promise(res => res(MOCK_INVOICES));
  },

  getStaff: async (): Promise<Staff[]> => {
      return new Promise(res => res(MOCK_STAFF));
  },

  getBranches: async (): Promise<Branch[]> => {
      return new Promise(res => res(BRANCHES));
  }
};
