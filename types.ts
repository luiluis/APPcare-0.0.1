
export enum BranchType {
  MATRIZ = 'Matriz',
  FILIAL = 'Filial'
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  bankConfig?: BankIntegrationConfig; // Nova configuração bancária por unidade
}

export interface BankIntegrationConfig {
  bankCode: string; // Ex: 341 (Itaú)
  agency: string;
  account: string;
  accountDigit: string;
  wallet: string; // Carteira de cobrança (Ex: 109)
  agreementNumber?: string; // Número do convênio
}

export interface BoletoRecord {
  id: string;
  invoiceId: string;
  nossoNumero: string; // Identificador único no banco
  barcode: string;
  digitableLine: string;
  status: 'generated' | 'remittance_sent' | 'registered' | 'paid' | 'rejected';
  generatedAt: string;
  dueDate: string;
  value: number; // Em centavos
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

// --- DOMÍNIO FINANCEIRO DO RESIDENTE (SEGREGADO) ---

export interface ContractRecord {
  id: string;
  startDate: string;      // Início da vigência deste valor
  endDate?: string;       // Fim da vigência (null = atual)
  baseValue: number;      // Em centavos
  careLevelAdjustment: number;
  fixedExtras: number;
  discount: number;
  readjustmentIndex?: string; // Ex: 'IPCA', 'IGPM', 'Manual', 'Aditivo'
  notes?: string;
}

export interface FeeConfig {
  baseValue: number;          // Em centavos (R$ 10,00 -> 1000)
  careLevelAdjustment: number; // Em centavos
  fixedExtras: number;        // Em centavos
  discount: number;           // Em centavos
  notes: string;              
  paymentDay: number;         
}

export interface ResidentFinancialProfile {
  id: string;
  residentId: string;
  feeConfig?: FeeConfig; 
  contractHistory?: ContractRecord[];
  benefitValue?: number; // Em centavos (LOAS/BPC)
}

// --- BATCH PROCESS DTOs (Novos) ---

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

// --- CONFIGURAÇÃO FISCAL (Payroll) ---

export interface TaxBracket {
  limit: number; // Teto da faixa em centavos
  rate: number;  // Alíquota (0.075, 0.09, etc)
  deduction?: number; // Parcela a deduzir em centavos (IRRF)
}

export interface TaxTable {
  year: number;
  minWage: number; // Salário mínimo em centavos
  ceiling: number; // Teto do INSS em centavos
  brackets: TaxBracket[]; // Faixas progressivas
}

export interface PayrollLineItem {
  id: string;
  label: string;
  type: 'earning' | 'deduction';
  amount: number; // Em centavos
  reference?: string; // Ex: "7.5%", "20%", "2 dias"
  description?: string; // Detalhe técnico ou memória de cálculo
}

export interface PayrollCalculationResult {
  items: PayrollLineItem[];
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  baseSalary: number; // Mantido para referência rápida
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
  batch?: string; // Número do lote para rastreabilidade
  expirationDate?: string; // Data de validade para controle sanitário
  unitPrice?: number; // Preço unitário em centavos para rastreio de custo
}

export interface FinancialMovement {
  id: string;
  type: 'stock_usage'; // Expansível futuramente
  relatedId: string; // ID do log de medicação ou outro evento
  amount: number; // Custo em centavos
  description: string;
  date: string;
  branchId: string; // Para centro de custo
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
  amount: number; // Em centavos (INTEGER)
  category: InvoiceCategory | string;
  date: string;
}

export interface InvoicePayment {
  id: string;
  amount: number; // Em centavos (INTEGER)
  date: string;
  method: string;
  notes?: string;
}

export interface RecurrenceConfig {
  active: boolean;
  frequency: 'monthly' | 'yearly';
  currentInstallment: number;
  totalInstallments?: number; // Se undefined, é recorrente infinito
  nextDueDate?: string;
}

export interface Invoice {
  id: string;
  type: 'income' | 'expense';
  residentId?: string;
  branchId?: string;
  staffId?: string; // Vínculo com funcionário para Folha de Pagamento
  month: number;
  year: number;
  status: InvoiceStatus | string; 
  dueDate: string;
  totalAmount: number; // Em centavos (INTEGER)
  items: InvoiceItem[];
  payments: InvoicePayment[];
  paidAmount?: number; // Em centavos (INTEGER)
  paymentDate?: string;
  paymentMethod?: string;
  paymentAccount?: string;
  attachmentUrl?: string;
  supplier?: string;
  recurrence?: RecurrenceConfig; // Nova definição de recorrência
  boleto?: BoletoRecord; // Dados do boleto gerado
}

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number; // Em centavos
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
  transportVoucherUnitValue?: number; // Em centavos se armazenado, mas no front pode vir como float
  receivesMealVoucher: boolean; // Vale Refeição
}

export interface StaffSystemAccess {
  allowed: boolean;
  accessLevel: 'admin' | 'financeiro' | 'enfermagem' | 'basico';
  loginEmail: string;
  lastLogin?: string | null; // Data ISO do último acesso ou null se nunca acessou
}

export interface VacationRecord {
  id: string;
  periodStart: string; // Início do gozo (ISO)
  periodEnd: string;   // Fim do gozo (ISO)
  referencePeriodStart: string; // Início do período aquisitivo (ISO)
  referencePeriodEnd: string;   // Fim do período aquisitivo (ISO)
  status: 'scheduled' | 'completed' | 'canceled';
  soldDays?: number; // Abono pecuniário (venda de dias)
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

  // Histórico de Férias
  vacationHistory?: VacationRecord[];

  // Acesso ao Sistema (Novo)
  systemAccess?: StaffSystemAccess;

  // Financeiro
  financialInfo?: {
    baseSalary: number; // Em centavos (R$ 2000,00 -> 200000)
    insalubridadeLevel: 0 | 20 | 40;
    // Lista de descontos/adicionais fixos (ex: Plano de Saúde, Empréstimo)
    customDeductions?: { id: string; description: string; amount: number }[]; 
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
  financialImpact?: number; // Em centavos
  impactDescription?: string;
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
