
export enum BranchType {
  MATRIZ = 'Matriz',
  FILIAL = 'Filial'
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  bankConfig?: BankIntegrationConfig;
}

export interface BankIntegrationConfig {
  bankCode: string;
  agency: string;
  account: string;
  accountDigit: string;
  wallet: string;
  agreementNumber?: string;
}

export interface BoletoRecord {
  id: string;
  invoiceId: string;
  nossoNumero: string;
  barcode: string;
  digitableLine: string;
  status: 'generated' | 'remittance_sent' | 'registered' | 'paid' | 'rejected';
  generatedAt: string;
  dueDate: string;
  value: number;
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

// --- DOMÍNIO FINANCEIRO DO RESIDENTE ---

export interface ContractRecord {
  id: string;
  startDate: string;
  endDate?: string;
  baseValue: number;
  careLevelAdjustment: number;
  fixedExtras: number;
  discount: number;
  readjustmentIndex?: string;
  notes?: string;
}

export interface FeeConfig {
  baseValue: number;
  careLevelAdjustment: number;
  fixedExtras: number;
  discount: number;
  notes: string;
  paymentDay: number;
}

export interface ResidentFinancialProfile {
  id: string;
  residentId: string;
  feeConfig?: FeeConfig; 
  contractHistory?: ContractRecord[];
  benefitValue?: number;
}

// --- PLANO DE CONTAS (NOVO) ---

export interface FinancialCategory {
  id: string;
  name: string;
  parentId?: string | null; // Hierarquia
  type: 'income' | 'expense';
  isSystemDefault?: boolean;
  level?: number; // Auxiliar para UI (indentação)
}

// --- DTOs BATCH ---

export interface BatchReadjustmentPreview {
  residentId: string;
  residentName: string;
  currentTotal: number;
  newTotal: number;
  diff: number;
  percentage: number;
}

export interface BatchReadjustmentResult {
  successCount: number;
  errorCount: number;
  details: string[];
}

// --- CONFIGURAÇÃO FISCAL ---

export interface TaxBracket {
  limit: number;
  rate: number;
  deduction?: number;
}

export interface TaxTable {
  year: number;
  minWage: number;
  ceiling: number;
  brackets: TaxBracket[];
}

export interface PayrollLineItem {
  id: string;
  label: string;
  type: 'earning' | 'deduction';
  amount: number;
  reference?: string;
  description?: string;
}

export interface PayrollCalculationResult {
  items: PayrollLineItem[];
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  baseSalary: number;
}

// --- ENTIDADES RELACIONAIS ---

export type DocumentCategory = 'contract' | 'identity' | 'medical' | 'other';

export interface ResidentDocument {
  id: string;
  residentId: string;
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
  created_at?: string;
  prescriptions?: Prescription[];
  stock?: StockItem[];
  medicalRecord?: MedicalRecord;
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
  residentId: string;
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
  administeredAt: string;
  administeredBy: string;
  status: 'administered' | 'refused';
  notes?: string;
  scheduledTime: string;
}

export interface StockItem {
  id: string;
  residentId: string;
  name: string;
  category: 'hygiene' | 'medication' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number;
  avgConsumption?: string;
  status?: 'ok' | 'low' | 'ordered';
  lastOrderDate?: string;
  batch?: string;
  expirationDate?: string;
  unitPrice?: number;
}

export interface FinancialMovement {
  id: string;
  type: 'stock_usage';
  relatedId: string;
  amount: number;
  description: string;
  date: string;
  branchId: string;
  categoryId?: string; // Vinculo com Plano de Contas
}

export interface Evolution {
  id: string;
  residentId: string;
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
  photos: string[];
  familyNotified: boolean;
  date: string;
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

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export enum InvoiceCategory {
  MENSALIDADE = 'mensalidade',
  FARMACIA = 'farmacia',
  ALIMENTACAO = 'alimentacao',
  MANUTENCAO = 'manutencao',
  SALARIO = 'salario',
  OUTROS = 'outros'
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  amount: number; // Em centavos
  category: string; // ID da Categoria do Plano de Contas
  date: string;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  notes?: string;
}

export interface RecurrenceConfig {
  active: boolean;
  frequency: 'monthly' | 'yearly';
  currentInstallment: number;
  totalInstallments?: number;
  nextDueDate?: string;
}

export interface Invoice {
  id: string;
  type: 'income' | 'expense';
  residentId?: string;
  branchId?: string;
  staffId?: string;
  month: number;
  year: number;
  status: InvoiceStatus | string; 
  dueDate: string;
  totalAmount: number;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  paidAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentAccount?: string;
  attachmentUrl?: string;
  supplier?: string;
  recurrence?: RecurrenceConfig;
  boleto?: BoletoRecord;
  category?: string; // ID da Categoria Principal (atalho)
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
  receivesTransportVoucher: boolean;
  transportVoucherDailyQty?: number;
  transportVoucherUnitValue?: number;
  receivesMealVoucher: boolean;
}

export interface StaffSystemAccess {
  allowed: boolean;
  accessLevel: 'admin' | 'financeiro' | 'enfermagem' | 'basico';
  loginEmail: string;
  lastLogin?: string | null;
}

export interface VacationRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  referencePeriodStart: string;
  referencePeriodEnd: string;
  status: 'scheduled' | 'completed' | 'canceled';
  soldDays?: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  branchId: string;
  created_at?: string;
  photo?: string;
  active: boolean;
  personalInfo?: {
    cpf: string;
    rg: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
    maritalStatus: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
    childrenCount: number;
  };
  contractInfo?: {
    admissionDate: string;
    jobTitle: string;
    department: 'enfermagem' | 'limpeza' | 'cozinha' | 'administrativo' | 'manutencao';
    scale: '12x36' | '6x1' | '5x2' | 'outra';
    workShift: 'diurno' | 'noturno';
  };
  vacationHistory?: VacationRecord[];
  systemAccess?: StaffSystemAccess;
  financialInfo?: {
    baseSalary: number;
    insalubridadeLevel: 0 | 20 | 40;
    customDeductions?: { id: string; description: string; amount: number }[]; 
    bankInfo: {
      banco?: string;
      agencia?: string;
      conta?: string;
      pixKeyType?: 'cpf' | 'email' | 'telefone' | 'aleatoria' | string;
      pixKey?: string;
    };
  };
  benefits?: StaffBenefits;
  dependents?: Dependent[];
  professionalInfo?: {
    corenNumber?: string;
    corenState?: string;
  };
}

export type StaffDocumentCategory = 'aso' | 'contract' | 'identity' | 'certification' | 'warning' | 'medical' | 'other';

export interface StaffDocument {
  id: string;
  staffId: string;
  title: string;
  category: StaffDocumentCategory;
  url: string;
  type: 'pdf' | 'image';
  createdAt: string;
  expirationDate?: string;
  description?: string;
}

export type StaffIncidentType = 'advertencia' | 'suspensao' | 'atestado' | 'falta' | 'atraso' | 'ferias';

export interface StaffIncident {
  id: string;
  staffId: string;
  type: StaffIncidentType;
  date: string;
  description: string;
  attachmentUrl?: string;
  createdAt: string;
  financialImpact?: number;
  impactDescription?: string;
}

export interface HRAlert {
  id: string;
  staffId: string;
  staffName: string;
  type: 'contract' | 'vacation' | 'document';
  severity: 'high' | 'medium';
  message: string;
  date?: string;
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