
import React, { useState, useEffect, useMemo } from 'react';
import { Pill, Clock, CheckCircle, XCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { Resident, Prescription, MedicationLog } from '../../types';
import { dataService } from '../../services/dataService';
import { formatTime } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface MedicationScheduleProps {
  residents: Resident[];
}

export const MedicationSchedule: React.FC<MedicationScheduleProps> = ({ residents }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega logs existentes ao montar o componente
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await dataService.getMedicationLogs();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  // Define o que é "Horário Atual" para pendências (janela de 2h)
  const pendingMeds = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    const allPending: Array<{ 
      resident: Resident; 
      prescription: Prescription; 
      time: string;
      uniqueId: string;
    }> = [];

    residents.forEach(res => {
      res.prescriptions?.forEach(p => {
        if (!p.active) return;
        
        p.times.forEach(t => {
          const [h] = t.split(':').map(Number);
          
          // Verifica se está na janela (1h antes ou 1h depois da hora cheia atual)
          const inWindow = Math.abs(h - currentHour) <= 1;
          
          if (inWindow) {
            const uniqueId = `${p.id}-${t}-${new Date().toISOString().split('T')[0]}`;
            // Se já não existe um log para esse ID único (prescrição + hora + data de hoje)
            const alreadyDone = logs.some(l => 
                l.prescriptionId === p.id && 
                l.scheduledTime === t && 
                l.administeredAt.startsWith(new Date().toISOString().split('T')[0])
            );

            if (!alreadyDone) {
              allPending.push({ resident: res, prescription: p, time: t, uniqueId });
            }
          }
        });
      });
    });

    return allPending.sort((a, b) => a.time.localeCompare(b.time));
  }, [residents, logs]);

  const handleAdminister = async (item: typeof pendingMeds[0], status: 'administered' | 'refused') => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const newLog = await dataService.registerMedicationAdmin({
        prescriptionId: item.prescription.id,
        administeredAt: new Date().toISOString(),
        administeredBy: user?.name || 'Sistema',
        status,
        scheduledTime: item.time,
        notes: status === 'refused' ? 'Recusado pelo residente' : undefined
      });

      setLogs(prev => [...prev, newLog]);
    } catch (error: any) {
      alert("Erro ao registrar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Checagem para o Horário Atual
          </h3>
          <p className="text-xs text-gray-500 font-medium">Janela: {new Date().getHours()}:00 ± 1h</p>
        </div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
          {pendingMeds.length} Pendentes
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {pendingMeds.length > 0 ? pendingMeds.map((item) => (
          <div key={item.uniqueId} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
             <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-14 bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Hora</span>
                    <span className="text-sm font-extrabold text-gray-900">{item.time}</span>
                </div>
                
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                    {item.resident.photo ? <img src={item.resident.photo} className="w-full h-full object-cover" /> : <User className="w-5 h-5 m-2.5 text-gray-300" />}
                </div>

                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-gray-900 truncate">{item.resident.name}</p>
                   <p className="text-xs text-blue-600 font-semibold truncate flex items-center gap-1">
                      <Pill className="w-3 h-3" /> {item.prescription.medication} ({item.prescription.dosage})
                   </p>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleAdminister(item, 'refused')}
                  disabled={isProcessing}
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                  title="Recusado"
                >
                   <XCircle className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => handleAdminister(item, 'administered')}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                   {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                   Confirmar
                </button>
             </div>
          </div>
        )) : (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-bold">Parabéns!</p>
            <p className="text-sm text-gray-400">Todos os medicamentos deste horário foram ministrados.</p>
          </div>
        )}
      </div>
      
      {pendingMeds.length > 0 && (
          <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
             <p className="text-[11px] text-amber-800 leading-tight">
                <strong>Aviso:</strong> Confirmar a administração realizará automaticamente a baixa de 1 unidade no estoque do residente correspondente.
             </p>
          </div>
      )}
    </div>
  );
};
