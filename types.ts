
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
  medicalRecord?: MedicalRecord; // Medical record costuma ser 1-para-1, mantemos aqui por simplicidade
  benefitValue?: number; 
  created_at?: string;
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
  type: 'nursing' | 'medical' | 'physio' | 'nutrition';
  attachments?: string[]; 
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

export interface Staff {
  id: string;
  name: string;
  role: string;
  branchId: string;
  created_at?: string;
}

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
