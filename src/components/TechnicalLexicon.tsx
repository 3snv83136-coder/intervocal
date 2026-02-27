import React, { useState } from 'react';
import { TECHNICAL_TERMS } from '../constants';

const TechnicalLexicon: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState("");
  
  if (!isOpen) return null;

  const filteredTerms = TECHNICAL_TERMS.filter(t => 
    t.term.toLowerCase().includes(search.toLowerCase()) || 
    t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 bg-[#00334e] text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Lexique Technique</h3>
            <p className="text-xs opacity-80 font-bold">Termes métier du débouchage</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <input 
            type="text" 
            placeholder="Rechercher un terme..." 
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {filteredTerms.map((t, i) => (
            <div key={i} className="border-b border-slate-50 pb-3 last:border-0">
              <h4 className="font-black text-blue-800 text-sm uppercase">{t.term}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.definition}</p>
            </div>
          ))}
          {filteredTerms.length === 0 && (
            <p className="text-center text-slate-400 text-xs py-10 italic">Aucun terme trouvé.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalLexicon;