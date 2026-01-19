
import React, { useState, useMemo } from 'react';
import { Staff, StaffDocument, StaffDocumentCategory } from '../../types';
import { FileText, Eye, Trash2, Plus, UploadCloud, X, Loader2, Calendar, FolderTree } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { generateStoragePath } from '../../lib/utils';
import { BRANCHES } from '../../constants';

interface StaffDocumentsTabProps {
  staff: Staff;
  documents: StaffDocument[];
  onUpdateDocuments: (docs: StaffDocument[]) => void;
}

export const StaffDocumentsTab: React.FC<StaffDocumentsTabProps> = ({ staff, documents, onUpdateDocuments }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StaffDocumentCategory>('other');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Calcula o caminho de armazenamento em tempo real
  const storagePath = useMemo(() => {
    const branchName = BRANCHES.find(b => b.id === staff.branchId)?.name || 'Geral';
    // Mapeia categoria para nome de pasta amigável
    const categoryFolderMap: Record<string, string> = {
        aso: 'Saude_ASO',
        contract: 'Contratos',
        identity: 'Documentos_Pessoais',
        certification: 'Certificacoes',
        warning: 'Ocorrencias',
        medical: 'Atestados',
        other: 'Outros'
    };
    const folderName = categoryFolderMap[category] || 'Geral';
    
    return generateStoragePath(branchName, staff.role, staff.name, folderName);
  }, [staff, category]);

  const handleUpload = async () => {
    if (!selectedFile || !title) return;
    setIsProcessing(true);
    try {
        const newDoc = await dataService.addStaffDocument(
            staff.id,
            title,
            category,
            selectedFile,
            expirationDate || undefined,
            storagePath // Passa o caminho gerado
        );
        onUpdateDocuments([...documents, newDoc]);
        setIsUploadOpen(false);
        // Reset
        setTitle('');
        setCategory('other');
        setExpirationDate('');
        setSelectedFile(null);
    } catch (e: any) {
        alert("Erro ao enviar documento.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Remover documento?")) return;
      try {
          await dataService.deleteStaffDocument(id);
          onUpdateDocuments(documents.filter(d => d.id !== id));
      } catch (e) {
          alert("Erro ao excluir.");
      }
  };

  const getCategoryLabel = (cat: string) => {
      const map: Record<string, string> = {
          aso: 'ASO / Exame',
          contract: 'Contrato',
          identity: 'Documento Pessoal',
          certification: 'Certificado',
          warning: 'Advertência',
          medical: 'Médico',
          other: 'Outro'
      };
      return map[cat] || cat;
  };

  const isExpired = (dateStr?: string) => {
      if (!dateStr) return false;
      return new Date(dateStr) < new Date();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
       
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <FileText className="w-5 h-5 text-blue-600" /> Documentação Digital
           </h3>
           <button 
             onClick={() => setIsUploadOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
           >
               <Plus className="w-4 h-4" /> Novo Arquivo
           </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {documents.map(doc => {
               const expired = isExpired(doc.expirationDate);
               return (
                   <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all group relative">
                       <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                           <FileText className="w-6 h-6 text-gray-400" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                               <p className="font-bold text-gray-900 text-sm truncate pr-6">{doc.title}</p>
                               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-white pl-2">
                                   <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4"/></a>
                                   <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                               </div>
                           </div>
                           <p className="text-xs text-gray-500 font-medium uppercase mt-0.5">{getCategoryLabel(doc.category)}</p>
                           {doc.expirationDate && (
                               <p className={`text-xs mt-2 font-bold flex items-center gap-1 ${expired ? 'text-red-600' : 'text-emerald-600'}`}>
                                   <Calendar className="w-3 h-3" /> 
                                   {expired ? 'Expirou em: ' : 'Vence em: '} 
                                   {new Date(doc.expirationDate).toLocaleDateString('pt-BR')}
                               </p>
                           )}
                       </div>
                   </div>
               );
           })}
           {documents.length === 0 && (
               <div className="col-span-full py-10 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                   <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                   <p>Nenhum documento anexado.</p>
               </div>
           )}
       </div>

       {/* Modal Upload */}
       {isUploadOpen && (
           <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-lg font-bold text-gray-900">Novo Documento</h3>
                       <button onClick={() => setIsUploadOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                   </div>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                           <input className="w-full border rounded-lg px-3 py-2 outline-none" placeholder="Ex: Contrato de Trabalho" value={title} onChange={e => setTitle(e.target.value)} />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                               <select className="w-full border rounded-lg px-3 py-2 outline-none bg-white" value={category} onChange={e => setCategory(e.target.value as any)}>
                                   <option value="aso">ASO</option>
                                   <option value="contract">Contrato</option>
                                   <option value="identity">Documentos</option>
                                   <option value="certification">Certificação</option>
                                   <option value="warning">Advertência</option>
                                   <option value="other">Outro</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Validade (Opcional)</label>
                               <input type="date" className="w-full border rounded-lg px-3 py-2 outline-none" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                           </div>
                       </div>

                       {/* Exibição da Pasta Inteligente */}
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-3">
                            <FolderTree className="w-5 h-5 text-slate-500 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Salvando em:</p>
                                <p className="text-sm font-mono text-slate-700 break-all">{storagePath}/</p>
                            </div>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Arquivo</label>
                           <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={e => e.target.files && setSelectedFile(e.target.files[0])} />
                       </div>

                       <button 
                         onClick={handleUpload}
                         disabled={isProcessing || !selectedFile || !title}
                         className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                       >
                           {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Documento'}
                       </button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
