
import { 
  MOCK_RESIDENTS, 
  MOCK_FINANCIAL_PROFILES,
  MOCK_PRESCRIPTIONS, 
  MOCK_STOCK, 
  MOCK_EVOLUTIONS, 
  MOCK_DOCUMENTS,
  MOCK_INVOICES,
  MOCK_STAFF,
  MOCK_STAFF_DOCUMENTS,
  MOCK_STAFF_INCIDENTS,
  BRANCHES
} from '../constants.ts';
import { 
  Resident, ResidentFinancialProfile, Prescription, StockItem, Evolution, 
  ResidentDocument, Invoice, Staff, Branch, DocumentCategory,
  MedicationLog, IncidentReport, StaffDocument, StaffIncident, HRAlert,
  StaffDocumentCategory, TaxTable, FinancialMovement
} from '../types.ts';
import { storageService } from './storageService.ts';
import { sanitizeInput } from '../lib/utils.ts';

// --- MOCK DB TABLES (State Local) ---
let db_residents = [...MOCK_RESIDENTS];
let db_financial_profiles = [...MOCK_FINANCIAL_PROFILES]; 
let db_prescriptions = [...MOCK_PRESCRIPTIONS];
let db_stock = [...MOCK_STOCK];
let db_evolutions = [...MOCK_EVOLUTIONS];
let db_documents = [...MOCK_DOCUMENTS];
let db_invoices = [...MOCK_INVOICES];
let db_medication_logs: MedicationLog[] = [];
let db_incidents: IncidentReport[] = [];
// RH Local State
let db_staff = [...MOCK_STAFF];
let db_staff_documents = [...MOCK_STAFF_DOCUMENTS];
let db_staff_incidents = [...MOCK_STAFF_INCIDENTS];
// Financeiro & Fiscal
let db_financial_movements: FinancialMovement[] = [];

// Tabelas Fiscais Centralizadas
const db_tax_tables: Record<number, { inss: TaxTable, irrf: TaxTable }> = {
    2024: {
        inss: {
            year: 2024,
            minWage: 141200, // R$ 1.412,00
            ceiling: 778602, // R$ 7.786,02
            brackets: [
                { limit: 141200, rate: 0.075 },
                { limit: 266668, rate: 0.09 },
                { limit: 400003, rate: 0.12 },
                { limit: 778602, rate: 0.14 },
            ]
        },
        irrf: {
            year: 2024,
            minWage: 141200,
            ceiling: 0,
            brackets: [
                { limit: 225920, rate: 0, deduction: 0 },
                { limit: 282665, rate: 0.075, deduction: 16944 },
                { limit: 375105, rate: 0.15, deduction: 38144 },
                { limit: 466468, rate: 0.225, deduction: 66277 },
                { limit: 999999999, rate: 0.275, deduction: 89600 }
            ]
        }
    }
};

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
  // --- QUERIES RESIDENTS/OPERATIONAL ---
  getResidents: async () => simulateNetwork(db_residents, 0.02),
  
  getResidentById: async (id: string) => {
    const res = db_residents.find(r => r.id === id);
    if (!res) throw new Error("Residente não encontrado.");
    return simulateNetwork(res, 0);
  },

  getFinancialProfileByResidentId: async (residentId: string) => {
    const profile = db_financial_profiles.find(fp => fp.residentId === residentId);
    const fallbackProfile: ResidentFinancialProfile = { id: `fp-new-${Date.now()}`, residentId };
    return simulateNetwork(profile || fallbackProfile, 0);
  },

  updateFinancialProfile: async (profile: ResidentFinancialProfile): Promise<ResidentFinancialProfile> => {
    const index = db_financial_profiles.findIndex(fp => fp.id === profile.id || fp.residentId === profile.residentId);
    
    if (index >= 0) {
        db_financial_profiles[index] = profile;
        return simulateNetwork(profile, 0);
    } else {
        const newProfile = { ...profile, id: profile.id || `fp-${Date.now()}` };
        db_financial_profiles.push(newProfile);
        return simulateNetwork(newProfile, 0);
    }
  },

  getPrescriptionsByResident: async (resId: string) => simulateNetwork(db_prescriptions.filter(p => p.residentId === resId), 0),
  getStockByResident: async (resId: string) => simulateNetwork(db_stock.filter(s => s.residentId === resId), 0),
  getEvolutionsByResident: async (resId: string) => simulateNetwork(db_evolutions.filter(e => e.residentId === resId), 0),
  getDocumentsByResident: async (resId: string) => simulateNetwork(db_documents.filter(d => d.residentId === resId), 0),
  getInvoices: async () => simulateNetwork(db_invoices, 0),
  getBranches: async () => simulateNetwork(BRANCHES, 0),
  getMedicationLogs: async () => simulateNetwork(db_medication_logs, 0),
  getIncidents: async () => simulateNetwork(db_incidents, 0),
  getIncidentsByResident: async (resId: string) => simulateNetwork(db_incidents.filter(i => i.residentId === resId), 0),

  // --- QUERIES STAFF (RH) & FISCAL ---
  getStaff: async () => simulateNetwork(db_staff, 0),
  
  getStaffById: async (id: string) => {
    const staff = db_staff.find(s => s.id === id);
    if (!staff) throw new Error("Funcionário não encontrado.");
    return simulateNetwork(staff, 0);
  },

  getStaffDocuments: async (staffId: string) => simulateNetwork(db_staff_documents.filter(d => d.staffId === staffId), 0),
  getStaffIncidents: async (staffId: string) => simulateNetwork(db_staff_incidents.filter(i => i.staffId === staffId), 0),

  getTaxTables: async (year: number) => {
      // Fallback para 2024 se o ano solicitado não existir
      const tables = db_tax_tables[year] || db_tax_tables[2024];
      return simulateNetwork(tables, 0);
  },

  getHRAlerts: async (): Promise<HRAlert[]> => {
    const alerts: HRAlert[] = [];
    const today = new Date();
    
    db_staff.forEach(staff => {
        if (!staff.active || !staff.contractInfo?.admissionDate) return;

        const admission = new Date(staff.contractInfo.admissionDate);
        const diffTime = Math.abs(today.getTime() - admission.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffYears = diffDays / 365;

        const daysTo45 = 45 - diffDays;
        const daysTo90 = 90 - diffDays;

        if (daysTo45 > 0 && daysTo45 <= 5) {
            alerts.push({
                id: `exp-45-${staff.id}`,
                staffId: staff.id,
                staffName: staff.name,
                type: 'contract',
                severity: 'medium',
                message: `Fim da 1ª experiência (45 dias) em ${daysTo45} dias.`,
                date: new Date(admission.getTime() + (45 * 24 * 60 * 60 * 1000)).toISOString()
            });
        } else if (daysTo90 > 0 && daysTo90 <= 5) {
            alerts.push({
                id: `exp-90-${staff.id}`,
                staffId: staff.id,
                staffName: staff.name,
                type: 'contract',
                severity: 'high',
                message: `Fim da experiência (90 dias) em ${daysTo90} dias. Definir efetivação.`,
                date: new Date(admission.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString()
            });
        }

        if (diffYears >= 1.0) {
             let vestingStart = new Date(admission);
             while (new Date(new Date(vestingStart).setFullYear(vestingStart.getFullYear() + 2)) <= today) {
                 vestingStart.setFullYear(vestingStart.getFullYear() + 1);
             }
             const vestingStartStr = vestingStart.toISOString().split('T')[0];

             const usedDays = (staff.vacationHistory || [])
                .filter(h => h.status !== 'canceled' && h.referencePeriodStart === vestingStartStr)
                .reduce((acc, curr) => {
                    const s = new Date(curr.periodStart);
                    const e = new Date(curr.periodEnd);
                    const d = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return acc + d + (curr.soldDays || 0);
                }, 0);

             if (usedDays < 30) {
                 const deadline = new Date(vestingStart);
                 deadline.setFullYear(deadline.getFullYear() + 2); 
                 
                 const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                 
                 if (daysUntilDeadline < 60) {
                     const isCritical = daysUntilDeadline < 30;
                     alerts.push({
                        id: `vac-${staff.id}`,
                        staffId: staff.id,
                        staffName: staff.name,
                        type: 'vacation',
                        severity: isCritical ? 'high' : 'medium', 
                        message: isCritical 
                            ? `Férias vencendo em ${daysUntilDeadline} dias! Risco de dobra.` 
                            : `Planejar férias (${30 - usedDays} dias restantes).`,
                        date: deadline.toISOString()
                     });
                 }
             }
        }
    });

    db_staff_documents.forEach(doc => {
        if (!doc.expirationDate) return;
        const staff = db_staff.find(s => s.id === doc.staffId);
        if (!staff || !staff.active) return;

        const expDate = new Date(doc.expirationDate);
        const isExpired = expDate < today;
        const isExpiringSoon = expDate > today && (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 30;

        if (isExpired || isExpiringSoon) {
            alerts.push({
                id: `doc-${doc.id}`,
                staffId: doc.staffId,
                staffName: staff.name,
                type: 'document',
                severity: isExpired ? 'high' : 'medium',
                message: `${doc.title} ${isExpired ? 'VENCIDO' : 'vence em breve'}.`,
                date: doc.expirationDate
            });
        }
    });

    return simulateNetwork(alerts, 0);
  },

  // --- MUTATIONS OPERATIONAL ---

  addIncident: async (incident: Omit<IncidentReport, 'id'>): Promise<IncidentReport> => {
    const newIncident: IncidentReport = {
      ...incident,
      description: sanitizeInput(incident.description), // XSS Protection
      id: `inc-${Date.now()}`
    };
    db_incidents.push(newIncident);
    return simulateNetwork(newIncident);
  },

  registerMedicationAdmin: async (logData: Omit<MedicationLog, 'id'>): Promise<MedicationLog> => {
    const newLog: MedicationLog = {
      ...logData,
      notes: sanitizeInput(logData.notes),
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
          
          // 5. REGISTRO FINANCEIRO (Novo requisito)
          const cost = item.unitPrice || 0; // Se não tiver preço, assume 0
          if (cost > 0) {
              const movement: FinancialMovement = {
                  id: `fin-mov-${Date.now()}`,
                  type: 'stock_usage',
                  relatedId: newLog.id,
                  amount: cost, // Custo em centavos
                  description: `Consumo: ${item.name}`,
                  date: new Date().toISOString(),
                  branchId: db_residents.find(r => r.id === item.residentId)?.branchId || 'unknown'
              };
              db_financial_movements.push(movement);
              console.log(`[Financeiro] Custo registrado: R$ ${(cost/100).toFixed(2)} para ${item.name}`);
          }
        }
      }
    }

    return simulateNetwork(newLog);
  },

  // Documentos Residente (Integração com Storage)
  addDocument: async (residentId: string, title: string, category: DocumentCategory, file: File): Promise<ResidentDocument> => {
    const fileUrl = await storageService.uploadFile(file, 'resident-documents');
    const newDoc: ResidentDocument = {
      id: `doc-${Date.now()}`,
      residentId,
      title: sanitizeInput(title),
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
    const data: Prescription = { 
        ...prescription, 
        medication: sanitizeInput(prescription.medication),
        instructions: sanitizeInput(prescription.instructions),
        id: newId 
    };
    db_prescriptions.push(data);
    return simulateNetwork(data);
  },

  updatePrescription: async (id: string, updates: Partial<Prescription>): Promise<Prescription> => {
    const index = db_prescriptions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Não encontrada.");
    
    if (updates.medication) updates.medication = sanitizeInput(updates.medication);
    if (updates.instructions) updates.instructions = sanitizeInput(updates.instructions);

    const updated = { ...db_prescriptions[index], ...updates };
    db_prescriptions[index] = updated;
    return simulateNetwork(updated);
  },

  deletePrescription: async (id: string): Promise<boolean> => {
    db_prescriptions = db_prescriptions.filter(p => p.id !== id);
    return simulateNetwork(true);
  },

  // --- MUTATIONS STAFF (RH) ---

  addStaff: async (staffData: Partial<Staff>): Promise<Staff> => {
    const personalInfo = {
        cpf: sanitizeInput(staffData.personalInfo?.cpf || ''),
        rg: sanitizeInput(staffData.personalInfo?.rg || ''),
        birthDate: staffData.personalInfo?.birthDate || '',
        phone: sanitizeInput(staffData.personalInfo?.phone || ''),
        email: sanitizeInput(staffData.personalInfo?.email || ''),
        address: sanitizeInput(staffData.personalInfo?.address || ''),
        maritalStatus: staffData.personalInfo?.maritalStatus || 'solteiro',
        childrenCount: staffData.personalInfo?.childrenCount || 0
    };

    const contractInfo = {
        admissionDate: staffData.contractInfo?.admissionDate || new Date().toISOString().split('T')[0],
        jobTitle: sanitizeInput(staffData.contractInfo?.jobTitle || staffData.role || ''),
        department: staffData.contractInfo?.department || 'enfermagem',
        scale: staffData.contractInfo?.scale || '12x36',
        workShift: staffData.contractInfo?.workShift || 'diurno'
    };

    const financialInfo = {
        baseSalary: staffData.financialInfo?.baseSalary || 0,
        insalubridadeLevel: (staffData.financialInfo?.insalubridadeLevel || 0) as 0 | 20 | 40,
        bankInfo: { 
            banco: sanitizeInput(staffData.financialInfo?.bankInfo?.banco), 
            agencia: sanitizeInput(staffData.financialInfo?.bankInfo?.agencia), 
            conta: sanitizeInput(staffData.financialInfo?.bankInfo?.conta) 
        }
    };

    const newStaff: Staff = {
      id: `stf-${Date.now()}`,
      created_at: new Date().toISOString(),
      active: true,
      name: sanitizeInput(staffData.name || 'Novo Colaborador'),
      role: sanitizeInput(staffData.role || 'Cargo não definido'),
      branchId: staffData.branchId || BRANCHES[0].id,
      personalInfo: personalInfo,
      contractInfo: contractInfo,
      financialInfo: financialInfo,
      systemAccess: staffData.systemAccess,
      benefits: staffData.benefits,
      dependents: staffData.dependents,
      professionalInfo: staffData.professionalInfo
    };

    db_staff.push(newStaff);
    return simulateNetwork(newStaff);
  },

  addStaffIncident: async (incident: Omit<StaffIncident, 'id' | 'createdAt'>): Promise<StaffIncident> => {
    const newIncident: StaffIncident = {
      ...incident,
      description: sanitizeInput(incident.description),
      id: `sinc-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    db_staff_incidents.push(newIncident);
    return simulateNetwork(newIncident);
  },

  addStaffDocument: async (staffId: string, title: string, category: StaffDocumentCategory, file: File, expirationDate?: string, customPath?: string): Promise<StaffDocument> => {
    const fileUrl = await storageService.uploadFile(file, 'staff-documents', customPath);
    
    const newDoc: StaffDocument = {
      id: `sdoc-${Date.now()}`,
      staffId,
      title: sanitizeInput(title),
      category,
      url: fileUrl,
      type: file.type.startsWith('image/') ? 'image' : 'pdf',
      createdAt: new Date().toISOString().split('T')[0],
      expirationDate
    };
    db_staff_documents.push(newDoc);
    return simulateNetwork(newDoc);
  },

  deleteStaffDocument: async (id: string): Promise<boolean> => {
    db_staff_documents = db_staff_documents.filter(d => d.id !== id);
    return simulateNetwork(true);
  }
};
