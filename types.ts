
export enum BranchType {
  MATRIZ = 'Matriz',
  FILIAL = 'Filial'
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
}

export interface Contact {
  name: string;
  relation: string;
  phone: string;
  email?: string;
  cpf?: string;
  address?: string;
  isFinancialResponsible?: boolean;
  isEmergencyContact?: boolean; 
}

export interface FeeConfig {
  baseValue: number;          
  careLevelAdjustment: number; 
  fixedExtras: number;        
  discount: number;           
  notes: string;              
  paymentDay: number;         
}

// --- ENTIDADES RELACIONAIS ---

export type DocumentCategory = 'contract' | 'identity' | 'medical' | 'other';

export interface ResidentDocument {
  id: string;
  residentId: string; // FK
  title: string;
  category: DocumentCategory;
  url: string;
  type: 'pdf' | 'image';
  createdAt: string;
  description?: string;
}

export interface Resident {
  id: string;
  name: string;
  photo?: string;
  age: number;
  birthDate?: string;
  branchId: string;
  status: 'Ativo' | 'Hospitalizado' | 'Inativo';
  careLevel: 1 | 2 | 3;
  admissionDate: string;
  feeConfig?: FeeConfig; 
  medicalRecord?: MedicalRecord; 
  benefitValue?: number; 
  created_at?: string;
  prescriptions?: Prescription[];
  stock?: StockItem[];
}

export interface MedicalRecord {
  bloodType: string;
  allergies: string[];
  comorbidities: string[];
  contacts: Contact[];
  weight?: number; 
  height?: number; 
  bmi?: number; 
  lastVitals: {
    pressure: string; 
    pressureTrend?: 'up' | 'down' | 'stable';
    glucose: string;
    glucoseTrend?: 'up' | 'down' | 'stable'; 
    heartRate: number;
    heartRateTrend?: 'up' | 'down' | 'stable'; 
    date: string;
  };
}

export interface Prescription {
  id: string;
  residentId: string; // FK
  medication: string;
  dosage: string;
  times: string[];
  instructions?: string;
  active: boolean;
  isHighAlert?: boolean; 
}

export interface MedicationLog {
  id: string;
  prescriptionId: string;
  administeredAt: string; // ISO String
  administeredBy: string; // Nome ou ID do usuário
  status: 'administered' | 'refused';
  notes?: string;
  scheduledTime: string; // O horário que estava previsto (ex: '08:00')
}

export interface StockItem {
  id: string;
  residentId: string; // FK
  name: string;
  category: 'hygiene' | 'medication' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number;
  avgConsumption?: string;
  status?: 'ok' | 'low' | 'ordered';
  lastOrderDate?: string;
}

export interface Evolution {
  id: string;
  residentId: string; // FK
  date: string;
  author: string;
  role: string;
  content: string;
  type: 'nursing' | 'medical' | 'physio' | 'nutrition' | 'handover';
  attachments?: string[]; 
  isHandoverRelevant?: boolean; 
}

export type IncidentType = 'queda' | 'agressão' | 'lesão' | 'outro';
export type IncidentSeverity = 'baixa' | 'média' | 'alta';

export interface IncidentReport {
  id: string;
  residentId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  photos: string[]; // URLs
  familyNotified: boolean;
  date: string; // ISO String
  author: string;
}

export interface AuditLog {
  id: string;
  action: string;      
  details: string;     
  residentId?: string;
  userId: string;      
  userName: string;
  userRole: string;
  timestamp: string;   
  category: 'medical' | 'financial' | 'operational' | 'system';
}

export enum InvoiceCategory {
  MENSALIDADE = 'mensalidade',
  FARMACIA = 'farmacia',
  TERAPIA = 'terapia',
  INSUMOS = 'insumos',
  LUZ = 'luz',
  AGUA = 'agua',
  ALUGUEL = 'aluguel',
  MANUTENCAO = 'manutencao',
  SALARIO = 'salario',
  OUTROS = 'outros'
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  category: InvoiceCategory | string;
  date: string;
}

export interface Invoice {
  id: string;
  type: 'income' | 'expense';
  residentId?: string;
  branchId?: string;
  month: number;
  year: number;
  status: InvoiceStatus | string; 
  dueDate: string;
  totalAmount: number;
  items: InvoiceItem[];
  paymentDate?: string;
  paymentMethod?: string;
  paymentAccount?: string;
  attachmentUrl?: string;
  supplier?: string;
}

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  branchId: string;
  isRecurring: boolean;
  created_at?: string;
}

// --- RH / STAFF MODULE ---

export interface Dependent {
  id: string;
  name: string;
  birthDate: string;
  relation: 'filho' | 'conjuge' | 'outro';
}

export interface StaffBenefits {
  receivesTransportVoucher: boolean; // Vale Transporte
  transportVoucherDailyQty?: number;
  transportVoucherUnitValue?: number;
  receivesMealVoucher: boolean; // Vale Refeição
}

export interface StaffSystemAccess {
  allowed: boolean;
  accessLevel: 'admin' | 'financeiro' | 'enfermagem' | 'basico';
  loginEmail: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string; // Usado para permissões do sistema
  branchId: string;
  created_at?: string;
  photo?: string;
  active: boolean;

  // Dados Pessoais
  personalInfo?: {
    cpf: string;
    rg: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
    maritalStatus: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
    childrenCount: number; // Mantido para compatibilidade, mas o array dependents é mais preciso
  };

  // Dados Contratuais
  contractInfo?: {
    admissionDate: string;
    jobTitle: string; // Cargo oficial na carteira
    department: 'enfermagem' | 'limpeza' | 'cozinha' | 'administrativo' | 'manutencao';
    scale: '12x36' | '6x1' | '5x2' | 'outra';
    workShift: 'diurno' | 'noturno';
  };

  // Acesso ao Sistema (Novo)
  systemAccess?: StaffSystemAccess;

  // Financeiro
  financialInfo?: {
    baseSalary: number;
    insalubridadeLevel: 0 | 20 | 40;
    bankInfo: {
      banco?: string;
      agencia?: string;
      conta?: string;
      pixKeyType?: 'cpf' | 'email' | 'telefone' | 'aleatoria' | string;
      pixKey?: string;
    };
  };

  // Novo Módulo CLT
  benefits?: StaffBenefits;
  dependents?: Dependent[];

  // Profissional
  professionalInfo?: {
    corenNumber?: string;
    corenState?: string;
  };
}

export type StaffDocumentCategory = 'aso' | 'contract' | 'identity' | 'certification' | 'warning' | 'medical' | 'other';

export interface StaffDocument {
  id: string;
  staffId: string; // FK
  title: string;
  category: StaffDocumentCategory;
  url: string;
  type: 'pdf' | 'image';
  createdAt: string;
  expirationDate?: string; // Para ASO, Coren, Certificações
  description?: string;
}

export type StaffIncidentType = 'advertencia' | 'suspensao' | 'atestado' | 'falta' | 'atraso' | 'ferias';

export interface StaffIncident {
  id: string;
  staffId: string; // FK
  type: StaffIncidentType;
  date: string;
  description: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface HRAlert {
  id: string;
  staffId: string;
  staffName: string;
  type: 'contract' | 'vacation' | 'document';
  severity: 'high' | 'medium'; // high = vencido, medium = vencendo
  message: string;
  date?: string; // Data de vencimento relevante
}

// --- DTOs ---

export interface CreateInvoiceDTO {
  type: 'income' | 'expense';
  residentId: string;
  branchId: string;
  description: string;
  amount: string; 
  dueDate: string;
  status: string;
  category: string;
  isRecurring: boolean;
  recurrenceCount: number;
  attachment?: File | null; 
  supplier?: string; 
}

export interface QuickConsumeDTO {
  branchId: string;
  residentId: string;
  description: string;
  amount: string; 
  date: string;
  category: string;
  attachment?: File | null; 
}

export interface PaymentConfirmDTO {
  paymentDate: string;
  paymentMethod: string;
  paymentAccount: string;
}
