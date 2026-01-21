
import { Branch, BranchType, Resident, ResidentFinancialProfile, Staff, Invoice, InvoiceItem, Prescription, StockItem, Evolution, ResidentDocument, StaffDocument, StaffIncident, FinancialCategory } from './types';

// --- PLANO DE CONTAS PADRÃO (ILPI) ---
export const DEFAULT_PLAN_OF_ACCOUNTS: FinancialCategory[] = [
    // RECEITAS (Nível 1)
    { id: 'cat_rec_root', name: 'Receitas Operacionais', type: 'income', isSystemDefault: true },
    // Nível 2
    { id: 'cat_rec_mensal', name: 'Mensalidades', parentId: 'cat_rec_root', type: 'income', isSystemDefault: true },
    { id: 'cat_rec_extra', name: 'Serviços Extras / Farmácia', parentId: 'cat_rec_root', type: 'income', isSystemDefault: true },
    { id: 'cat_rec_doacao', name: 'Doações', parentId: 'cat_rec_root', type: 'income', isSystemDefault: false },

    // DESPESAS (Nível 1)
    { id: 'cat_desp_root', name: 'Despesas Operacionais', type: 'expense', isSystemDefault: true },
    
    // Pessoal (Nível 2)
    { id: 'cat_pes_root', name: 'Pessoal & Encargos', parentId: 'cat_desp_root', type: 'expense', isSystemDefault: true },
    { id: 'cat_pes_sal', name: 'Salários Líquidos', parentId: 'cat_pes_root', type: 'expense' },
    { id: 'cat_pes_enc', name: 'Impostos (INSS/FGTS)', parentId: 'cat_pes_root', type: 'expense' },
    { id: 'cat_pes_ben', name: 'Benefícios (VT/VR)', parentId: 'cat_pes_root', type: 'expense' },

    // Operacional (Nível 2)
    { id: 'cat_ops_root', name: 'Custos Operacionais', parentId: 'cat_desp_root', type: 'expense', isSystemDefault: true },
    { id: 'cat_ops_alim', name: 'Alimentação', parentId: 'cat_ops_root', type: 'expense' },
    { id: 'cat_ops_farm', name: 'Farmácia & Insumos', parentId: 'cat_ops_root', type: 'expense' }, // Vinculado ao estoque
    { id: 'cat_ops_manut', name: 'Manutenção Predial', parentId: 'cat_ops_root', type: 'expense' },
    { id: 'cat_ops_util', name: 'Utilidades (Luz/Água/Net)', parentId: 'cat_ops_root', type: 'expense' },

    // Administrativo (Nível 2)
    { id: 'cat_adm_root', name: 'Despesas Administrativas', parentId: 'cat_desp_root', type: 'expense', isSystemDefault: true },
    { id: 'cat_adm_sys', name: 'Sistemas & Software', parentId: 'cat_adm_root', type: 'expense' },
    { id: 'cat_adm_cont', name: 'Contabilidade & Jurídico', parentId: 'cat_adm_root', type: 'expense' },

    // Impostos (Nível 2)
    { id: 'cat_tax_root', name: 'Impostos sobre Nota', parentId: 'cat_desp_root', type: 'expense', isSystemDefault: true },
];

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'Casa Repouso Matriz (Centro)', type: BranchType.MATRIZ },
  { id: 'b2', name: 'Unidade Jardim (Filial)', type: BranchType.FILIAL },
];

// 1. RESIDENTES (DADOS CLÍNICOS E IDENTIDADE)
export const MOCK_RESIDENTS: Resident[] = [
  {
    id: 'res-1',
    name: 'Dona Maria Silva',
    photo: 'https://images.unsplash.com/photo-1551843021-d85697295d5c?auto=format&fit=crop&q=80&w=200&h=200',
    age: 82,
    birthDate: '1941-05-15',
    branchId: 'b1',
    status: 'Ativo',
    careLevel: 3,
    admissionDate: '2022-10-15', 
    medicalRecord: {
      bloodType: 'O+',
      allergies: ['DIPIRONA', 'PENICILINA'],
      comorbidities: ['Hipertensão Arterial', 'Diabetes Tipo 2', 'Alzheimer Inicial'],
      contacts: [
        { name: 'Roberto Silva', relation: 'Filho', phone: '(11) 99999-9999', isFinancialResponsible: true, isEmergencyContact: true },
        { name: 'Dr. Claudio (Geriatra)', relation: 'Médico Particular', phone: '(11) 98888-8888', isEmergencyContact: true }
      ],
      lastVitals: { 
        pressure: '140/90', pressureTrend: 'up',
        glucose: '110 mg/dL', glucoseTrend: 'stable',
        heartRate: 78, heartRateTrend: 'down',
        date: 'Hoje, 08:00' 
      }
    }
  },
  {
    id: 'res-2',
    name: 'Sr. João Santos',
    photo: 'https://images.unsplash.com/photo-1545167622-3a6ac156bb37?auto=format&fit=crop&q=80&w=200&h=200',
    age: 75,
    birthDate: '1948-03-20',
    branchId: 'b2',
    status: 'Ativo',
    careLevel: 1,
    admissionDate: '2023-01-10',
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

// 2. PERFIS FINANCEIROS (DADOS CONTRATUAIS SEGREGADOS)
export const MOCK_FINANCIAL_PROFILES: ResidentFinancialProfile[] = [
  {
    id: 'fin-res-1',
    residentId: 'res-1',
    benefitValue: 550000,
    feeConfig: {
      baseValue: 400000,
      careLevelAdjustment: 150000,
      fixedExtras: 0,
      discount: 0,
      notes: 'Valor ajustado conforme IPCA anual em Outubro.',
      paymentDay: 5
    }
  },
  {
    id: 'fin-res-2',
    residentId: 'res-2',
    benefitValue: 350000,
    feeConfig: {
      baseValue: 350000,
      careLevelAdjustment: 0, 
      fixedExtras: 10000,
      discount: 0,
      notes: 'Pagamento via boleto.',
      paymentDay: 10
    }
  },
  {
    id: 'fin-res-3',
    residentId: 'res-3',
    benefitValue: 600000,
    feeConfig: {
      baseValue: 400000,
      careLevelAdjustment: 200000, 
      fixedExtras: 0,
      discount: 0,
      notes: 'Adicional de Enfermagem 24h incluso.',
      paymentDay: 5
    }
  }
];

export const MOCK_PRESCRIPTIONS: Prescription[] = [
    { id: 'p1', residentId: 'res-1', medication: 'Losartana', dosage: '50mg', times: ['08:00', '20:00'], active: true },
    { id: 'p2', residentId: 'res-1', medication: 'Metformina', dosage: '850mg', times: ['12:00'], instructions: 'Após o almoço', active: true },
    { id: 'p3', residentId: 'res-1', medication: 'Quetiapina', dosage: '25mg', times: ['21:00'], active: true }
];

export const MOCK_STOCK: StockItem[] = [
    { id: 's1', residentId: 'res-1', name: 'Fralda Geriátrica G', category: 'hygiene', quantity: 18, unit: 'unidades', minThreshold: 20, avgConsumption: '4/dia', unitPrice: 250 },
    { id: 's2', residentId: 'res-1', name: 'Lenço Umedecido', category: 'hygiene', quantity: 2, unit: 'pacotes', minThreshold: 1, avgConsumption: '1 pcte/sem', unitPrice: 890 },
    { id: 's3', residentId: 'res-1', name: 'Losartana 50mg', category: 'medication', quantity: 14, unit: 'comprimidos', minThreshold: 10, avgConsumption: '2/dia', unitPrice: 35 }
];

export const MOCK_EVOLUTIONS: Evolution[] = [
    { id: 'e1', residentId: 'res-1', date: '2023-10-24 08:30', author: 'Enf. Ana', role: 'Enfermeira', type: 'nursing', content: 'Paciente aceitou bem o café da manhã. Apresentou leve confusão mental ao acordar, mas se acalmou após higiene.' },
    { id: 'e2', residentId: 'res-1', date: '2023-10-23 20:00', author: 'Carlos Lima', role: 'Cuidador', type: 'nursing', content: 'Banho de aspersão realizado sem intercorrências. Administrado medicação noturna.' },
    { id: 'e3', residentId: 'res-1', date: '2023-10-23 10:00', author: 'Dr. Pedro', role: 'Médico', type: 'medical', content: 'Ajuste na dose de Losartana devido a picos pressóricos noturnos.' }
];

export const MOCK_DOCUMENTS: ResidentDocument[] = [
    { id: 'doc-1', residentId: 'res-1', title: 'Contrato de Prestação de Serviços', category: 'contract', url: 'https://placehold.co/400x500?text=CONTRATO+ASSINADO', type: 'image', createdAt: '2022-10-15' },
    { id: 'doc-2', residentId: 'res-1', title: 'RG e CPF', category: 'identity', url: 'https://placehold.co/400x300?text=RG+FRENTE+VERSO', type: 'image', createdAt: '2022-10-15' }
];

export const MOCK_STAFF: Staff[] = [
  {
    id: 'stf-1',
    name: 'Enf. Ana Souza',
    role: 'Enfermeiro Chefe',
    branchId: 'b1',
    active: true,
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    personalInfo: {
      cpf: '123.456.789-00',
      rg: '12.345.678-9',
      birthDate: '1985-04-12',
      phone: '(11) 99876-5432',
      email: 'ana.souza@appcare.com',
      address: 'Rua das Flores, 123, Centro',
      maritalStatus: 'casado',
      childrenCount: 2
    },
    contractInfo: {
      admissionDate: '2020-03-01',
      jobTitle: 'Enfermeira Chefe',
      department: 'enfermagem',
      scale: '12x36',
      workShift: 'diurno'
    },
    systemAccess: {
        allowed: true,
        accessLevel: 'admin',
        loginEmail: 'ana.souza@appcare.com',
        lastLogin: '2023-10-25T08:30:00.000Z'
    },
    financialInfo: {
      baseSalary: 450000, // R$ 4.500,00
      insalubridadeLevel: 20,
      bankInfo: {
        banco: 'Itaú (341)',
        agencia: '1234',
        conta: '56789-0',
        pixKeyType: 'cpf',
        pixKey: '123.456.789-00'
      }
    },
    benefits: {
        receivesTransportVoucher: true,
        transportVoucherDailyQty: 2,
        transportVoucherUnitValue: 550, // R$ 5,50
        receivesMealVoucher: true
    },
    dependents: [
        { id: 'dep-1', name: 'Lucas Souza', birthDate: '2015-05-20', relation: 'filho' },
        { id: 'dep-2', name: 'Julia Souza', birthDate: '2018-10-10', relation: 'filho' }
    ],
    professionalInfo: {
      corenNumber: '123456-SP',
      corenState: 'SP'
    }
  },
  {
    id: 'stf-2',
    name: 'Carlos Lima',
    role: 'Cuidador',
    branchId: 'b1',
    active: true,
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
    personalInfo: {
      cpf: '234.567.890-11',
      rg: '23.456.789-0',
      birthDate: '1990-08-20',
      phone: '(11) 98765-4321',
      email: 'carlos.lima@appcare.com',
      address: 'Av. Paulista, 1000, Apto 50',
      maritalStatus: 'solteiro',
      childrenCount: 0
    },
    contractInfo: {
      admissionDate: '2022-06-15',
      jobTitle: 'Cuidador de Idosos',
      department: 'enfermagem',
      scale: '12x36',
      workShift: 'noturno'
    },
    systemAccess: {
        allowed: false,
        accessLevel: 'basico',
        loginEmail: ''
    },
    financialInfo: {
      baseSalary: 180000, // R$ 1.800,00
      insalubridadeLevel: 40, 
      bankInfo: {
        banco: 'Banco do Brasil (001)',
        agencia: '4321',
        conta: '98765-X',
        pixKeyType: 'aleatoria',
        pixKey: '7f93b2a1-c840-4b2e-9d8a-1234567890ab'
      }
    },
    benefits: {
        receivesTransportVoucher: true,
        transportVoucherDailyQty: 2,
        transportVoucherUnitValue: 600, 
        receivesMealVoucher: false 
    },
    professionalInfo: {
      corenState: 'SP'
    }
  },
  {
    id: 'stf-3',
    name: 'Marta Rocha',
    role: 'Cozinheira',
    branchId: 'b2',
    active: true,
    personalInfo: {
      cpf: '345.678.901-22',
      rg: '34.567.890-1',
      birthDate: '1978-02-10',
      phone: '(11) 91234-1234',
      email: 'marta.cozinha@appcare.com',
      address: 'Rua do Bosque, 50, Jardim',
      maritalStatus: 'viuvo',
      childrenCount: 3
    },
    contractInfo: {
      admissionDate: '2019-01-10',
      jobTitle: 'Cozinheira Líder',
      department: 'cozinha',
      scale: '6x1',
      workShift: 'diurno'
    },
    systemAccess: {
        allowed: true,
        accessLevel: 'basico',
        loginEmail: 'marta.cozinha@appcare.com',
        lastLogin: null 
    },
    financialInfo: {
      baseSalary: 220000, // R$ 2.200,00
      insalubridadeLevel: 0,
      bankInfo: {
        banco: 'Caixa (104)',
        agencia: '0987',
        conta: '1234-5',
        pixKeyType: 'email',
        pixKey: 'marta.cozinha@appcare.com'
      }
    },
    benefits: {
        receivesTransportVoucher: false, 
        receivesMealVoucher: true
    }
  }
];

export const MOCK_STAFF_DOCUMENTS: StaffDocument[] = [
  {
    id: 'sdoc-1',
    staffId: 'stf-1', 
    title: 'ASO Periódico 2023',
    category: 'aso',
    url: 'https://placehold.co/400x500?text=ASO+VALIDO',
    type: 'pdf',
    createdAt: '2023-03-01',
    expirationDate: '2024-03-01'
  },
  {
    id: 'sdoc-2',
    staffId: 'stf-2', 
    title: 'Carteira de Vacinação',
    category: 'medical',
    url: 'https://placehold.co/400x500?text=VACINAS',
    type: 'image',
    createdAt: '2022-06-15'
  }
];

export const MOCK_STAFF_INCIDENTS: StaffIncident[] = [
  {
    id: 'sinc-1',
    staffId: 'stf-3', 
    type: 'atestado',
    date: '2023-09-10',
    description: 'Atestado médico de 2 dias por gripe forte.',
    attachmentUrl: 'https://placehold.co/400x500?text=ATESTADO',
    createdAt: '2023-09-10',
    financialImpact: 0
  },
  {
    id: 'sinc-2',
    staffId: 'stf-2', 
    type: 'atraso',
    date: '2023-10-01',
    description: 'Atraso de 40min no início do plantão noturno devido a problemas no transporte.',
    createdAt: '2023-10-01',
    financialImpact: -500 // - R$ 5,00
  }
];

export const MOCK_INVOICES: Invoice[] = MOCK_RESIDENTS.map((r, i) => {
  // Busca o perfil financeiro separado
  const financialProfile = MOCK_FINANCIAL_PROFILES.find(fp => fp.residentId === r.id);
  const feeConfig = financialProfile?.feeConfig;
  
  // Recalcula totais usando centavos do perfil financeiro
  const baseAmount = feeConfig ? (feeConfig.baseValue + feeConfig.careLevelAdjustment + feeConfig.fixedExtras - feeConfig.discount) : (financialProfile?.benefitValue || 0);
  
  // Atualizado para usar string ID da categoria (cat_rec_mensal)
  const items: InvoiceItem[] = [{ id: `item-base-${i}`, invoiceId: `inv-${i}`, description: 'Mensalidade Base', amount: baseAmount, category: 'cat_rec_mensal', date: '2023-10-01' }];
  const status = i === 0 ? 'pending' : 'paid';
  return { 
    id: `inv-${i}`, 
    type: 'income', 
    residentId: r.id, 
    month: 10, 
    year: 2023, 
    status: status as 'overdue' | 'pending' | 'paid', 
    dueDate: '2023-10-05', 
    totalAmount: baseAmount, 
    items,
    payments: [] 
  };
});
