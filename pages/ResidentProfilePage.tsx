
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResidentProfile } from '../components/residents/ResidentProfile.tsx';
import { dataService } from '../services/dataService.ts';
import { Resident, Prescription, StockItem, Evolution, ResidentDocument, Invoice } from '../types.ts';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext.tsx';

export const ResidentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logAction } = useData(); // Acesso ao contexto global para logs

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [resident, setResident] = useState<Resident | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [documents, setDocuments] = useState<ResidentDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const loadResidentFullData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      try {
        // Busca paralela de todos os dados relacionados ao id
        const [res, prescs, stock, evs, docs, allInvoices] = await Promise.all([
          dataService.getResidentById(id),
          dataService.getPrescriptionsByResident(id),
          dataService.getStockByResident(id),
          dataService.getEvolutionsByResident(id),
          dataService.getDocumentsByResident(id),
          dataService.getInvoices()
        ]);

        setResident(res);
        setPrescriptions(prescs);
        setStockItems(stock);
        setEvolutions(evs);
        setDocuments(docs);
        setInvoices(allInvoices.filter(inv => inv.residentId === id));
      } catch (err: any) {
        console.error("Erro ao carregar prontuário:", err);
        setError(err.message || "Falha ao carregar dados do residente.");
      } finally {
        setLoading(false);
      }
    };

    loadResidentFullData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Carregando prontuário completo...</p>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center px-4">
        <div className="bg-red-50 p-6 rounded-full">
           <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Residente Não Encontrado</h2>
          <p className="text-gray-500 max-w-md mx-auto">{error || "Não conseguimos localizar o cadastro solicitado. Verifique o link ou procure na listagem."}</p>
        </div>
        <button 
          onClick={() => navigate('/residentes')} 
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar para a Listagem
        </button>
      </div>
    );
  }

  return (
    <ResidentProfile 
      resident={resident} 
      prescriptions={prescriptions}
      stock={stockItems}
      evolutions={evolutions}
      documents={documents}
      invoices={invoices}
      onBack={() => navigate('/residentes')} 
      onUpdateResident={(updated) => setResident(updated)}
      onUpdatePrescriptions={setPrescriptions}
      onUpdateStock={setStockItems}
      onUpdateDocuments={setDocuments}
      // Fix: Use 'logAction' from destructuring instead of undefined 'onLogAction'
      onLogAction={logAction}
      onAddEvolution={(resId, content, type) => {
          // Lógica local para atualização imediata da UI de evoluções
          const newEv: Evolution = {
              id: `ev-${Date.now()}`,
              residentId: resId,
              date: new Date().toLocaleString('pt-BR'),
              author: 'Usuário Logado', 
              role: 'Profissional',
              content,
              type
          };
          setEvolutions(prev => [newEv, ...prev]);
      }}
    />
  );
};
