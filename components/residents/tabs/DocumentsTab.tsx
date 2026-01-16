
import React, { useState } from 'react';
import { Resident, ResidentDocument, DocumentCategory } from '../../../types';
import { FileText, Image as ImageIcon, Trash2, Eye, Plus, UploadCloud, X, FileCheck, Stethoscope, UserSquare2 } from 'lucide-react';

interface DocumentsTabProps {
  resident: Resident;
  onUpdateResident: (updated: Resident) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ resident, onUpdateResident }) => {
  const { documents = [] } = resident;
  const [filter, setFilter] = useState<DocumentCategory | 'all'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Upload State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>('other');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- HANDLERS ---
  const handleFileUpload = () => {
    if (!selectedFile || !newDocTitle) return;

    const newDoc: ResidentDocument = {
        id: `doc-${Date.now()}`,
        title: newDocTitle,
        category: newDocCategory,
        url: URL.createObjectURL(selectedFile), // Mock URL
        type: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
        createdAt: new Date().toISOString().split('T')[0]
    };

    onUpdateResident({
        ...resident,
        documents: [...documents, newDoc]
    });

    // Reset
    setIsUploadOpen(false);
    setNewDocTitle('');
    setSelectedFile(null);
  };

  const handleDelete = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este documento?')) {
          const updatedDocs = documents.filter(d => d.id !== id);
          onUpdateResident({ ...resident, documents: updatedDocs });
      }
  };

  const filteredDocs = documents.filter(d => filter === 'all' || d.category === filter);

  // --- ICONS MAP ---
  const getCategoryIcon = (cat: DocumentCategory) => {
      switch (cat) {
          case 'contract': return <FileCheck className="w-4 h-4 text-emerald-600" />;
          case 'identity': return <UserSquare2 className="w-4 h-4 text-blue-600" />;
          case 'medical': return <Stethoscope className="w-4 h-4 text-rose-600" />;
          default: return <FileText className="w-4 h-4 text-gray-600" />;
      }
  };

  const getCategoryLabel = (cat: string) => {
      switch (cat) {
          case 'contract': return 'Contratos';
          case 'identity': return 'Pessoais';
          case 'medical': return 'Médicos';
          default: return 'Outros';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
       
       {/* Actions Bar */}
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
           <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
               {['all', 'contract', 'identity', 'medical', 'other'].map((cat) => (
                   <button 
                     key={cat}
                     onClick={() => setFilter(cat as any)}
                     className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors whitespace-nowrap
                       ${filter === cat ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                     `}
                   >
                       {cat === 'all' ? 'Todos' : getCategoryLabel(cat)}
                   </button>
               ))}
           </div>
           <button 
             onClick={() => setIsUploadOpen(true)}
             className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
           >
               <Plus className="w-5 h-5" /> Novo Documento
           </button>
       </div>

       {/* Grid */}
       {filteredDocs.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
               {filteredDocs.map(doc => (
                   <div key={doc.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col relative">
                       {/* Preview Area */}
                       <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                           {doc.type === 'image' ? (
                               <img src={doc.url} alt={doc.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                           ) : (
                               <FileText className="w-16 h-16 text-gray-300" />
                           )}
                           
                           {/* Overlay Actions */}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                               <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 bg-white/90 rounded-full hover:bg-white text-gray-800" title="Visualizar">
                                   <Eye className="w-5 h-5" />
                               </a>
                               <button onClick={() => handleDelete(doc.id)} className="p-2 bg-white/90 rounded-full hover:bg-red-50 text-red-600" title="Excluir">
                                   <Trash2 className="w-5 h-5" />
                               </button>
                           </div>
                       </div>

                       {/* Info Area */}
                       <div className="p-4 flex-1 flex flex-col justify-between">
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   {getCategoryIcon(doc.category)}
                                   <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">{getCategoryLabel(doc.category)}</span>
                               </div>
                               <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2" title={doc.title}>{doc.title}</h4>
                           </div>
                           <p className="text-xs text-gray-400 mt-2">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
                       </div>
                   </div>
               ))}
           </div>
       ) : (
           <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
               <UploadCloud className="w-12 h-12 mb-3 text-gray-300" />
               <p className="font-semibold">Nenhum documento encontrado.</p>
               <p className="text-sm">Faça upload de contratos, exames ou documentos pessoais.</p>
           </div>
       )}

       {/* --- MODAL UPLOAD --- */}
       {isUploadOpen && (
           <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-lg font-bold text-gray-900">Novo Documento</h3>
                       <button onClick={() => setIsUploadOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                   </div>

                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Título do Documento</label>
                           <input 
                             className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Ex: Contrato 2023 Assinado"
                             value={newDocTitle}
                             onChange={e => setNewDocTitle(e.target.value)}
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                           <select 
                             className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none bg-white"
                             value={newDocCategory}
                             onChange={e => setNewDocCategory(e.target.value as any)}
                           >
                               <option value="contract">Contrato</option>
                               <option value="identity">Documentos Pessoais (RG/CPF)</option>
                               <option value="medical">Médico (Receitas/Exames)</option>
                               <option value="other">Outros</option>
                           </select>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Arquivo</label>
                           <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                               <input 
                                 type="file" 
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                 onChange={e => e.target.files && setSelectedFile(e.target.files[0])}
                                 accept="image/*,.pdf"
                               />
                               {selectedFile ? (
                                   <div className="flex flex-col items-center text-blue-600">
                                       <FileCheck className="w-8 h-8 mb-2" />
                                       <span className="font-bold text-sm">{selectedFile.name}</span>
                                   </div>
                               ) : (
                                   <div className="flex flex-col items-center text-gray-400">
                                       <UploadCloud className="w-8 h-8 mb-2" />
                                       <span className="text-sm font-medium">Clique para selecionar</span>
                                       <span className="text-xs text-gray-300 mt-1">PDF, JPG ou PNG</span>
                                   </div>
                               )}
                           </div>
                       </div>

                       <button 
                         onClick={handleFileUpload}
                         disabled={!selectedFile || !newDocTitle}
                         className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                       >
                           Salvar Documento
                       </button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
