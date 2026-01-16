
import { Branch, BranchType, Resident, FinancialRecord, Staff, Invoice, InvoiceItem } from './types';

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'Casa Repouso Matriz (Centro)', type: BranchType.MATRIZ },
  { id: 'b2', name: 'Unidade Jardim (Filial)', type: BranchType.FILIAL },
];

// Mocking residents with Clinical Data & Documents
export const MOCK_RESIDENTS: Resident[] = [
  {
    id: 'res-1',
    name: 'Dona Maria Silva',
    photo: 'https://images.unsplash.com/photo-1551843021-d85697295d5c?auto=format&fit=crop&q=80&w=200&h=200', // Foto Real
    age: 82,
    birthDate: '1941-05-15',
    branchId: 'b1', // Matriz
    status: 'Ativo',
    careLevel: 3,
    admissionDate: '2022-10-15', 
    benefitValue: 5500.00, // Legado
    feeConfig: {
      baseValue: 4000.00,
      careLevelAdjustment: 1500.00, // Grau 3
      fixedExtras: 0,
      discount: 0,
      notes: 'Valor ajustado conforme IPCA anual em Outubro.',
      paymentDay: 5
    },
    documents: [
        { 
            id: 'doc-1', title: 'Contrato de Prestação de Serviços', category: 'contract', 
            url: 'https://placehold.co/400x500?text=CONTRATO+ASSINADO', type: 'image', createdAt: '2022-10-15' 
        },
        { 
            id: 'doc-2', title: 'RG e CPF', category: 'identity', 
            url: 'https://placehold.co/400x300?text=RG+FRENTE+VERSO', type: 'image', createdAt: '2022-10-15' 
        },
        {
            id: 'doc-3', title: 'Receita Losartana', category: 'medical',
            url: 'https://placehold.co/400x600?text=RECEITA+MEDICA', type: 'image', createdAt: '2023-09-10'
        }
    ],
    medicalRecord: {
      bloodType: 'O+',
      allergies: ['DIPIRONA', 'PENICILINA'],
      comorbidities: ['Hipertensão Arterial', 'Diabetes Tipo 2', 'Alzheimer Inicial'],
      contacts: [
        { name: 'Roberto Silva', relation: 'Filho', phone: '(11) 99999-9999', isFinancialResponsible: true, isEmergencyContact: true },
        { name: 'Dr. Claudio (Geriatra)', relation: 'Médico Particular', phone: '(11) 98888-8888', isEmergencyContact: true },
        { name: 'Lucia Silva', relation: 'Nora', phone: '(11) 97777-7777', isEmergencyContact: false }
      ],
      lastVitals: { 
        pressure: '140/90', pressureTrend: 'up',
        glucose: '110 mg/dL', glucoseTrend: 'stable',
        heartRate: 78, heartRateTrend: 'down',
        date: 'Hoje, 08:00' 
      }
    },
    prescriptions: [
      { id: 'p1', medication: 'Losartana', dosage: '50mg', times: ['08:00', '20:00'], active: true },
      { id: 'p2', medication: 'Metformina', dosage: '850mg', times: ['12:00'], instructions: 'Após o almoço', active: true },
      { id: 'p3', medication: 'Quetiapina', dosage: '25mg', times: ['21:00'], active: true }
    ],
    stock: [
      { id: 's1', name: 'Fralda Geriátrica G', category: 'hygiene', quantity: 18, unit: 'unidades', minThreshold: 20, avgConsumption: '4/dia' },
      { id: 's2', name: 'Lenço Umedecido', category: 'hygiene', quantity: 2, unit: 'pacotes', minThreshold: 1, avgConsumption: '1 pcte/sem' },
      { id: 's3', name: 'Losartana 50mg', category: 'medication', quantity: 14, unit: 'comprimidos', minThreshold: 10, avgConsumption: '2/dia' }
    ],
    evolutions: [
      { id: 'e1', date: '2023-10-24 08:30', author: 'Enf. Ana', role: 'Enfermeira', type: 'nursing', content: 'Paciente aceitou bem o café da manhã. Apresentou leve confusão mental ao acordar, mas se acalmou após higiene.' },
      { id: 'e2', date: '2023-10-23 20:00', author: 'Carlos Lima', role: 'Cuidador', type: 'nursing', content: 'Banho de aspersão realizado sem intercorrências. Administrado medicação noturna.' },
      { id: 'e3', date: '2023-10-23 10:00', author: 'Dr. Pedro', role: 'Médico', type: 'medical', content: 'Ajuste na dose de Losartana devido a picos pressóricos noturnos.' }
    ]
  },
  {
    id: 'res-2',
    name: 'Sr. João Santos',
    photo: 'https://images.unsplash.com/photo-1545167622-3a6ac156bb37?auto=format&fit=crop&q=80&w=200&h=200',
    age: 75,
    birthDate: '1948-03-20',
    branchId: 'b2', // Filial
    status: 'Ativo',
    careLevel: 1,
    admissionDate: '2023-01-10',
    benefitValue: 3500.00,
    feeConfig: {
      baseValue: 3500.00,
      careLevelAdjustment: 0, 
      fixedExtras: 100.00, // TV Cabo
      discount: 0,
      notes: 'Pagamento via boleto.',
      paymentDay: 10
    },
    documents: [],
    medicalRecord: {
        bloodType: 'A+',
        allergies: [],
        comorbidities: ['Dislipidemia'],
        contacts: [
           { name: 'Patricia Santos', relation: 'Filha', phone: '(11) 91234-5678', isFinancialResponsible: true, isEmergencyContact: true }
        ],
        lastVitals: { 
          pressure: '120/80', pressureTrend: 'stable',
          glucose: '90', glucoseTrend: 'stable',
          heartRate: 70, heartRateTrend: 'stable',
          date: 'Ontem' 
        }
    }
  },
  {
    id: 'res-3',
    name: 'Dona Ana Clara',
    age: 90,
    birthDate: '1933-11-05',
    branchId: 'b1',
    status: 'Hospitalizado',
    careLevel: 3,
    admissionDate: '2023-05-20',
    benefitValue: 6000.00,
    feeConfig: {
      baseValue: 4000.00,
      careLevelAdjustment: 2000.00, 
      fixedExtras: 0,
      discount: 0,
      notes: 'Adicional de Enfermagem 24h incluso.',
      paymentDay: 5
    },
    documents: [],
    medicalRecord: {
        bloodType: 'B-',
        allergies: ['SULFA'],
        comorbidities: ['AVC Prévio'],
        contacts: [
           { name: 'Marcos', relation: 'Sobrinho', phone: '(11) 94444-4444', isEmergencyContact: true }
        ],
        lastVitals: { 
          pressure: '140/90', pressureTrend: 'up',
          glucose: '95', glucoseTrend: 'stable',
          heartRate: 80, heartRateTrend: 'up',
          date: 'Ontem' 
        }
    }
  }
];

// Mocking reduced staff for balance
export const MOCK_STAFF: Staff[] = [
  { id: 'stf-1', name: 'Enf. Ana Souza', role: 'Enfermeiro Chefe', branchId: 'b1' },
  { id: 'stf-2', name: 'Carlos Lima', role: 'Cuidador', branchId: 'b1' },
  { id: 'stf-3', name: 'Dr. Pedro', role: 'Médico', branchId: 'b2' },
  { id: 'stf-4', name: 'Julia Costa', role: 'Cuidador', branchId: 'b2' },
];

// Mock Financial Data for current month
export const MOCK_FINANCIALS: FinancialRecord[] = [
  // Income (Mensalidades) - Automatically generated based on residents
  ...MOCK_RESIDENTS.map((r, i) => ({
    id: `inc-${i}`,
    description: `Mensalidade - ${r.name}`,
    amount: r.feeConfig ? (r.feeConfig.baseValue + r.feeConfig.careLevelAdjustment + r.feeConfig.fixedExtras - r.feeConfig.discount) : (r.benefitValue || 0),
    type: 'income' as const,
    category: 'Mensalidade',
    date: '2023-10-05',
    branchId: r.branchId,
    isRecurring: true,
  })),
  // Expenses (Fixed)
  { id: 'exp-1', description: 'Aluguel Imóvel Matriz', amount: 12000, type: 'expense', category: 'Infraestrutura', date: '2023-10-01', branchId: 'b1', isRecurring: true },
  { id: 'exp-2', description: 'Aluguel Imóvel Filial', amount: 8000, type: 'expense', category: 'Infraestrutura', date: '2023-10-01', branchId: 'b2', isRecurring: true },
  { id: 'exp-3', description: 'Folha de Pagamento Matriz', amount: 4500, type: 'expense', category: 'RH', date: '2023-10-05', branchId: 'b1', isRecurring: true },
  { id: 'exp-4', description: 'Folha de Pagamento Filial', amount: 3000, type: 'expense', category: 'RH', date: '2023-10-05', branchId: 'b2', isRecurring: true },
  { id: 'exp-5', description: 'Fornecedor Alimentação', amount: 1500, type: 'expense', category: 'Suprimentos', date: '2023-10-10', branchId: 'b1', isRecurring: true },
  { id: 'exp-6', description: 'Manutenção Emergencial', amount: 400, type: 'expense', category: 'Manutenção', date: '2023-10-12', branchId: 'b1', isRecurring: false },
];

// --- MOCK INVOICES (CONTAS A RECEBER E PAGAR) ---
export const MOCK_INVOICES: Invoice[] = MOCK_RESIDENTS.map((r, i) => {
  const baseAmount = r.feeConfig ? (r.feeConfig.baseValue + r.feeConfig.careLevelAdjustment + r.feeConfig.fixedExtras - r.feeConfig.discount) : (r.benefitValue || 0);
  
  const hasExtras = i === 0; 
  const extrasAmount = hasExtras ? 250 : 0;
  
  const items: InvoiceItem[] = [
    { 
      id: `item-base-${i}`, 
      invoiceId: `inv-${i}`, 
      description: 'Mensalidade Base', 
      amount: baseAmount, 
      category: 'mensalidade', 
      date: '2023-10-01' 
    }
  ];

  if (hasExtras) {
    items.push({
      id: `item-extra-${i}`,
      invoiceId: `inv-${i}`,
      description: 'Medicamentos Farmácia',
      amount: extrasAmount,
      category: 'farmacia',
      date: '2023-10-15'
    });
  }

  const status = i === 0 ? 'pending' : 'paid';

  return {
    id: `inv-${i}`,
    type: 'income', 
    residentId: r.id,
    month: 10,
    year: 2023,
    status: status as 'overdue' | 'pending' | 'paid',
    dueDate: '2023-10-05',
    totalAmount: baseAmount + extrasAmount,
    items
  };
});
