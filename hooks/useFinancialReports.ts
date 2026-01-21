
import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { dataService } from '../services/dataService';
import { InvoiceStatus, FinancialCategory } from '../types';
import { DEFAULT_PLAN_OF_ACCOUNTS } from '../constants';

export interface DRENode {
  category: FinancialCategory;
  value: number;
  children: DRENode[];
}

export interface DREResult {
  tree: DRENode[]; // Árvore hierárquica
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  variableCosts: number;
  operationalExpenses: number;
  ebitda: number;
  netResult: number;
}

export const useFinancialReports = (month: number, year: number) => {
  const { invoices } = useData();
  const [dre, setDre] = useState<DREResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper para construir a árvore recursivamente
  const buildTree = (
    categories: FinancialCategory[], 
    parentId: string | null = null, 
    valuesMap: Record<string, number>
  ): DRENode[] => {
    return categories
      .filter(cat => (cat.parentId || null) === parentId) // Encontra filhos diretos
      .map(cat => {
        const children = buildTree(categories, cat.id, valuesMap);
        
        // Valor do nó = Valor direto + Soma dos filhos
        const directValue = valuesMap[cat.id] || 0;
        const childrenValue = children.reduce((acc, child) => acc + child.value, 0);
        
        return {
          category: cat,
          value: directValue + childrenValue,
          children
        };
      });
  };

  useEffect(() => {
    const generateDRE = async () => {
      setLoading(true);
      try {
        // 1. Inicializa mapa de valores zerado
        const valuesMap: Record<string, number> = {};
        DEFAULT_PLAN_OF_ACCOUNTS.forEach(cat => { valuesMap[cat.id] = 0; });

        // 2. Processa Faturas (Receitas e Despesas Fixas)
        invoices.forEach(inv => {
            if (inv.month === month && inv.year === year && inv.status !== InvoiceStatus.OVERDUE) {
                inv.items.forEach(item => {
                    if (item.category && valuesMap.hasOwnProperty(item.category)) {
                        valuesMap[item.category] += item.amount;
                    }
                });
            }
        });

        // 3. Processa Movimentos Financeiros (Custos Variáveis / Estoque)
        // Estes movimentos devem ter um categoryId vinculado ao plano de contas (ex: cat_ops_farm)
        const movements = await dataService.getFinancialMovements(month, year);
        movements.forEach(mov => {
            // Se o movimento não tiver categoria explícita, assumimos 'cat_ops_farm' como fallback para stock_usage
            const catId = mov.categoryId || (mov.type === 'stock_usage' ? 'cat_ops_farm' : null);
            if (catId && valuesMap.hasOwnProperty(catId)) {
                valuesMap[catId] += mov.amount;
            }
        });

        // 4. Monta a Árvore Hierárquica
        const tree = buildTree(DEFAULT_PLAN_OF_ACCOUNTS, null, valuesMap);

        // 5. Extrai KPIs do DRE (Flattened access for ease)
        // Helper para buscar valor total de um nó raiz pelo ID
        const getValue = (rootId: string) => tree.find(n => n.category.id === rootId)?.value || 0;

        const grossRevenue = getValue('cat_rec_root'); // Receita Bruta
        const taxes = getValue('cat_tax_root') || Math.round(grossRevenue * 0.06); // Fallback simulado se não houver lançamentos reais
        const operationalExpenses = getValue('cat_desp_root'); // Total Despesas
        
        // Net Revenue
        const netRevenue = grossRevenue - taxes;

        // Custos Variáveis (Ex: Farmácia + Alimentação)
        // Aqui assumimos que Farmácia e Alimentação são variáveis, mas estão dentro de Operacional na árvore padrão.
        // Para o cálculo do EBITDA, EBITDA = Receita Líquida - (Despesas Operacionais + Custo Pessoal)
        // Como nossa árvore 'cat_desp_root' já soma tudo (Pessoal + Operacional + Adm), o cálculo é direto.
        const ebitda = netRevenue - operationalExpenses;

        // Custos Variáveis isolados (para KPI de margem de contribuição, se necessário)
        const variableCosts = getValue('cat_ops_farm') + getValue('cat_ops_alim');

        setDre({
          tree,
          grossRevenue,
          taxes,
          netRevenue,
          variableCosts,
          operationalExpenses,
          ebitda,
          netResult: ebitda // Simplificado (sem amortização/juros)
        });

      } catch (error) {
        console.error("Erro ao gerar DRE:", error);
      } finally {
        setLoading(false);
      }
    };

    generateDRE();
  }, [invoices, month, year]);

  return { dre, loading };
};
