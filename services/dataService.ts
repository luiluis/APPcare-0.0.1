
import { 
  MOCK_RESIDENTS, 
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
  Resident, Prescription, StockItem, Evolution, 
  ResidentDocument, Invoice, Staff, Branch, DocumentCategory,
  MedicationLog, IncidentReport, StaffDocument, StaffIncident, StaffDocumentCategory, HRAlert
} from '../types.ts';
import { storageService } from './storageService.ts';
import { sanitizeInput } from '../lib/utils.ts';

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
// RH Local State
let db_staff = [...MOCK_STAFF];
let db_staff_documents = [...MOCK_STAFF_DOCUMENTS];
let db_staff_incidents = [...MOCK_STAFF_INCIDENTS];

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
  getPrescriptionsByResident: async (resId: string) => simulateNetwork(db_prescriptions.filter(p => p.residentId === resId), 0),
  getStockByResident: async (resId: string) => simulateNetwork(db_stock.filter(s => s.residentId === resId), 0),
  getEvolutionsByResident: async (resId: string) => simulateNetwork(db_evolutions.filter(e => e.residentId === resId), 0),
  getDocumentsByResident: async (resId: string) => simulateNetwork(db_documents.filter(d => d.residentId === resId), 0),
  getInvoices: async () => simulateNetwork(db_invoices, 0),
  getBranches: async () => simulateNetwork(BRANCHES, 0),
  getMedicationLogs: async () => simulateNetwork(db_medication_logs, 0),
  getIncidents: async () => simulateNetwork(db_incidents, 0),
  getIncidentsByResident: async (resId: string) => simulateNetwork(db_incidents.filter(i => i.residentId === resId), 0),

  // --- QUERIES STAFF (RH) ---
  getStaff: async () => simulateNetwork(db_staff, 0),
  
  getStaffById: async (id: string) => {
    const staff = db_staff.find(s => s.id === id);
    if (!staff) throw new Error("Funcionário não encontrado.");
    return simulateNetwork(staff, 0);
  },

  getStaffDocuments: async (staffId: string) => simulateNetwork(db_staff_documents.filter(d => d.staffId === staffId), 0),
  
  getStaffIncidents: async (staffId: string) => simulateNetwork(db_staff_incidents.filter(i => i.staffId === staffId), 0),

  getHRAlerts: async (): Promise<HRAlert[]> => {
    const alerts: HRAlert[] = [];
    const today = new Date();
    
    // 1. Verificar Colaboradores
    db_staff.forEach(staff => {
        if (!staff.active || !staff.contractInfo?.admissionDate) return;

        const admission = new Date(staff.contractInfo.admissionDate);
        const diffTime = Math.abs(today.getTime() - admission.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffYears = diffDays / 365;

        // A. Contrato de Experiência (45 dias ou 90 dias)
        // Alerta se faltar 5 dias ou menos para completar 45 ou 90
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

        // B. Férias Vencidas (Lógica Inteligente)
        // Se tem mais de 1 ano de casa, verifica se tirou férias
        if (diffYears >= 1.0) {
             // Simulação simples do Período Aquisitivo mais antigo
             // Pega a data de admissão e soma anos até chegar perto de hoje
             let vestingStart = new Date(admission);
             // Avança vestingStart para o ano atual - 1 ou -2 dependendo
             while (new Date(new Date(vestingStart).setFullYear(vestingStart.getFullYear() + 2)) <= today) {
                 vestingStart.setFullYear(vestingStart.getFullYear() + 1);
             }
             const vestingStartStr = vestingStart.toISOString().split('T')[0];

             // Calcula dias usados neste período específico
             const usedDays = (staff.vacationHistory || [])
                .filter(h => h.status !== 'canceled' && h.referencePeriodStart === vestingStartStr)
                .reduce((acc, curr) => {
                    const s = new Date(curr.periodStart);
                    const e = new Date(curr.periodEnd);
                    const d = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return acc + d + (curr.soldDays || 0);
                }, 0);

             // Se usou menos de 30 dias, está pendente
             if (usedDays < 30) {
                 // Calcula prazo limite (vesting + 1 ano + 11 meses para não dobrar)
                 const deadline = new Date(vestingStart);
                 deadline.setFullYear(deadline.getFullYear() + 2); // Fim do concessivo
                 
                 const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                 
                 // Alerta apenas se estiver perto do vencimento (ex: < 60 dias) ou vencido
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

    // 2. Verificar Documentos Vencidos
    db_staff_documents.forEach(doc => {
        if (!doc.expirationDate) return;
        
        const staff = db_staff.find(s => s.id === doc.staffId);
        if (!staff || !staff.active) return;

        const expDate = new Date(doc.expirationDate);
        const isExpired = expDate < today;
        // Expira nos próximos 30 dias
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
          console.log(`[DataService] Baixa automática no estoque: ${item.name} para residente ${prescription.residentId}. Nova qtd: ${db_stock[stockItemIndex].quantity}`);
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
    
    // Sanitize if updating text fields
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
    // Definindo estrutura padrão segura com tipagem
    // Sanitização aplicada nos campos de texto livre
    
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

    // Montagem do objeto final com tipagem estrita
    const newStaff: Staff = {
      id: `stf-${Date.now()}`,
      created_at: new Date().toISOString(),
      active: true,
      name: sanitizeInput(staffData.name || 'Novo Colaborador'),
      role: sanitizeInput(staffData.role || 'Cargo não definido'),
      branchId: staffData.branchId || BRANCHES[0].id,
      
      // Objetos aninhados garantidos
      personalInfo: personalInfo,
      contractInfo: contractInfo,
      financialInfo: financialInfo,
      
      // Opcionais
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
    // Passa o customPath para o serviço de storage
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
