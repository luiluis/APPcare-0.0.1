
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Resident, Invoice, Evolution, Prescription, StockItem, 
  ResidentDocument, IncidentReport, AuditLog, Staff, StaffDocument, StaffIncident, HRAlert 
} from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { useAuth } from './AuthContext.tsx';

interface DataContextType {
  // Operational Data
  residents: Resident[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  stockItems: StockItem[];
  evolutions: Evolution[];
  documents: ResidentDocument[];
  incidents: IncidentReport[];
  auditLogs: AuditLog[];
  
  // HR Data
  staff: Staff[];
  staffDocuments: StaffDocument[];
  staffIncidents: StaffIncident[];
  hrAlerts: HRAlert[];

  // State Control
  isLoading: boolean;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;

  // Actions
  updateResident: (updated: Resident) => void;
  addEvolution: (resId: string, content: string, type: Evolution['type']) => void;
  logAction: (action: string, details: string, category: AuditLog['category'], resId?: string) => void;
  addIncident: (incidentData: any) => Promise<void>;
  addStaff: (staffData: Partial<Staff>) => Promise<void>;
  
  // Setters (used by pages for optimistic updates)
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<ResidentDocument[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Data State - Initialized Empty (No Mocks directly)
  const [residents, setResidents] = useState<Resident[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [documents, setDocuments] = useState<ResidentDocument[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // HR State
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffDocuments, setStaffDocuments] = useState<StaffDocument[]>([]);
  const [staffIncidents, setStaffIncidents] = useState<StaffIncident[]>([]);
  const [hrAlerts, setHrAlerts] = useState<HRAlert[]>([]);

  // Load Data on Mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        // Parallel fetching for performance
        const [
          resData, invData, prescData, stockData, 
          evolData, docData, incData, logData,
          staffData, alertsData
        ] = await Promise.all([
          dataService.getResidents(),
          dataService.getInvoices(),
          // Fetching all lists might be heavy in production (would require pagination), 
          // but for this architecture we load "all" to allow filtering in frontend.
          dataService.getPrescriptionsByResident('all'), // Assuming service supports 'all' or we filter locally
          dataService.getStockByResident('all'),
          dataService.getEvolutionsByResident('all'),
          dataService.getDocumentsByResident('all'),
          dataService.getIncidents(),
          Promise.resolve([]), // Audit logs mock if no service method
          dataService.getStaff(),
          dataService.getHRAlerts()
        ]);

        setResidents(resData);
        setInvoices(invData);
        // Note: Ideally dataService would have getAllPrescriptions, etc. 
        // Here we assume the mock service returns full lists or specific resident data.
        // For the prototype, we are trusting the service to return the arrays.
        setPrescriptions(Array.isArray(prescData) ? prescData : []); 
        setStockItems(Array.isArray(stockData) ? stockData : []);
        setEvolutions(Array.isArray(evolData) ? evolData : []);
        setDocuments(Array.isArray(docData) ? docData : []);
        setIncidents(incData);
        setStaff(staffData);
        setHrAlerts(alertsData);
        
        // Load Staff related data (Simulated flattening)
        // In a real app, we would fetch these on demand or have specific endpoints
        const allStaffDocs: StaffDocument[] = [];
        const allStaffIncs: StaffIncident[] = [];
        for (const s of staffData) {
           const sDocs = await dataService.getStaffDocuments(s.id);
           const sIncs = await dataService.getStaffIncidents(s.id);
           allStaffDocs.push(...sDocs);
           allStaffIncs.push(...sIncs);
        }
        setStaffDocuments(allStaffDocs);
        setStaffIncidents(allStaffIncs);

      } catch (error) {
        console.error("Failed to load application data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadAllData();
    }
  }, [user]);

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

  const addStaff = async (staffData: Partial<Staff>) => {
    const newStaff = await dataService.addStaff(staffData);
    setStaff(prev => [...prev, newStaff]);
    logAction("Novo Colaborador", `Cadastrado: ${newStaff.name}`, "operational");
  };

  const value = {
    residents, invoices, prescriptions, stockItems, evolutions, 
    documents, incidents, auditLogs, 
    staff, staffDocuments, staffIncidents, hrAlerts,
    isLoading,
    selectedBranchId, setSelectedBranchId, 
    updateResident, addEvolution, logAction, addIncident, addStaff,
    setInvoices, setPrescriptions, setStockItems, setDocuments
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
