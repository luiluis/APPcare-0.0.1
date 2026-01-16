
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Resident, Invoice, Evolution, Prescription, StockItem, 
  ResidentDocument, IncidentReport, AuditLog 
} from '../types.ts';
import { 
  MOCK_RESIDENTS, MOCK_INVOICES, MOCK_PRESCRIPTIONS, 
  MOCK_STOCK, MOCK_EVOLUTIONS, MOCK_DOCUMENTS 
} from '../constants.ts';
import { dataService } from '../services/dataService.ts';
import { useAuth } from './AuthContext.tsx';

interface DataContextType {
  residents: Resident[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  stockItems: StockItem[];
  evolutions: Evolution[];
  documents: ResidentDocument[];
  incidents: IncidentReport[];
  auditLogs: AuditLog[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  updateResident: (updated: Resident) => void;
  addEvolution: (resId: string, content: string, type: Evolution['type']) => void;
  logAction: (action: string, details: string, category: AuditLog['category'], resId?: string) => void;
  addIncident: (incidentData: any) => Promise<void>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<ResidentDocument[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const [residents, setResidents] = useState<Resident[]>(MOCK_RESIDENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [stockItems, setStockItems] = useState<StockItem[]>(MOCK_STOCK);
  const [evolutions, setEvolutions] = useState<Evolution[]>(MOCK_EVOLUTIONS);
  const [documents, setDocuments] = useState<ResidentDocument[]>(MOCK_DOCUMENTS);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const updateResident = (updated: Resident) => {
    setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const addEvolution = (resId: string, content: string, type: Evolution['type']) => {
    if (!user) return;
    const newEv: Evolution = {
        id: `ev-${Date.now()}`,
        residentId: resId,
        date: new Date().toLocaleString('pt-BR'),
        author: user.name,
        role: user.role,
        content,
        type
    };
    setEvolutions(prev => [newEv, ...prev]);
  };

  const logAction = (action: string, details: string, category: AuditLog['category'], resId?: string) => {
    if (!user) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action, details, category, residentId: resId,
      userId: user.id, userName: user.name, userRole: user.role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addIncident = async (incidentData: any) => {
    const newIncident = await dataService.addIncident(incidentData);
    setIncidents(prev => [...prev, newIncident]);
    logAction("Registro de Incidente", `Tipo: ${incidentData.type}, Gravidade: ${incidentData.severity}`, "medical", incidentData.residentId);
    addEvolution(incidentData.residentId, `INCIDENTE REGISTRADO: ${incidentData.type.toUpperCase()}. ${incidentData.description}`, 'nursing');
  };

  const value = {
    residents, invoices, prescriptions, stockItems, evolutions, 
    documents, incidents, auditLogs, selectedBranchId, 
    setSelectedBranchId, updateResident, addEvolution, 
    logAction, addIncident, setInvoices, setPrescriptions, 
    setStockItems, setDocuments
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
